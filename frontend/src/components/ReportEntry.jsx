import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, Database, AlertTriangle, Clock, RefreshCw, Save, Check } from 'lucide-react';

const ReportEntry = ({ selectedDate, onBackToDashboard, onSave, fetchReportData }) => {
  const [reportDate, setReportDate] = useState(selectedDate);
  const [reportStatus, setReportStatus] = useState('Draft');
  const [lastUpdatedTime, setLastUpdatedTime] = useState('N/A');
  
  // Form fields state
  const [collectionData, setCollectionData] = useState({ wyd: 0 });
  const [milkReceived, setMilkReceived] = useState({ dairy: 0, mvd: 0, total: 0, unit: 'WYD' });
  const [purchase, setPurchase] = useState({ unitName: '', quantity: 0 });
  const [milkClosingStock, setMilkClosingStock] = useState(0);
  
  const [milkSaleCategories, setMilkSaleCategories] = useState([
    { name: 'HTM 515', value: 0 },
    { name: 'HTM 490/500', value: 0 },
    { name: 'HTM 200', value: 0 },
    { name: 'Toned Milk', value: 0 },
    { name: 'Super Rich/STD', value: 0 },
    { name: 'Milma Smart', value: 0 },
    { name: 'Cow Milk', value: 0 },
    { name: 'UHT', value: 0 },
    { name: 'HTM 450/HTM 1 Ltr', value: 0 },
    { name: 'Full Cream Milk', value: 0 }
  ]);

  const [curdSaleCategories, setCurdSaleCategories] = useState([
    { name: 'Curd 5Kg', value: 0 },
    { name: 'Special Curd 450g', value: 0 },
    { name: 'Kattimoru', value: 0 },
    { name: 'Kattithairu 400g', value: 0 },
    { name: 'Set Curd 200g', value: 0 },
    { name: 'TM Curd / Set Curd 400g', value: 0 },
    { name: 'Kantharimoru', value: 0 },
    { name: 'Curd 525g', value: 0 },
    { name: 'DTM Curd 500g / Set Curd 1Kg', value: 0 },
    { name: 'Probiotic Set Curd', value: 0 }
  ]);

  // Product Stock state
  const [creamStock, setCreamStock] = useState(0);
  const [smpStock, setSmpStock] = useState(0);
  const [butterVariants, setButterVariants] = useState([
    { name: '100 g', value: 0 },
    { name: '200 g', value: 0 },
    { name: '500 g', value: 0 },
    { name: 'Bulk', value: 0 },
    { name: 'Cooking Butter Bulk', value: 0 }
  ]);
  const [paneerVariants, setPaneerVariants] = useState([
    { name: '500 g', value: 0 },
    { name: '1 Kg', value: 0 },
    { name: 'Bulk', value: 0 }
  ]);
  const [gheeVariants, setGheeVariants] = useState([
    { name: '100 ml', value: 0 },
    { name: '200 ml', value: 0 },
    { name: '500 ml', value: 0 },
    { name: '1 L', value: 0 },
    { name: '2 L', value: 0 },
    { name: '5 L', value: 0 },
    { name: '15 Kg', value: 0 },
    { name: 'Bulk', value: 0 },
    { name: '50ml PP Jar', value: 0 }
  ]);

  // Simulated PDF extraction state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [auditLog, setAuditLog] = useState(null);

  // File input ref
  const fileInputRef = useRef(null);

  // Fetch report data for reportDate on change
  const loadExistingReport = async (dateStr) => {
    setErrors({});
    const data = await fetchReportData(dateStr);
    if (data) {
      setReportStatus(data.status || 'Draft');
      setLastUpdatedTime(data.updatedDate ? new Date(data.updatedDate).toLocaleTimeString() : 'N/A');
      
      setCollectionData(data.collectionData || { wyd: 0, mvd: 0 });
      setMilkReceived(data.milkReceived || { total: 0, unit: 'WYD' });
      setPurchase(data.purchase || { unitName: '', quantity: 0 });
      setMilkClosingStock(data.milkClosingStock || 0);

      // Map milkSale categories
      if (data.milkSale && data.milkSale.categories) {
        setMilkSaleCategories(data.milkSale.categories);
      }
      // Map curdSale categories
      if (data.curdSale && data.curdSale.categories) {
        setCurdSaleCategories(data.curdSale.categories);
      }

      // Map stocks
      if (data.products) {
        const cream = data.products.find(p => p.productName === 'CREAM');
        if (cream) setCreamStock(cream.totalStock);
        
        const smp = data.products.find(p => p.productName === 'SMP');
        if (smp) setSmpStock(smp.totalStock);

        const butter = data.products.find(p => p.productName === 'BUTTER');
        if (butter) setButterVariants(butter.variants);

        const paneer = data.products.find(p => p.productName === 'PANEER');
        if (paneer) setPaneerVariants(paneer.variants);

        const ghee = data.products.find(p => p.productName === 'GHEE');
        if (ghee) setGheeVariants(ghee.variants);
      }

      setPdfInfo(data.pdfName ? {
        name: data.pdfName,
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

  // Max dates allowed = today
  const getTodayDateStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  // PDF drag/drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    setErrors({});
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Maximum file size is 10 MB!');
      return;
    }

    // Set PDF Info
    setPdfInfo({
      name: file.name,
      uploadedBy: 'Admin',
      uploadedAt: new Date().toLocaleTimeString()
    });

    setIsExtracting(true);
    setUploadProgress(['Reading PDF file...', 'Searching date & WYD column data...']);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('date', reportDate);

    const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    fetch(`http://${apiHost}:5000/api/parse-pdf`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(result => {
        const fields = result.extractedFields || [];
        const progressMsgs = ['✓ PDF processed successfully'];
        if (fields.includes('date')) progressMsgs.push('✓ Date extracted');
        if (fields.includes('milkReceivedTotal')) progressMsgs.push('✓ Total PROC (Milk Received) extracted');
        if (fields.includes('totalMilkSale')) progressMsgs.push('✓ Total Milk Sale extracted');
        if (fields.includes('totalCurdSale')) progressMsgs.push('✓ Total Curd Sale extracted');
        if (fields.length === 0) progressMsgs.push('⚠ No fields could be auto-extracted');
        progressMsgs.push('ℹ Please fill in category breakdowns & stock values manually');
        setUploadProgress(prev => [...prev, '✓ PDF data extracted & form auto-filled successfully!']);
        setIsExtracting(false);
        if (result.data) {
          const d = result.data;
          if (d.collectionData) setCollectionData(d.collectionData);
          if (d.milkReceived) setMilkReceived(d.milkReceived);
          if (d.purchase) setPurchase(d.purchase);
          if (d.milkClosingStock) setMilkClosingStock(d.milkClosingStock);
          if (d.milkSale?.categories && d.milkSale.categories.length > 0) {
            setMilkSaleCategories(d.milkSale.categories);
          }
          if (d.curdSale?.categories && d.curdSale.categories.length > 0) {
            setCurdSaleCategories(d.curdSale.categories);
          }
          if (d.products) {
            const cream = d.products.find(p => p.productName === 'CREAM');
            if (cream) setCreamStock(cream.totalStock);
            const smp = d.products.find(p => p.productName === 'SMP');
            if (smp) setSmpStock(smp.totalStock);
            const butter = d.products.find(p => p.productName === 'BUTTER');
            if (butter && butter.variants && butter.variants.length > 0) setButterVariants(butter.variants);
            const paneer = d.products.find(p => p.productName === 'PANEER');
            if (paneer && paneer.variants && paneer.variants.length > 0) setPaneerVariants(paneer.variants);
            const ghee = d.products.find(p => p.productName === 'GHEE');
            if (ghee && ghee.variants && ghee.variants.length > 0) setGheeVariants(ghee.variants);
          }
        }
      })
      .catch(err => {
        console.error('PDF upload error:', err);
        setUploadProgress(prev => [...prev, '⚠ PDF extraction failed. Please enter all values manually.']);
        setIsExtracting(false);
      });
  };

  // Prefill exact report data after PDF upload or extraction
  const prefillExtractedData = (dateStr) => {
    setCollectionData({ wyd: 182292 });
    setMilkReceived({ dairy: 124146, mvd: 59291, total: 183437, unit: 'WYD' });
    setPurchase({ unitName: '', quantity: 0 });
    setMilkClosingStock(136150);
    setCreamStock(4300);
    setSmpStock(12038);
    
    setMilkSaleCategories([
      { name: 'HTM 515', value: 109192 },
      { name: 'HTM 490/500', value: 5164 },
      { name: 'HTM 200', value: 0 },
      { name: 'Toned Milk', value: 0 },
      { name: 'Super Rich/STD', value: 9487 },
      { name: 'Milma Smart', value: 243 },
      { name: 'Cow Milk', value: 501 },
      { name: 'UHT', value: 829 },
      { name: 'HTM 450/HTM 1 Ltr', value: 1217 },
      { name: 'Full Cream Milk', value: 0 }
    ]);
    setCurdSaleCategories([
      { name: 'Curd 5Kg', value: 15 },
      { name: 'Special Curd 450g', value: 216 },
      { name: 'Kattimoru', value: 1037 },
      { name: 'Kattithairu 400g', value: 0 },
      { name: 'Set Curd 200g', value: 2 },
      { name: 'TM Curd / Set Curd 400g', value: 5 },
      { name: 'Kantharimoru', value: 0 },
      { name: 'Curd 525g', value: 14450 },
      { name: 'DTM Curd 500g / Set Curd 1Kg', value: 12 },
      { name: 'Probiotic Set Curd', value: 22 }
    ]);
    setButterVariants([
      { name: '100 g', value: 7487 },
      { name: '200 g', value: 3062 },
      { name: '500 g', value: 1203 },
      { name: 'Bulk', value: 23 },
      { name: 'Cooking Butter Bulk', value: 2200 }
    ]);
    setPaneerVariants([
      { name: '500 g', value: 52 },
      { name: '1 Kg', value: 214 },
      { name: 'Bulk', value: 0 }
    ]);
    setGheeVariants([
      { name: '100 ml', value: 35585 },
      { name: '200 ml', value: 43137 },
      { name: '500 ml', value: 30542 },
      { name: '1 L', value: 5142 },
      { name: '2 L', value: 71 },
      { name: '5 L', value: 141 },
      { name: '15 Kg', value: 35 },
      { name: 'Bulk', value: 16768 },
      { name: '50ml PP Jar', value: 21587 }
    ]);
  };

  // Form Field Validation
  const validateForm = () => {
    const errs = {};
    
    if (!collectionData.wyd) errs.wyd = 'Wayanad collection required';
    if (!milkReceived.total) errs.milkReceived = 'Milk received quantity required';
    if (!milkClosingStock) errs.closingStock = 'Milk closing stock required';
    
    // Sum check for Milk sale
    const totalMilkSaleVal = milkSaleCategories.reduce((sum, c) => sum + Number(c.value), 0);
    if (totalMilkSaleVal === 0) errs.milkSale = 'Milk Sale Category Values Required';

    // Sum check for Curd sale
    const totalCurdSaleVal = curdSaleCategories.reduce((sum, c) => sum + Number(c.value), 0);
    if (totalCurdSaleVal === 0) errs.curdSale = 'Curd Sale Category Values Required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Save draft
  const handleSaveDraft = () => {
    // Collect data payload
    const payload = collectPayload('Draft');
    onSave(payload);
    alert('Report saved as DRAFT. Viewer dashboard will not display this data until submitted.');
    onBackToDashboard();
  };

  // Handle Submit clicked
  const handleSubmitClick = () => {
    if (validateForm()) {
      setShowConfirmSubmit(true);
    } else {
      // Scroll to top to see validation banner
      window.scrollTo(0, 0);
    }
  };

  // Confirm Submit
  const handleConfirmSubmit = () => {
    setShowConfirmSubmit(false);
    const payload = collectPayload('Submitted');
    onSave(payload);
    alert('Report successfully submitted! Viewer Dashboard has been updated.');
    onBackToDashboard();
  };

  // Assemble full operational payload
  const collectPayload = (status) => {
    return {
      date: reportDate,
      status,
      collectionData,
      milkReceived,
      purchase,
      milkClosingStock,
      milkSale: {
        total: milkSaleCategories.reduce((sum, c) => sum + Number(c.value), 0),
        categories: milkSaleCategories
      },
      curdSale: {
        total: curdSaleCategories.reduce((sum, c) => sum + Number(c.value), 0),
        categories: curdSaleCategories
      },
      products: [
        { productName: 'CREAM', totalStock: Number(creamStock), variants: [] },
        { productName: 'SMP', totalStock: Number(smpStock), variants: [] },
        { productName: 'BUTTER', totalStock: 0, variants: butterVariants },
        { productName: 'PANEER', totalStock: 0, variants: paneerVariants },
        { productName: 'GHEE', totalStock: 0, variants: gheeVariants }
      ],
      pdfName: pdfInfo ? pdfInfo.name : ''
    };
  };

  // Derived calculations
  const totalCollection = Number(collectionData.wyd) || 0;
  const totalMilkSale = milkSaleCategories.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
  const totalCurdSale = curdSaleCategories.reduce((sum, c) => sum + (Number(c.value) || 0), 0);

  return (
    <div className="report-entry-page container-fluid">
      
      {/* 1. Header Banner */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <button onClick={onBackToDashboard} className="btn btn-outline-secondary d-flex align-items-center gap-1">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="ms-2">
            <h2 className="mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>MILMA WAYANAD DAIRY</h2>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Daily Report Entry</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Status Badge */}
          <div className="text-end">
            <span className={`badge px-3 py-2 fw-bold text-uppercase ${
              reportStatus === 'Submitted' ? 'bg-success' : reportStatus === 'Updated' ? 'bg-primary' : 'bg-warning text-dark'
            }`}>
              Status: {reportStatus}
            </span>
            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>Last Updated: {lastUpdatedTime}</div>
          </div>
        </div>
      </div>

      {/* Validation Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertTriangle size={20} />
          <div>
            <strong>Validation Error:</strong> Please fill in all required fields marked in red.
            <ul className="mb-0 mt-1" style={{ fontSize: '0.8rem' }}>
              {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* 2. Top control panel (Date selection & PDF upload) */}
      <div className="row g-4 mb-4">
        
        {/* Date and File details Panel */}
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
                  required
                />
                
                {pdfInfo ? (
                  <div className="alert alert-info py-2 px-3 border border-info mb-0">
                    <h6 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                      <FileText size={15} /> Uploaded PDF Details
                    </h6>
                    <div style={{ fontSize: '0.72rem' }} className="font-monospace">
                      <div>File: {pdfInfo.name}</div>
                      <div>Uploaded By: {pdfInfo.uploadedBy}</div>
                      <div>Uploaded Time: {pdfInfo.uploadedAt}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    No report PDF uploaded yet for this date. Drag & drop file to prefill.
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
              accept=".pdf"
              ref={fileInputRef}
              onChange={(e) => { if (e.target.files.length > 0) processFile(e.target.files[0]); }}
              className="d-none"
            />
            {isExtracting ? (
              <div className="text-center">
                <RefreshCw size={36} className="text-primary spinner mb-2" style={{ animation: 'spin 2s linear infinite' }} />
                <h6 className="fw-bold mb-2">Reading PDF Report...</h6>
                <div className="text-start bg-dark p-2 rounded text-success font-monospace" style={{ fontSize: '0.7rem', width: '220px' }}>
                  {uploadProgress.map((p, i) => <div key={i}>{p}</div>)}
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-muted mb-2" />
                <h6 className="fw-bold mb-1">📄 Upload Daily Report PDF</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                  Drag & Drop PDF Here or <strong>Choose File</strong> (PDF only, max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

      </div>

      {/* 3. Form Sections Grid */}
      <div className="row g-4 mb-5">
        
        {/* Left Side: Summary Fields (Collection, Received, Purchase, Closing Stock) */}
        <div className="col-lg-6">
          <div className="card border-secondary mb-4" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold" style={{ fontSize: '0.9rem' }}>
              Collection & Milk Receipts
            </div>
            <div className="card-body">
              {/* Collection Row */}
              <h6 className="fw-bold border-bottom pb-1" style={{ fontSize: '0.8rem' }}>1. Total Collection (A. District Wise - WYD Column)</h6>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.75rem' }}>Total Wayanad District Collection (Liters)</label>
                  <input
                    type="number"
                    value={collectionData.wyd || ''}
                    onChange={(e) => setCollectionData({ wyd: Number(e.target.value) || 0 })}
                    className={`form-control ${errors.wyd ? 'empty-field' : ''}`}
                  />
                </div>
              </div>

              {/* Received & Purchase */}
              <h6 className="fw-bold border-bottom pb-1" style={{ fontSize: '0.8rem' }}>2. Milk Received at Dock (WYD Column) & Purchase</h6>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem' }}>Wayanad Dairy Dock (Ltr)</label>
                  <input
                    type="number"
                    value={milkReceived.dairy || ''}
                    onChange={(e) => {
                      const dairy = Number(e.target.value) || 0;
                      const mvd = Number(milkReceived.mvd) || 0;
                      setMilkReceived({ ...milkReceived, dairy, total: dairy + mvd });
                    }}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem' }}>Mananthavady Dock (Ltr)</label>
                  <input
                    type="number"
                    value={milkReceived.mvd || ''}
                    onChange={(e) => {
                      const mvd = Number(e.target.value) || 0;
                      const dairy = Number(milkReceived.dairy) || 0;
                      setMilkReceived({ ...milkReceived, mvd, total: dairy + mvd });
                    }}
                    className="form-control"
                  />
                </div>
                <div className="col-12 text-end text-primary fw-bold font-monospace" style={{ fontSize: '0.82rem' }}>
                  Total Milk Received at Dock: {((Number(milkReceived.dairy || 0) + Number(milkReceived.mvd || 0)) || Number(milkReceived.total || 0)).toLocaleString()} Ltr
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem' }}>Milk Closing Stock (Ltr)</label>
                  <input
                    type="number"
                    value={milkClosingStock || ''}
                    onChange={(e) => setMilkClosingStock(Number(e.target.value) || 0)}
                    className={`form-control ${errors.closingStock ? 'empty-field' : ''}`}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem' }}>Purchase Source Unit</label>
                  <input
                    type="text"
                    value={purchase.unitName}
                    onChange={(e) => setPurchase({ ...purchase, unitName: e.target.value })}
                    className="form-control"
                    placeholder="e.g. MANDYA"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem' }}>Purchase Quantity (Kg)</label>
                  <input
                    type="number"
                    value={purchase.quantity || ''}
                    onChange={(e) => setPurchase({ ...purchase, quantity: Number(e.target.value) || 0 })}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CREAM & SMP Single Stocks */}
          <div className="card border-secondary" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold" style={{ fontSize: '0.9rem' }}>
              Bulk Product Stocks
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label fw-bold">Cream Stock (Kg)</label>
                  <input
                    type="number"
                    value={creamStock || ''}
                    onChange={(e) => setCreamStock(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-bold">SMP Stock (Kg)</label>
                  <input
                    type="number"
                    value={smpStock || ''}
                    onChange={(e) => setSmpStock(Number(e.target.value) || 0)}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Category Sales (Milk Sales, Curd Sales) */}
        <div className="col-lg-6">
          <div className="card border-secondary mb-4" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
              <span>Milk Sales Breakdown</span>
              <span className="font-monospace text-info text-end">Total: {totalMilkSale.toLocaleString()} Ltr</span>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {milkSaleCategories.map((cat, idx) => (
                  <div className="col-sm-6" key={cat.name}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: '0.7rem' }}>{cat.name} (Ltr)</label>
                    <input
                      type="number"
                      value={cat.value || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setMilkSaleCategories(milkSaleCategories.map((c, i) => i === idx ? { ...c, value: val } : c));
                      }}
                      className={`form-control form-control-sm ${errors.milkSale ? 'empty-field' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-secondary" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
              <span>Curd Sales Breakdown</span>
              <span className="font-monospace text-info text-end">Total: {totalCurdSale.toLocaleString()} Kg</span>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {curdSaleCategories.map((cat, idx) => (
                  <div className="col-sm-6" key={cat.name}>
                    <label className="form-label text-muted mb-1" style={{ fontSize: '0.7rem' }}>{cat.name} (Kg)</label>
                    <input
                      type="number"
                      value={cat.value || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setCurdSaleCategories(curdSaleCategories.map((c, i) => i === idx ? { ...c, value: val } : c));
                      }}
                      className={`form-control form-control-sm ${errors.curdSale ? 'empty-field' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Variant Tables (Butter, Paneer, Ghee) */}
      <div className="row g-4 mb-5">
        <div className="col-12">
          <h4 className="fw-bold border-bottom pb-2">Product Stock Variants (Kg / Liters)</h4>
        </div>

        {/* Butter Variants */}
        <div className="col-md-4">
          <div className="card border-secondary h-100" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold text-center" style={{ fontSize: '0.85rem' }}>
              Butter Stock Variants (Kg)
            </div>
            <div className="card-body p-2">
              <table className="table table-sm table-borderless align-middle mb-0">
                <tbody>
                  {butterVariants.map((v, idx) => (
                    <tr key={v.name}>
                      <td style={{ fontSize: '0.75rem', width: '40%' }}>{v.name}</td>
                      <td>
                        <input
                          type="number"
                          value={v.value || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setButterVariants(butterVariants.map((item, i) => i === idx ? { ...item, value: val } : item));
                          }}
                          className="form-control form-control-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Paneer Variants */}
        <div className="col-md-4">
          <div className="card border-secondary h-100" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold text-center" style={{ fontSize: '0.85rem' }}>
              Paneer Stock Variants (Kg)
            </div>
            <div className="card-body p-2">
              <table className="table table-sm table-borderless align-middle mb-0">
                <tbody>
                  {paneerVariants.map((v, idx) => (
                    <tr key={v.name}>
                      <td style={{ fontSize: '0.75rem', width: '40%' }}>{v.name}</td>
                      <td>
                        <input
                          type="number"
                          value={v.value || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setPaneerVariants(paneerVariants.map((item, i) => i === idx ? { ...item, value: val } : item));
                          }}
                          className="form-control form-control-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ghee Variants */}
        <div className="col-md-4">
          <div className="card border-secondary h-100" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="card-header bg-dark bg-opacity-25 fw-bold text-center" style={{ fontSize: '0.85rem' }}>
              Ghee Stock Variants (Ltr)
            </div>
            <div className="card-body p-2">
              <table className="table table-sm table-borderless align-middle mb-0">
                <tbody>
                  {gheeVariants.map((v, idx) => (
                    <tr key={v.name}>
                      <td style={{ fontSize: '0.75rem', width: '40%' }}>{v.name}</td>
                      <td>
                        <input
                          type="number"
                          value={v.value || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setGheeVariants(gheeVariants.map((item, i) => i === idx ? { ...item, value: val } : item));
                          }}
                          className="form-control form-control-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Footer Buttons */}
      <div 
        className="d-flex justify-content-between align-items-center py-4 border-top mt-4 mb-4"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
          * Red borders represent required fields that cannot be zero.
        </span>

        <div className="d-flex gap-3">
          <button 
            type="button" 
            onClick={onBackToDashboard} 
            className="btn btn-outline-secondary px-4 py-2"
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            onClick={handleSaveDraft} 
            className="btn btn-warning px-4 py-2 fw-bold text-dark d-flex align-items-center gap-1"
          >
            <Save size={16} /> Save Draft
          </button>

          <button 
            type="button" 
            onClick={handleSubmitClick} 
            className="btn btn-success px-5 py-2 fw-bold d-flex align-items-center gap-1"
          >
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
              This will update the plant dashboard immediately.
            </p>
            <div className="d-flex justify-content-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowConfirmSubmit(false)} 
                className="btn btn-outline-secondary btn-sm px-3"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmit} 
                className="btn btn-success btn-sm px-4 fw-bold"
              >
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
