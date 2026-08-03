import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Info, RefreshCw, Plus, Minus, X, BellPlus, Edit2, Check } from 'lucide-react';

const Footer = ({ alerts = [], onRefresh, onUpdateAlerts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAlerts, setModalAlerts] = useState([]);
  const [newAlertText, setNewAlertText] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Default fallback if no alerts present
  const defaultAlerts = [
    'All Operations Normal', 
    'Purchase Today: 15,320 Kg from MANDYA', 
    'Butter Stock is Normal', 
    'Auto Refresh : Every 30 Seconds'
  ];

  // Current active alerts to display in the ticker
  const activeAlerts = (alerts && alerts.length > 0) ? alerts : defaultAlerts;

  // Duplicate items 4 times to ensure seamless infinite loop scrolling
  const tickerItems = [...activeAlerts, ...activeAlerts, ...activeAlerts, ...activeAlerts];

  // Open modal and load current alerts into modal state
  const handleOpenModal = () => {
    setModalAlerts(alerts && alerts.length > 0 ? alerts : defaultAlerts);
    setNewAlertText('');
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  // Add (+) a new notification inside modal
  const handleAddAlert = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = newAlertText.trim();
    if (text) {
      const updated = [...modalAlerts, text];
      setModalAlerts(updated);
      setNewAlertText('');
      if (onUpdateAlerts) {
        onUpdateAlerts(updated);
      }
    }
  };

  // Start Editing a notification
  const handleStartEdit = (index, currentText) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  // Save Edited notification
  const handleSaveEdit = (index) => {
    const text = editingText.trim();
    if (text) {
      const updated = [...modalAlerts];
      updated[index] = text;
      setModalAlerts(updated);
      setEditingIndex(null);
      setEditingText('');
      if (onUpdateAlerts) {
        onUpdateAlerts(updated);
      }
    }
  };

  // Remove (-) a notification inside modal
  const handleRemoveAlert = (indexToRemove) => {
    const updated = modalAlerts.filter((_, idx) => idx !== indexToRemove);
    setModalAlerts(updated);
    if (onUpdateAlerts) {
      onUpdateAlerts(updated);
    }
  };

  // Helper to determine icon based on alert message content
  const getAlertIcon = (alertText) => {
    const text = (alertText || '').toLowerCase();
    if (text.includes('normal') || text.includes('ok')) {
      return <CheckCircle size={14} className="text-success me-2 flex-shrink-0" />;
    }
    if (text.includes('no purchase') || text.includes('refresh') || text.includes('purchase')) {
      return <Info size={14} className="text-info me-2 flex-shrink-0" />;
    }
    return <AlertCircle size={14} className="text-warning me-2 flex-shrink-0" />;
  };

  return (
    <footer className="ticker-footer">
      {/* Alert Header Badge */}
      <div className="ticker-header d-flex align-items-center gap-2">
        <AlertCircle size={15} />
        ALERTS & UPDATES
      </div>

      {/* Scrolling Area with infinite loop animation (keyed by activeAlerts to force refresh) */}
      <div className="ticker-wrap">
        <div key={activeAlerts.join('~')} className="ticker-scroll">
          {tickerItems.map((item, idx) => (
            <div key={idx} className="ticker-item">
              {getAlertIcon(item)}
              <span>{item}</span>
              <span className="ticker-item-separator ms-4">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Updates link & Refresh Action */}
      <div
        className="d-flex align-items-center gap-3 px-3 h-100 border-start"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          fontSize: '0.72rem',
          whiteSpace: 'nowrap'
        }}
      >
        {/* Add updates link */}
        <button
          onClick={handleOpenModal}
          className="btn btn-sm btn-link text-warning fw-bold p-0 me-2 text-decoration-none d-flex align-items-center gap-1"
          title="Add, edit, or remove scrolling alerts & updates"
          style={{ fontSize: '0.75rem' }}
        >
          <BellPlus size={14} />
          Manage Updates
        </button>

        {/* Refresh Action Trigger */}
        <button
          onClick={onRefresh}
          className="btn btn-link text-white p-0 d-flex align-items-center ms-1"
          title="Force Refresh Data"
          style={{ textDecoration: 'none' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Modal / Form to Manage Notifications & Alerts */}
      {isModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000, backdropFilter: 'blur(4px)' }}
        >
          <div className="card bg-dark text-white border-secondary shadow-lg p-3" style={{ width: '560px', maxWidth: '94%' }}>
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-3">
              <h6 className="fw-bold mb-0 text-warning d-flex align-items-center gap-2">
                <BellPlus size={18} />
                Manage Alerts & Scrolling Updates
              </h6>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-link text-white p-0">
                <X size={18} />
              </button>
            </div>

            {/* Form to add a new notification (+) */}
            <form onSubmit={handleAddAlert} className="mb-3">
              <label className="form-label text-muted small fw-bold">Add New Alert / Update (+)</label>
              <div className="input-group">
                <input
                  type="text"
                  value={newAlertText}
                  onChange={(e) => setNewAlertText(e.target.value)}
                  placeholder="Type new alert / update message..."
                  className="form-control form-control-sm bg-dark text-white border-secondary"
                  autoFocus
                />
                <button type="submit" className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1">
                  <Plus size={16} /> Add (+)
                </button>
              </div>
            </form>

            {/* List of current notifications with edit & remove options */}
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Active Alerts List (Edit or Remove)</label>
              <div className="border border-secondary rounded p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {modalAlerts.length === 0 ? (
                  <div className="text-muted small text-center py-3">No active alerts. Add one above!</div>
                ) : (
                  modalAlerts.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center bg-secondary bg-opacity-20 p-2 rounded mb-2 border border-secondary border-opacity-50">
                      {editingIndex === idx ? (
                        <div className="input-group input-group-sm w-100 me-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="form-control bg-dark text-white border-primary"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(idx)}
                            className="btn btn-primary btn-sm d-flex align-items-center"
                            title="Save changes"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="small me-2" style={{ wordBreak: 'break-word' }}>{item}</span>
                          <div className="d-flex gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(idx, item)}
                              className="btn btn-sm btn-outline-warning p-1 d-flex align-items-center"
                              title="Edit update text"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAlert(idx)}
                              className="btn btn-sm btn-outline-danger p-1 d-flex align-items-center"
                              title="Remove update (-)"
                            >
                              <Minus size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="d-flex justify-content-between align-items-center border-top border-secondary pt-2">
              <span className="text-muted small">Changes immediately update footer ticker</span>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-warning fw-bold px-4">
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
