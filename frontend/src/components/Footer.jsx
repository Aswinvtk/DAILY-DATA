import React, { useState } from 'react';
import { Plus, Trash2, X, Check, Edit2, Save, Lock, AlertCircle } from 'lucide-react';

const Footer = ({ alerts = [], onRefresh, onUpdateAlerts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAlerts, setModalAlerts] = useState([]);
  const [newAlertText, setNewAlertText] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Password verification state for saving changes
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const FIXED_PASSWORD = 'Milma106#6';

  // Default realistic alerts matching requirements and reference
  const defaultAlerts = [
    'Purchase Today: 15,320 Kg from MANDYA',
    'Butter Stock is Normal',
    'All Operations Normal',
    'Operations Normal'
  ];

  // Current active alerts to display in the ticker
  const activeAlerts = (alerts && alerts.length > 0) ? alerts : defaultAlerts;

  // Duplicate items 6 times to ensure seamless infinite loop scrolling
  const tickerItems = [...activeAlerts, ...activeAlerts, ...activeAlerts, ...activeAlerts, ...activeAlerts, ...activeAlerts];

  // Open modal and load current alerts into modal state
  const handleOpenModal = () => {
    setModalAlerts(alerts && alerts.length > 0 ? alerts : defaultAlerts);
    setNewAlertText('');
    setEditingIndex(null);
    setSaveSuccessMessage('');
    setIsPasswordModalOpen(false);
    setPasswordInput('');
    setPasswordError('');
    setIsModalOpen(true);
  };

  // Add (+) a new notification inside modal (local state only - not saved automatically)
  const handleAddAlert = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = newAlertText.trim();
    if (text) {
      const updated = [...modalAlerts, text];
      setModalAlerts(updated);
      setNewAlertText('');
      setSaveSuccessMessage('');
    }
  };

  // Start Editing a notification
  const handleStartEdit = (index, currentText) => {
    setEditingIndex(index);
    setEditingText(currentText);
    setSaveSuccessMessage('');
  };

  // Save Edited notification (local state only - not saved automatically)
  const handleSaveEdit = (index) => {
    const text = editingText.trim();
    if (text) {
      const updated = [...modalAlerts];
      updated[index] = text;
      setModalAlerts(updated);
      setEditingIndex(null);
      setEditingText('');
      setSaveSuccessMessage('');
    }
  };

  // Remove (-) a notification inside modal (local state only - not saved automatically)
  const handleRemoveAlert = (indexToRemove) => {
    const updated = modalAlerts.filter((_, idx) => idx !== indexToRemove);
    setModalAlerts(updated);
    setSaveSuccessMessage('');
  };

  // Trigger Save button -> Opens password modal
  const handleInitiateSave = () => {
    setPasswordInput('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  // Handle password submission & validation
  const handleConfirmPassword = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (passwordInput === FIXED_PASSWORD) {
      // Correct password
      setIsPasswordModalOpen(false);
      setPasswordInput('');
      setPasswordError('');
      if (onUpdateAlerts) {
        onUpdateAlerts(modalAlerts);
      }
      setSaveSuccessMessage('Saved successfully');
      setTimeout(() => {
        setSaveSuccessMessage('');
      }, 3500);
    } else {
      // Incorrect password: keep popup open and show error
      setPasswordError('Incorrect password');
    }
  };

  // Cancel password modal without saving
  const handleCancelPassword = () => {
    setIsPasswordModalOpen(false);
    setPasswordInput('');
    setPasswordError('');
  };

  return (
    <>
      <footer className="milma-ticker-footer">
        {/* Alert Header Badge */}
        <div className="milma-ticker-badge">
          ALERTS & UPDATES
        </div>

        {/* Scrolling Ticker Area */}
        <div className="milma-ticker-wrap">
          <div key={activeAlerts.join('~')} className="milma-ticker-scroll">
            {tickerItems.map((item, idx) => (
              <span key={idx} className="milma-ticker-item">
                <span>{item}</span>
                <span className="milma-ticker-dot">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Manage updates Action Button */}
        <div className="milma-ticker-actions">
          <button
            type="button"
            onClick={handleOpenModal}
            className="milma-ticker-manage-btn"
            title="Manage scrolling announcements"
          >
            Manage updates
          </button>
        </div>
      </footer>

      {/* Modal / Form to Manage Notifications & Alerts */}
      {isModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 2000, backdropFilter: 'blur(3px)' }}
        >
          <div className="card shadow-lg p-3" style={{ width: '540px', maxWidth: '94%', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}>
            <div className="d-flex justify-content-between align-items-center pb-2 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h6 className="fw-bold mb-0" style={{ color: 'var(--header-text)' }}>
                Manage Announcements & Ticker
              </h6>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-link text-muted p-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of current alerts */}
            <div className="d-flex flex-column gap-2 mb-3 overflow-y-auto" style={{ maxHeight: '240px' }}>
              {modalAlerts.map((item, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center justify-content-between p-2 rounded-2"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                  {editingIndex === idx ? (
                    <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="form-control form-control-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(idx)}
                        className="btn btn-sm btn-success p-1 px-2"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="fw-medium small text-truncate" style={{ maxWidth: '380px' }}>
                        {item}
                      </span>
                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(idx, item)}
                          className="btn btn-sm btn-link text-muted p-1"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAlert(idx)}
                          className="btn btn-sm btn-link text-danger p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add new alert input */}
            <form onSubmit={handleAddAlert} className="d-flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Type new announcement..."
                value={newAlertText}
                onChange={(e) => setNewAlertText(e.target.value)}
                className="form-control form-control-sm"
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary px-3 d-flex align-items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </form>

            {/* Modal Footer Controls: Status message & Save / Close buttons */}
            <div className="d-flex justify-content-between align-items-center pt-2 mt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div>
                {saveSuccessMessage && (
                  <span className="text-success small fw-bold d-flex align-items-center gap-1">
                    <Check size={15} /> {saveSuccessMessage}
                  </span>
                )}
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm px-3"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '6px'
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleInitiateSave}
                  className="btn btn-sm px-3 fw-bold d-flex align-items-center gap-1"
                  style={{
                    background: 'var(--btn-primary-bg)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal Popup */}
      {isPasswordModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 2100, backdropFilter: 'blur(3px)' }}
        >
          <div
            className="card shadow-lg p-3"
            style={{
              width: '380px',
              maxWidth: '92%',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              borderRadius: '12px',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center pb-2 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--header-text)' }}>
                <Lock size={17} className="text-primary" /> Enter Password
              </h6>
              <button
                type="button"
                onClick={handleCancelPassword}
                className="btn btn-sm btn-link text-muted p-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPassword}>
              <div className="mb-3">
                <label className="form-label small fw-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Enter administrator password to save changes:
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  className="form-control form-control-sm font-monospace"
                  autoFocus
                />
                {passwordError && (
                  <div className="text-danger small mt-2 d-flex align-items-center gap-1 fw-semibold" style={{ fontSize: '0.8rem' }}>
                    <AlertCircle size={14} /> {passwordError}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  className="btn btn-sm px-3"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '6px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm px-3 fw-bold"
                  style={{
                    background: 'var(--btn-primary-bg)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
