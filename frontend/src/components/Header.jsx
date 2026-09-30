import React from 'react';
import { Calendar, Clock, Tv, Sun, Moon, RefreshCw, Edit2, Database } from 'lucide-react';
const Header = ({
  selectedDate,
  onDateChange,
  theme,
  toggleTheme,
  lastUpdated,
  onManualRefresh,
  onOpenDataEntry,
  onOpenProductMapping,
  currentDateStr,
  liveTimeStr
}) => {
  // Format selectedDate for display
  const formatDateDisplay = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      const formatted = date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
      return formatted;
    } catch {
      return dateStr;
    }
  };

  const displayDate = formatDateDisplay(selectedDate);

  // Toggle fullscreen mode for TV & desktop browsers
  const toggleFullscreen = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const doc = document.documentElement;
    const isFull = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullScreenElement;
    
    if (!isFull) {
      if (doc.requestFullscreen) {
        doc.requestFullscreen().catch((err) => console.log(err));
      } else if (doc.webkitRequestFullscreen) {
        doc.webkitRequestFullscreen();
      } else if (doc.msRequestFullscreen) {
        doc.msRequestFullscreen();
      } else if (doc.mozRequestFullScreen) {
        doc.mozRequestFullScreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.log(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    }
  };

  const fullDayMap = {
    Sun: 'Sunday',
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday'
  };

  // Separate currentDateStr into day and date
  const dateParts = currentDateStr ? currentDateStr.split(', ') : ['', ''];
  const rawDay = dateParts[0] || '';
  const fullDayName = fullDayMap[rawDay] || rawDay;
  const dateStr = dateParts[1] || currentDateStr || '';

  return (
    <header className="dashboard-header d-flex align-items-center justify-content-between">
      <div className="dashboard-title-area">
        <img src="/logo.png" alt="Milma Logo" className="milma-logo" />
        <div className="dashboard-title-text border-start border-white border-opacity-25 ps-3 ms-2">
          <h1>MILMA WAYANAD DAIRY</h1>
          <p>Daily Operations Dashboard</p>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Compact Status Cluster: Day + Date + Time + Last Updated */}
        <div 
          className="d-flex align-items-center text-white px-3 py-2 rounded-3 gap-3" 
          style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
        >
          {/* Date & Day */}
          <div className="d-flex align-items-center gap-2">
            <Calendar size={16} className="text-white opacity-75 flex-shrink-0" />
            <div style={{ lineHeight: 1.25 }}>
              <div className="fw-bold" style={{ fontSize: '0.82rem', letterSpacing: '0.3px' }}>
                {fullDayName}, {dateStr}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

          {/* Time */}
          <div className="d-flex align-items-center gap-2">
            <Clock size={16} className="text-white opacity-75 flex-shrink-0" />
            <span className="fw-bold" style={{ fontSize: '0.95rem', letterSpacing: '0.5px', fontVariantNumeric: 'tabular-nums' }}>
              {liveTimeStr}
            </span>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

          {/* Last Updated */}
          <div style={{ lineHeight: 1.25, fontSize: '0.72rem' }}>
            <div className="opacity-65">Updated</div>
            <div className="fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{lastUpdated}</div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="d-flex align-items-center gap-2 border-start border-white border-opacity-25 ps-3">
          {/* Date Selector: Report Date */}
          <div className="d-flex align-items-center text-white me-1">
            <div className="text-end me-2" style={{ lineHeight: 1.35 }}>
              <div style={{ fontSize: '0.72rem' }}>
                <span className="opacity-75">Report: </span>
                <span className="fw-bold" style={{ color: '#fbbf24' }}>{displayDate}</span>
              </div>
            </div>
            <div 
              className="position-relative bg-white bg-opacity-10 p-2 rounded cursor-pointer d-flex align-items-center justify-content-center" 
              style={{ width: '32px', height: '32px' }}
              title="Select date to view corresponding data"
            >
              <Calendar size={14} style={{ color: '#fbbf24' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Data Entry Panel Button — SOLID PRIMARY */}
          <button
            onClick={onOpenDataEntry}
            className="btn btn-sm d-flex align-items-center gap-1 fw-bold px-3"
            style={{ 
              background: '#0059a5', 
              color: '#ffffff', 
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.78rem',
              letterSpacing: '0.3px'
            }}
            title="Open Data Entry Control Panel"
          >
            <Edit2 size={13} />
            DATA ENTRY
          </button>

          {/* Refresh Action — Ghost Icon Button */}
          <button
            onClick={onManualRefresh}
            className="btn btn-sm p-2 d-flex align-items-center justify-content-center"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.85)',
              width: '32px',
              height: '32px'
            }}
            title="Force Update Data"
          >
            <RefreshCw size={14} />
          </button>

          {/* Fullscreen Mode — Ghost Icon Button */}
          <button
            onClick={toggleFullscreen}
            onTouchEnd={toggleFullscreen}
            className="btn btn-sm p-2 d-flex align-items-center justify-content-center"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.85)',
              width: '32px',
              height: '32px'
            }}
            title="Toggle TV Fullscreen Mode"
          >
            <Tv size={14} />
          </button>

          {/* Theme Switcher — Compact Icon-Only Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm p-2 d-flex align-items-center justify-content-center"
            style={{
              background: theme === 'light' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fbbf24',
              width: '32px',
              height: '32px'
            }}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
