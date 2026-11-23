import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SummarySection from './components/SummarySection';
import Footer from './components/Footer';
import ReportEntry from './components/ReportEntry';

const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE = `http://${API_HOST}:5050/api`;

function App() {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDate = urlParams.get('date');
      if (urlDate) return urlDate;
    }
    return localStorage.getItem('mpod_selected_date') || '2026-10-22';
  });
  const [operationsData, setOperationsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('mpod_theme') || 'dark');
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [loading, setLoading] = useState(true);

  // V2 Navigation View state: 'dashboard' or 'report_entry'
  const [view, setView] = useState('dashboard');

  const handleBackToDashboard = async (dateToLoad) => {
    const targetDate = dateToLoad || selectedDate;
    setSelectedDate(targetDate);
    localStorage.setItem('mpod_selected_date', targetDate);
    setView('dashboard');
    await fetchData(targetDate);
  };

  // Sync selectedDate to localStorage
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    localStorage.setItem('mpod_selected_date', newDate);
  };

  // Set theme attribute on HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mpod_theme', theme);
  }, [theme]);

  // Keep outer viewport fixed without document scrollbars
  useEffect(() => {
    document.body.classList.remove('scrollable-body');
    window.scrollTo(0, 0);
  }, [view]);

  // Fetch data function
  const fetchData = async (dateStr) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/operations?date=${dateStr}`);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();

      // Fetch global alerts collection
      try {
        const alertsRes = await fetch(`${API_BASE}/alerts`);
        if (alertsRes.ok) {
          const alertItems = await alertsRes.json();
          if (Array.isArray(alertItems) && alertItems.length > 0) {
            data.alerts = alertItems.map(item => typeof item === 'string' ? item : item.text);
          }
        }
      } catch (err) {
        console.log('Global alerts fetch note:', err.message);
      }

      setOperationsData(data);

      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setLastUpdated(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data when date changes
  useEffect(() => {
    fetchData(selectedDate);
    setRefreshCountdown(30);
  }, [selectedDate]);

  // 1-second interval to handle refresh countdown
  useEffect(() => {
    if (view !== 'dashboard') return;

    const timer = setInterval(() => {
      // Auto Refresh Countdown
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchData(selectedDate);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedDate, view]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSaveData = async (updatedData) => {
    try {
      const res = await fetch(`${API_BASE}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to save data');
      const savedData = await res.json();
      setOperationsData(savedData);
      setSelectedDate(updatedData.date); // Sync date picker

      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setLastUpdated(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`);
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Error saving data to MongoDB server');
    }
  };

  // Date Fetching Helper specifically for ReportEntry page to load existing data
  const handleFetchReportData = async (dateStr) => {
    try {
      const res = await fetch(`${API_BASE}/operations?date=${dateStr}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Error fetching report data:', err);
    }
    return null;
  };

  // Check if report status is Draft (to show warning banners)
  const isDraftStatus = operationsData?.status === 'Draft';

  const handleUpdateAlerts = async (newAlerts) => {
    // Refresh Last Updated timestamp
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    setLastUpdated(formattedTime);

    setOperationsData(prev => prev ? { ...prev, alerts: newAlerts } : prev);

    try {
      // 1. Sync to global alerts collection
      await fetch(`${API_BASE}/alerts/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts: newAlerts })
      });

      // 2. Sync to current operations document if present
      if (operationsData) {
        const payload = {
          ...operationsData,
          date: selectedDate,
          alerts: newAlerts
        };
        const res = await fetch(`${API_BASE}/operations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updatedDoc = await res.json();
          setOperationsData({ ...updatedDoc, alerts: newAlerts });
        }
      }
    } catch (e) {
      console.error('Error updating alerts:', e);
    }
  };

  const [showProductMappingModal, setShowProductMappingModal] = useState(false);

  const handleOpenProductMapping = () => {
    setShowProductMappingModal(true);
    setView('report_entry');
  };

  return (
    <div className="milma-app-root">
      <Header
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenDataEntry={() => setView(view === 'dashboard' ? 'report_entry' : 'dashboard')}
        view={view}
      />

      {view === 'dashboard' ? (
        // DASHBOARD VIEW
        <>
          <main className="milma-dashboard-main">
            {loading && !operationsData ? (
              <div className="milma-loading-spinner-wrap">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading Operations Data...</span>
                </div>
              </div>
            ) : (
              <SummarySection
                data={operationsData}
                selectedDate={selectedDate}
                theme={theme}
                onOpenDataEntry={() => setView('report_entry')}
              />
            )}
          </main>

          <Footer
            alerts={operationsData?.alerts}
            onRefresh={() => fetchData(selectedDate)}
            nextRefreshIn={refreshCountdown}
            onUpdateAlerts={handleUpdateAlerts}
          />
        </>
      ) : (
        // ADMINISTRATIVE DAILY REPORT ENTRY VIEW
        <ReportEntry
          theme={theme}
          selectedDate={selectedDate}
          onBackToDashboard={() => { setView('dashboard'); fetchData(selectedDate); }}
          onSave={handleSaveData}
          fetchReportData={handleFetchReportData}
          initialShowMasterModal={showProductMappingModal}
          onCloseMasterModal={() => setShowProductMappingModal(false)}
        />
      )}
    </div>
  );
}

export default App;
