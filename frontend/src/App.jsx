import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SummarySection from './components/SummarySection';
import RotationSection from './components/RotationSection';
import Footer from './components/Footer';
import ReportEntry from './components/ReportEntry';

const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE = `http://${API_HOST}:5000/api`;

const getYesterdayDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

function App() {
  const [selectedDate, setSelectedDate] = useState(getYesterdayDateStr);
  const [operationsData, setOperationsData] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('mpod_theme') || 'dark');
  const [rotatingIndex, setRotatingIndex] = useState(2); // Start on BUTTER (index 2) as in mockup
  const [rotationCountdown, setRotationCountdown] = useState(20);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [liveTimeStr, setLiveTimeStr] = useState('');
  const [lastUpdated, setLastUpdated] = useState('--:-- AM');
  const [loading, setLoading] = useState(true);

  // V2 Navigation View state: 'dashboard' or 'report_entry'
  const [view, setView] = useState('dashboard');

  // Set theme attribute on HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mpod_theme', theme);
  }, [theme]);

  // Handle scrollability in body when in report entry view
  useEffect(() => {
    if (view === 'report_entry') {
      document.body.classList.add('scrollable-body');
    } else {
      document.body.classList.remove('scrollable-body');
      window.scrollTo(0, 0);
    }
  }, [view]);

  // Live Clock effect - Exact day, date and ticking time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const formattedHours = String(hours).padStart(2, '0');

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = weekdays[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();

      setCurrentDateStr(`${dayName}, ${dayNum}-${monthName}-${year}`);
      setLiveTimeStr(`${formattedHours}:${minutes}:${seconds} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // 1-second interval to handle count downs for rotation and refresh
  useEffect(() => {
    if (view !== 'dashboard') return; // Pause counts when not on Dashboard

    const timer = setInterval(() => {
      // Rotation Countdown
      setRotationCountdown(prev => {
        if (prev <= 1) {
          setRotatingIndex(current => (current + 1) % 5);
          return 20;
        }
        return prev - 1;
      });

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

  const handleSelectProduct = (index) => {
    setRotatingIndex(index);
    setRotationCountdown(20);
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

  // Determine if it is Live Mode
  const isTodaySelected = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDate === todayStr;
  };

  const isLive = (isTodaySelected() || selectedDate === '2026-04-28') && view === 'dashboard';

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
          setOperationsData(prev => ({ ...updatedDoc, alerts: newAlerts }));
        }
      }
    } catch (e) {
      console.error('Error updating alerts:', e);
    }
  };

  return (
    <div className="d-flex flex-column h-100">
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        theme={theme}
        toggleTheme={toggleTheme}
        lastUpdated={lastUpdated}
        onManualRefresh={() => fetchData(selectedDate)}
        onOpenDataEntry={() => setView(view === 'dashboard' ? 'report_entry' : 'dashboard')}
        isLive={isLive}
        currentDateStr={currentDateStr}
        liveTimeStr={liveTimeStr}
      />

      {view === 'dashboard' ? (
        // DASHBOARD VIEW
        <>
          {/* Status Alert Bar if report is in Draft status */}
          {isDraftStatus && (
            <div className="bg-warning text-dark text-center py-1 px-3 fw-bold small d-flex align-items-center justify-content-center gap-2">
              <span>⚠️ Draft Report for {selectedDate} — Data has not been finalized!</span>
              <button onClick={() => setView('report_entry')} className="btn btn-sm btn-link py-0 fw-bold text-dark text-decoration-underline">
                Edit & Submit Report
              </button>
            </div>
          )}

          <div className="dashboard-grid flex-grow-1">
            {loading && !operationsData ? (
              <div className="d-flex flex-grow-1 align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading Operations Data...</span>
                </div>
              </div>
            ) : (
              <>
                <SummarySection
                  data={operationsData}
                  theme={theme}
                />
                <RotationSection
                  products={operationsData?.products}
                  currentIndex={rotatingIndex}
                  countdown={rotationCountdown}
                  onSelectProduct={handleSelectProduct}
                  theme={theme}
                />
              </>
            )}
          </div>

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
          selectedDate={selectedDate}
          onBackToDashboard={() => { setView('dashboard'); fetchData(selectedDate); }}
          onSave={handleSaveData}
          fetchReportData={handleFetchReportData}
        />
      )}
    </div>
  );
}

export default App;
