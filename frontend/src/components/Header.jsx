import React from 'react';
import { Calendar, Clock, Tv, Sun, Moon, RefreshCw, Edit2 } from 'lucide-react';
const Header = ({
  selectedDate,
  onDateChange,
  theme,
  toggleTheme,
  lastUpdated,
  onManualRefresh,
  onOpenDataEntry,
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
        {/* Time Card (First) */}
        <div 
          className="d-flex align-items-center text-white px-4 py-2 rounded-3" 
          style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', minWidth: '160px' }}
        >
          <Clock className="me-3 text-warning flex-shrink-0" size={28} />
          <div className="d-flex flex-column justify-content-center" style={{ lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.85, color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Time
            </span>
            <span className="fw-bold text-white" style={{ fontSize: '1.35rem', letterSpacing: '1px', fontFamily: 'var(--font-sans)' }}>
              {liveTimeStr}
            </span>
          </div>
        </div>

        {/* Date Card (Second) */}
        <div 
          className="d-flex align-items-center text-white px-4 py-2 rounded-3" 
          style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', minWidth: '175px' }}
        >
          <Calendar className="me-3 text-warning flex-shrink-0" size={28} />
          <div className="d-flex flex-column justify-content-center" style={{ lineHeight: 1.2 }}>
            <span className="fw-bold text-warning" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {fullDayName}
            </span>
            <span className="fw-bold text-white" style={{ fontSize: '1.2rem', letterSpacing: '0.5px' }}>
              {dateStr}
            </span>
          </div>
        </div>

        {/* Controls Section */}
        <div className="d-flex align-items-center gap-2 border-start border-white border-opacity-25 ps-4">
          {/* Date Selector Display: Report Date & Last Updated (Replaces Historical button) */}
          <div className="d-flex align-items-center text-white me-2">
            <div className="text-end me-2" style={{ lineHeight: 1.35 }}>
              <div style={{ fontSize: '0.78rem' }}>
                <span className="opacity-75">Report Date : </span>
                <span className="fw-bold text-warning">{displayDate}</span>
              </div>
              <div style={{ fontSize: '0.7rem' }}>
                <span className="opacity-75">Last Updated : </span>
                <span className="fw-semibold">{lastUpdated}</span>
              </div>
            </div>
            <div 
              className="position-relative bg-white bg-opacity-10 p-2 rounded cursor-pointer hover-bg-opacity-20 d-flex align-items-center justify-content-center" 
              style={{ width: '36px', height: '36px' }}
              title="Select date to view corresponding data"
            >
              <Calendar size={18} className="text-warning" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
              />
            </div>
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
            onTouchEnd={toggleFullscreen}
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
