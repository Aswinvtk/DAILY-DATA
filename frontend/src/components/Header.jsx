import React from 'react';
import { Calendar, Clock, Tv, Sun, Moon, RefreshCw, Edit2 } from 'lucide-react';

const MilmaLogoSvg = () => (
  <svg viewBox="0 0 200 120" className="milma-logo" style={{ width: '80px', height: 'auto' }}>
    {/* Oval background */}
    <ellipse cx="100" cy="45" rx="55" ry="32" fill="#004b87" stroke="#ffffff" strokeWidth="3" />
    
    {/* Horns & Head emblem */}
    <path 
      d="M 68 30 C 75 15, 90 20, 100 35 C 110 20, 125 15, 132 30 C 120 40, 110 38, 100 48 C 90 38, 80 40, 68 30 Z" 
      fill="#ffffff" 
    />
    <circle cx="100" cy="56" r="6" fill="#ffffff" />
    <path d="M 94 56 L 100 68 L 106 56 Z" fill="#ffffff" />
    
    {/* Milma Text below */}
    <text 
      x="100" 
      y="105" 
      fill="#ffffff" 
      fontSize="24" 
      fontWeight="900" 
      fontFamily="'Inter', sans-serif" 
      textAnchor="middle"
      letterSpacing="1"
    >
      milma
    </text>
  </svg>
);

const Header = ({
  selectedDate,
  onDateChange,
  theme,
  toggleTheme,
  lastUpdated,
  onManualRefresh,
  onOpenDataEntry,
  isLive,
  currentTime
}) => {
  // Format selectedDate for display
  const formatDateDisplay = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      const formatted = date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      return { dateStr: formatted, weekday };
    } catch {
      return { dateStr: dateStr, weekday: '' };
    }
  };

  const { dateStr: displayDate, weekday } = formatDateDisplay(selectedDate);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="dashboard-header d-flex align-items-center justify-content-between">
      <div className="dashboard-title-area">
        <MilmaLogoSvg />
        <div className="dashboard-title-text border-start border-white border-opacity-25 ps-3 ms-2">
          <h1>MILMA WAYANAD DAIRY</h1>
          <p>Daily Operations Dashboard</p>
        </div>
      </div>

      <div className="d-flex align-items-center gap-4">
        {/* Date Selector Display */}
        <div className="d-flex align-items-center text-end text-white">
          <div className="me-2">
            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{displayDate}</div>
            <div className="opacity-75" style={{ fontSize: '0.7rem' }}>{weekday}</div>
          </div>
          <div className="position-relative bg-white bg-opacity-10 p-2 rounded cursor-pointer hover-bg-opacity-20">
            <Calendar size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
              style={{ minWidth: '35px' }}
            />
          </div>
        </div>

        {/* Live Clock Display */}
        <div className="d-flex align-items-center text-white border-start border-white border-opacity-25 ps-4">
          <Clock className="me-2 text-warning" size={20} />
          <div>
            <div className="fw-bold" style={{ fontSize: '1rem', fontFamily: 'var(--font-digital)' }}>
              {currentTime}
            </div>
            <div className="opacity-75" style={{ fontSize: '0.7rem' }}>
              Last Updated: {lastUpdated}
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="d-flex align-items-center gap-2 border-start border-white border-opacity-25 ps-4">
          {/* Live indicator */}
          <div className={`live-badge ${isLive ? '' : 'bg-secondary border-secondary text-white opacity-50'}`}>
            <span className={`live-pulse ${isLive ? '' : 'bg-secondary'}`} />
            {isLive ? 'LIVE' : 'HISTORICAL'}
          </div>

          {/* Data Entry Panel Button */}
          <button 
            onClick={onOpenDataEntry}
            className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1 fw-bold px-3"
            title="Open Data Entry Control Panel"
          >
            <Edit2 size={13} />
            DATA ENTRY
          </button>

          {/* Refresh Action */}
          <button
            onClick={onManualRefresh}
            className="btn btn-sm btn-outline-light p-2"
            title="Force Update Data"
          >
            <RefreshCw size={15} />
          </button>

          {/* Fullscreen Mode */}
          <button
            onClick={toggleFullscreen}
            className="btn btn-sm btn-outline-light p-2"
            title="Toggle TV Fullscreen Mode"
          >
            <Tv size={15} />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-warning d-flex align-items-center gap-1 px-3 fw-bold ms-1"
            style={{ fontSize: '0.75rem' }}
          >
            {theme === 'light' ? (
              <>
                <Moon size={14} /> ☾ Dark
              </>
            ) : (
              <>
                <Sun size={14} /> 🌞 Light
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
