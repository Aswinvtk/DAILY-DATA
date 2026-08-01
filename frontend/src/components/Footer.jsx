import React from 'react';
import { AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react';

const Footer = ({ alerts = [], onRefresh, nextRefreshIn }) => {
  
  // Helper to determine icon based on alert message content
  const getAlertIcon = (alertText) => {
    const text = alertText.toLowerCase();
    if (text.includes('normal') || text.includes('ok')) {
      return <CheckCircle size={14} className="text-success me-2" />;
    }
    if (text.includes('no purchase') || text.includes('refresh')) {
      return <Info size={14} className="text-info me-2" />;
    }
    return <AlertCircle size={14} className="text-warning me-2" />;
  };

  // Duplicate items to ensure smooth infinite loop if ticker content is short
  const tickerItems = alerts.length > 0 
    ? [...alerts, ...alerts, ...alerts] 
    : ['All Operations Normal', 'No Purchase Today', 'Butter Stock is Normal', 'Auto Refresh : Every 30 Seconds'];

  return (
    <footer className="ticker-footer">
      {/* Alert Header Badge */}
      <div className="ticker-header d-flex align-items-center gap-2">
        <AlertCircle size={15} />
        ALERTS & UPDATES
      </div>

      {/* Scrolling Area */}
      <div className="ticker-wrap">
        <div className="ticker-scroll">
          {tickerItems.map((item, idx) => (
            <div key={idx} className="ticker-item">
              {getAlertIcon(item)}
              <span>{item}</span>
              <span className="ticker-item-separator ms-4">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Status and Trigger */}
      <div 
        className="d-flex align-items-center gap-3 px-3 h-100 border-start" 
        style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          fontSize: '0.72rem',
          whiteSpace: 'nowrap'
        }}
      >
        <span>
          Auto Refresh in: <strong className="font-monospace">{nextRefreshIn}s</strong>
        </span>
        <button
          onClick={onRefresh}
          className="btn btn-link text-white p-0 d-flex align-items-center"
          title="Force Refresh Data"
          style={{ textDecoration: 'none' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
