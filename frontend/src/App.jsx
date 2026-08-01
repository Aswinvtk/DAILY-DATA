import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SummarySection from './components/SummarySection';
import RotationSection from './components/RotationSection';
import Footer from './components/Footer';
import ReportEntry from './components/ReportEntry';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [selectedDate, setSelectedDate] = useState('2026-04-28');
  const [operationsData, setOperationsData] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('mpod_theme') || 'dark');
  const [rotatingIndex, setRotatingIndex] = useState(2); // Start on BUTTER (index 2) as in mockup
  const [rotationCountdown, setRotationCountdown] = useState(20);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [currentTime, setCurrentTime] = useState('');
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

  // Live Clock effect
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
      setCurrentTime(`${formattedHours}:${minutes}:${seconds} ${ampm}`);
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
        currentTime={currentTime}
      />

      {view === 'dashboard' ? (
        // DASHBOARD VIEW
        <>
          {isDraftStatus && (
            <div 
              className="alert alert-warning py-2 text-center mb-0 border-0 rounded-0 d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              <span>⚠️ Operational report for {selectedDate} is in DRAFT status. Dashboard is displaying preview draft figures.</span>
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
