import React, { useRef, useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

const Header = ({
  selectedDate,
  onDateChange,
  theme,
  toggleTheme,
  onOpenDataEntry,
  view = 'dashboard'
}) => {
  const dateInputRef = useRef(null);

  // Live ticking time format matching screenshot: "4:57:06 pm"
  const getFormattedLiveTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const [liveTime, setLiveTime] = useState(getFormattedLiveTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getFormattedLiveTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format live current date: "Friday, 23 Oct 2026"
  const getLiveFormattedDate = () => {
    const now = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Format date as DD/MM/YYYY (e.g. 22/10/2026)
  const formatDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return dateStr;
  };

  // Trigger date picker popup when clicking anywhere on the pill
  const handlePillClick = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <header className="milma-dashboard-header">
      <div className="milma-header-left">
        <img
          src="/logo.png"
          alt="Milma Wayanad Dairy Logo"
          className="milma-logo"
        />
        <div className="milma-header-titles">
          <h1 className="milma-header-title">Milma Wayanad Dairy</h1>
          <p className="milma-header-subtitle">Daily operations dashboard</p>
        </div>
      </div>

      <div className="milma-header-right">
        {/* Live Date Pill */}
        <div className="milma-pill-live-date">
          {getLiveFormattedDate()}
        </div>

        {/* Live Time Pill */}
        <div className="milma-pill-live-time">
          <Clock size={14} className="milma-live-time-icon" />
          <span>{liveTime}</span>
        </div>

        {/* Report Date Pill: click anywhere to open date picker */}
        <div
          className="milma-pill-report-date position-relative"
          onClick={handlePillClick}
          title="Click to select report date"
        >
          <span className="milma-report-date-label">Report date</span>
          <span className="milma-report-date-val">{formatDDMMYYYY(selectedDate)}</span>
          <Calendar size={15} className="milma-report-date-icon" />
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate || ''}
            onChange={(e) => onDateChange && onDateChange(e.target.value)}
            className="milma-hidden-date-input"
            aria-label="Select report date"
          />
        </div>

        {/* Dark / Light Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="milma-btn-theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          Dark / Light
        </button>

        {/* Data Entry Action Button */}
        <button
          type="button"
          onClick={onOpenDataEntry}
          className="milma-btn-data-entry"
          title="Open Data Entry control panel"
        >
          {view === 'dashboard' ? 'Data entry' : 'Dashboard'}
        </button>
      </div>
    </header>
  );
};

export default Header;
