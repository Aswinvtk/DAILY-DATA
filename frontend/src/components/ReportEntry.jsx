import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, AlertTriangle, RefreshCw, Save, Check } from 'lucide-react';

const ReportEntry = ({ selectedDate, onBackToDashboard, onSave, fetchReportData }) => {
  const [reportDate, setReportDate] = useState(selectedDate);
  const [reportStatus, setReportStatus] = useState('Draft');
  const [lastUpdatedTime, setLastUpdatedTime] = useState('N/A');

  // Manual Milk Collection fields (all optional)
  const [totalCollection, setTotalCollection] = useState(0);
  const [receivedAtDockWyd, setReceivedAtDockWyd] = useState(0);
  const [receivedAtDockMdy, setReceivedAtDockMdy] = useState(0);
  const [milkClosingStock, setMilkClosingStock] = useState(0);
  const [purchase, setPurchase] = useState({ unitName: '', quantity: 0 });

  // Sales Data fields (extracted from Excel / editable)
  const [milkNetSale, setMilkNetSale] = useState(0);
  const [curdNetSale, setCurdNetSale] = useState(0);
  const [gheeNetSale, setGheeNetSale] = useState(0);
  const [pedaNetSale, setPedaNetSale] = useState(0);
  const [paladaNetSale, setPaladaNetSale] = useState(0);
  const [sambaramNetSale, setSambaramNetSale] = useState(0);
  const [butterNetSale, setButterNetSale] = useState(0);
  const [uhtMilkNetSale, setUhtMilkNetSale] = useState(0);

  // Excel extraction state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [excelInfo, setExcelInfo] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [auditLog, setAuditLog] = useState(null);

  const fileInputRef = useRef(null);
  const excelJustExtracted = useRef(false);

  // Load existing report data when date changes
  const loadExistingReport = async (dateStr) => {
    if (excelJustExtracted.current) {
      excelJustExtracted.current = false;
      return;
    }
    const data = await fetchReportData(dateStr);
    if (data) {
      setReportStatus(data.status || 'Draft');
      setLastUpdatedTime(data.updatedDate ? new Date(data.updatedDate).toLocaleTimeString() : 'N/A');

      // Manual collection fields
      setTotalCollection(data.totalCollection || 0);
      setReceivedAtDockWyd(data.receivedAtDockWyd || 0);
      setReceivedAtDockMdy(data.receivedAtDockMdy || 0);
      setMilkClosingStock(data.milkClosingStock || 0);
      setPurchase(data.purchase || { unitName: '', quantity: 0 });

      // Sales Data
      setMilkNetSale(data.milkSale?.total || 0);
      setCurdNetSale(data.curdSale?.total || 0);
      setGheeNetSale(data.gheeNetSale || 0);
      setPedaNetSale(data.pedaNetSale || 0);
      setPaladaNetSale(data.paladaNetSale || 0);
      setSambaramNetSale(data.sambaramNetSale || 0);
      setButterNetSale(data.butterNetSale || 0);
      setUhtMilkNetSale(data.uhtMilkNetSale || 0);

      setExcelInfo(data.excelFileName ? {
        name: data.excelFileName,
        uploadedBy: data.uploadedBy || 'Admin',
        uploadedAt: data.uploadedAt ? new Date(data.uploadedAt).toLocaleTimeString() : 'N/A'
      } : null);

      setAuditLog({
        createdBy: data.createdBy || 'Admin',
        createdDate: data.createdDate || data.createdAt,
        updatedBy: data.updatedBy,
        updatedDate: data.updatedDate,
        numberOfUpdates: data.numberOfUpdates || 0
      });
    }
  };

  useEffect(() => {
    loadExistingReport(reportDate);
  }, [reportDate]);

  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  // Drag & drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
  };

  // Process uploaded Excel file
  const processFile = (file) => {
    const fileName = (file.name || '').toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('Only Excel files (.xlsx or .xls) are supported!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Maximum file size is 10 MB!');
      return;
    }

    setExcelInfo({
      name: file.name,
      uploadedBy: 'Admin',
      uploadedAt: new Date().toLocaleTimeString()
    });

    setIsExtracting(true);
    setUploadProgress(['📤 Uploading Excel to server...', '🔍 Reading Net Grp Qty columns...']);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('date', reportDate);

    const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    excelJustExtracted.current = true;

    fetch(`http://${apiHost}:5050/api/parse-excel`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(result => {
        const fields = result.extractedFields || [];
        const progressMsgs = ['✅ Excel processed successfully'];
        if (fields.includes('milkNetSale')) progressMsgs.push('✅ Milk Net Sale extracted');
        if (fields.includes('curdNetSale')) progressMsgs.push('✅ Curd Net Sale extracted');
        if (fields.includes('gheeNetSale')) progressMsgs.push('✅ Ghee Net Sale extracted');
        if (fields.includes('pedaNetSale')) progressMsgs.push('✅ Peda Net Sale extracted');
        if (fields.includes('paladaNetSale')) progressMsgs.push('✅ Palada Net Sale extracted');
        if (fields.includes('sambaramNetSale')) progressMsgs.push('✅ Sambaram Net Sale extracted');
        if (fields.includes('butterNetSale')) progressMsgs.push('✅ Butter Net Sale extracted');
        if (fields.includes('uhtMilkNetSale')) progressMsgs.push('✅ UHT Milk Net Sale extracted');
        if (fields.includes('purchase')) progressMsgs.push('✅ Purchase extracted');
        if (fields.length === 0) progressMsgs.push('⚠️ No fields auto-extracted — check column names in Excel.');
        else progressMsgs.push('📝 All extracted values are populated below. Verify or edit if needed.');

        setUploadProgress(progressMsgs);
        setIsExtracting(false);
        if (result.data) {
          const d = result.data;
          if (d.milkSale) setMilkNetSale(d.milkSale.total || 0);
          if (d.curdSale) setCurdNetSale(d.curdSale.total || 0);
          if (d.gheeNetSale != null) setGheeNetSale(d.gheeNetSale);
          if (d.pedaNetSale != null) setPedaNetSale(d.pedaNetSale);
          if (d.paladaNetSale != null) setPaladaNetSale(d.paladaNetSale);
          if (d.sambaramNetSale != null) setSambaramNetSale(d.sambaramNetSale);
          if (d.butterNetSale != null) setButterNetSale(d.butterNetSale);
          if (d.uhtMilkNetSale != null) setUhtMilkNetSale(d.uhtMilkNetSale);
          if (d.purchase) setPurchase(d.purchase);
        }
        excelJustExtracted.current = false;
      })
      .catch(err => {
        console.error('Excel upload error:', err);
        setUploadProgress(['⚠️ Excel extraction failed. Please enter all values manually.']);
        setIsExtracting(false);
        excelJustExtracted.current = false;
      });
  };

  // Collect payload for backend
  const collectPayload = (status) => ({
    date: reportDate,
    status,
    totalCollection,
    receivedAtDockWyd,
    receivedAtDockMdy,
    milkClosingStock,
    purchase,
    milkSale: { total: milkNetSale, categories: [] },
    curdSale: { total: curdNetSale, categories: [] },
    gheeNetSale,
    pedaNetSale,
    paladaNetSale,
    sambaramNetSale,
    butterNetSale,
    uhtMilkNetSale,
    excelFileName: excelInfo ? excelInfo.name : ''
  });

  const handleSaveDraft = () => {
    onSave(collectPayload('Draft'));
    alert('Report saved as DRAFT. Viewer dashboard will display updated values.');
    onBackToDashboard();
  };

  const handleSubmitClick = () => {
    setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmSubmit(false);
    onSave(collectPayload('Submitted'));
    alert('Report successfully submitted! Viewer Dashboard has been updated.');
    onBackToDashboard();
  };

  return (
    <div className="report-entry-page container-fluid p-4">

      {/* 1. Header Banner */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <button onClick={onBackToDashboard} className="btn btn-outline-secondary d-flex align-items-center gap-1">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="ms-2">
            <h2 className="mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>MILMA WAYANAD DAIRY</h2>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Daily Operations Data Entry &amp; Verification</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end">
            <span className={`badge px-3 py-2 fw-bold text-uppercase ${reportStatus === 'Submitted' ? 'bg-success' : reportStatus === 'Updated' ? 'bg-primary' : 'bg-warning text-dark'
              }`}>
              Status: {reportStatus}
            </span>
            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>Last Updated: {lastUpdatedTime}</div>
          </div>
        </div>
      </div>

      {/* 2. Top Control Panel: Date selection & Excel Upload */}
      <div className="row g-4 mb-4">
        <div className="col-md-5">
          <div className="card h-100 border-secondary" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <label className="form-label fw-bold">📅 Select Report Date</label>
                <input
                  type="date"
                  max={getTodayDateStr()}
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="form-control mb-3"
                />

                {excelInfo ? (
                  <div className="alert alert-info py-2 px-3 border border-info mb-0">
                    <h6 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                      <FileText size={15} /> Uploaded Excel File
                    </h6>
                    <div style={{ fontSize: '0.72rem' }} className="font-monospace">
                      <div>File: {excelInfo.name}</div>
                      <div>Uploaded By: {excelInfo.uploadedBy}</div>
                      <div>Uploaded Time: {excelInfo.uploadedAt}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    No Excel file uploaded yet for this date. Upload file to auto-extract sales data.
                  </div>
                )}
              </div>

              {auditLog && auditLog.numberOfUpdates > 0 && (
                <div className="border-top mt-3 pt-2" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <strong>Audit Log:</strong> Created by {auditLog.createdBy} on {new Date(auditLog.createdDate).toLocaleDateString()}. Updated {auditLog.numberOfUpdates} time(s).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div className="col-md-7">
          <div
            className={`drag-drop-zone h-100 d-flex flex-column align-items-center justify-content-center ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={(e) => { if (e.target.files.length > 0) processFile(e.target.files[0]); }}
              className="d-none"
            />
            {isExtracting ? (
              <div className="text-center">
                <RefreshCw size={36} className="text-primary spinner mb-2" style={{ animation: 'spin 2s linear infinite' }} />
                <h6 className="fw-bold mb-2">Reading Excel File...</h6>
                <div className="text-start bg-dark p-2 rounded text-success font-monospace" style={{ fontSize: '0.7rem', width: '260px' }}>
                  {uploadProgress.map((p, i) => <div key={i}>{p}</div>)}
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-muted mb-2" />
                <h6 className="fw-bold mb-1">📊 Upload Wayanad Sales Excel (.xlsx / .xls)</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                  Drag &amp; Drop Excel file here or <strong>Click to Browse</strong>
                </p>
                {uploadProgress.length > 0 && (
                  <div className="mt-2 text-start bg-dark p-2 rounded text-success font-monospace" style={{ fontSize: '0.65rem', width: '280px' }}>
                    {uploadProgress.map((p, i) => <div key={i}>{p}</div>)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Data Entry & Verification Sections */}
      <div className="row g-4 mb-4">

        {/* Section 1: Manual Milk Collection & Purchase */}
        <div className="col-lg-6">
          <div className="card border-secondary h-100" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold" style={{ fontSize: '0.9rem' }}>
              🥛 Milk Collection &amp; Purchase (Manual Entry / Verification)
            </div>
            <div className="card-body">
              <p className="text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                Enter milk collection values. These fields are optional and will display directly on the top section of the dashboard viewer.
              </p>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Total Collection (Ltr)</label>
                  <input
                    type="number"
                    value={totalCollection || ''}
                    onChange={(e) => setTotalCollection(Number(e.target.value) || 0)}
                    className="form-control"
                    placeholder="e.g. 182000"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.75rem' }}>Received at Dock – WYD (Ltr)</label>
                  <input
                    type="number"
                    value={receivedAtDockWyd || ''}
                    onChange={(e) => setReceivedAtDockWyd(Number(e.target.value) || 0)}
                    className="form-control"
                    placeholder="e.g. 124000"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.75rem' }}>Received at Dock – MDY (Ltr)</label>
                  <input
                    type="number"
                    value={receivedAtDockMdy || ''}
                    onChange={(e) => setReceivedAtDockMdy(Number(e.target.value) || 0)}
                    className="form-control"
                    placeholder="e.g. 58000"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.8rem' }}>Milk Closing Stock (Ltr)</label>
                  <input
                    type="number"
                    value={milkClosingStock || ''}
                    onChange={(e) => setMilkClosingStock(Number(e.target.value) || 0)}
                    className="form-control"
                    placeholder="e.g. 136150"
                  />
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    * Appears as sub-line under the Milk Collection card on the dashboard.
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.75rem' }}>Purchase Source Unit</label>
                  <input
                    type="text"
                    value={purchase.unitName}
                    onChange={(e) => setPurchase({ ...purchase, unitName: e.target.value })}
                    className="form-control"
                    placeholder="e.g. MANDYA"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.75rem' }}>Purchase Quantity (Ltr)</label>
                  <input
                    type="number"
                    value={purchase.quantity || ''}
                    onChange={(e) => setPurchase({ ...purchase, quantity: Number(e.target.value) || 0 })}
                    className="form-control"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Product Net Sales (Auto-extracted from Excel / Editable) */}
        <div className="col-lg-6">
          <div className="card border-secondary h-100" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
              <span>📊 Product Net Sales (Extracted / Editable)</span>
              <span className="badge bg-info text-dark">Excel Derived</span>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                Extracted from Net Grp Qty column. You can manually edit any value for verification.
              </p>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label fw-bold text-primary" style={{ fontSize: '0.78rem' }}>Milk Net Sale (Ltr)</label>
                  <input
                    type="number"
                    value={milkNetSale || ''}
                    onChange={(e) => setMilkNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold text-warning" style={{ fontSize: '0.78rem' }}>Curd Net Sale (Kg)</label>
                  <input
                    type="number"
                    value={curdNetSale || ''}
                    onChange={(e) => setCurdNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#f59e0b' }}>Ghee Net Sale (Ltr)</label>
                  <input
                    type="number"
                    value={gheeNetSale || ''}
                    onChange={(e) => setGheeNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#ec4899' }}>Peda Net Sale (Kg)</label>
                  <input
                    type="number"
                    value={pedaNetSale || ''}
                    onChange={(e) => setPedaNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#8b5cf6' }}>Palada Net Sale (Kg)</label>
                  <input
                    type="number"
                    value={paladaNetSale || ''}
                    onChange={(e) => setPaladaNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#06b6d4' }}>Sambaram (Ltr)</label>
                  <input
                    type="number"
                    value={sambaramNetSale || ''}
                    onChange={(e) => setSambaramNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#f97316' }}>Butter (Kg)</label>
                  <input
                    type="number"
                    value={butterNetSale || ''}
                    onChange={(e) => setButterNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#22d3ee' }}>UHT Milk (Ltr)</label>
                  <input
                    type="number"
                    value={uhtMilkNetSale || ''}
                    onChange={(e) => setUhtMilkNetSale(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Action Buttons */}
      <div className="d-flex justify-content-between align-items-center py-4 border-top mt-4 mb-4" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
          * All fields can be manually verified and saved to update the viewer dashboard immediately.
        </span>

        <div className="d-flex gap-3">
          <button type="button" onClick={onBackToDashboard} className="btn btn-outline-secondary px-4 py-2">
            Cancel
          </button>

          <button type="button" onClick={handleSaveDraft} className="btn btn-warning px-4 py-2 fw-bold text-dark d-flex align-items-center gap-1">
            <Save size={16} /> Save Draft
          </button>

          <button type="button" onClick={handleSubmitClick} className="btn btn-success px-5 py-2 fw-bold d-flex align-items-center gap-1">
            <Check size={16} /> Submit Report
          </button>
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      {showConfirmSubmit && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-warning">
              <AlertTriangle size={22} /> Confirm Submission
            </h5>
            <p className="mb-4" style={{ fontSize: '0.85rem' }}>
              Are you sure you want to submit the daily operations report for <strong>{reportDate}</strong>?
              This will update the plant dashboard viewer immediately.
            </p>
            <div className="d-flex justify-content-end gap-3">
              <button type="button" onClick={() => setShowConfirmSubmit(false)} className="btn btn-outline-secondary btn-sm px-3">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmSubmit} className="btn btn-success btn-sm px-4 fw-bold">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportEntry;
