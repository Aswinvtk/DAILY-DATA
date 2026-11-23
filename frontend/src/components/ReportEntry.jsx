import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Upload, FileText, AlertTriangle, RefreshCw, Save, Check,
  Plus, Trash2, Settings, Database, Layers, CheckCircle2, RotateCcw
} from 'lucide-react';

const ReportEntry = ({ selectedDate, onBackToDashboard, onSave, fetchReportData, initialShowMasterModal, onCloseMasterModal, theme }) => {
  const [reportDate, setReportDate] = useState(selectedDate);
  const [reportStatus, setReportStatus] = useState('Draft');
  const [lastUpdatedTime, setLastUpdatedTime] = useState('N/A');

  // Manual Milk Collection state
  const [wydCol, setWydCol] = useState(0);
  const [mdyCol, setMdyCol] = useState(0);
  const [outsidePurchases, setOutsidePurchases] = useState([{ sourceUnit: 'MANDYA', quantity: 0 }]);
  const [stockOuts, setStockOuts] = useState([]);
  const [milkClosingStock, setMilkClosingStock] = useState(0);

  // MBS Product Groups state (parsed from Excel or fetched from DB)
  const [mbsProductGroups, setMbsProductGroups] = useState(null);

  // Excel extraction state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [excelInfo, setExcelInfo] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [auditLog, setAuditLog] = useState(null);

  // Subgroup Product Master Mapping Editor state
  const [showMasterModal, setShowMasterModal] = useState(initialShowMasterModal || false);
  const [productMasterList, setProductMasterList] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [subgrpFilter, setSubgrpFilter] = useState('ALL');
  const [searchMasterQuery, setSearchMasterQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productCode: '',
    productName: '',
    subgrpCode: 1,
    subgrpName: 'Milk Packets',
    maingrpCode: 1,
    maingrpName: 'Milk Packets',
    shortName: '',
    groupUnit: 'ltr',
    groupNos: 1,
    baseVal: 0.5,
    groupValue: 0.5,
    autoCalculateSku: true
  });

  useEffect(() => {
    if (initialShowMasterModal !== undefined) {
      setShowMasterModal(initialShowMasterModal);
    }
  }, [initialShowMasterModal]);

  const handleCloseMasterModal = () => {
    setShowMasterModal(false);
    if (onCloseMasterModal) onCloseMasterModal();
  };

  const fileInputRef = useRef(null);
  const excelJustExtracted = useRef(false);

  const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const apiBase = `http://${apiHost}:5050`;

  // Fetch Product Master Mappings
  const fetchProductMaster = async () => {
    try {
      const res = await fetch(`${apiBase}/api/product-master`);
      if (res.ok) {
        const data = await res.json();
        setProductMasterList(data);
      }
    } catch (err) {
      console.error('Error fetching Product Master:', err);
    }
  };

  useEffect(() => {
    fetchProductMaster();
  }, []);

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

      // Milk Collection details
      const colDetails = data.milkCollectionDetails || {};
      setWydCol(colDetails.wyd || data.collectionData?.wyd || 0);
      setMdyCol(colDetails.mdy || data.collectionData?.mvd || 0);
      setOutsidePurchases(Array.isArray(colDetails.outsidePurchases) && colDetails.outsidePurchases.length > 0
        ? colDetails.outsidePurchases
        : (data.purchase?.quantity > 0 ? [{ sourceUnit: data.purchase.unitName || 'Outside Unit', quantity: data.purchase.quantity }] : [{ sourceUnit: '', quantity: 0 }]));
      setStockOuts(Array.isArray(colDetails.stockOuts) ? colDetails.stockOuts : []);
      setMilkClosingStock(data.milkClosingStock || 0);

      // MBS Product Groups
      if (data.mbsProductGroups) {
        setMbsProductGroups(data.mbsProductGroups);
      }

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
    if (selectedDate && selectedDate !== reportDate) {
      setReportDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadExistingReport(reportDate);
  }, [reportDate]);

  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  // Helper calculation for total milk collection
  const calcOutsideTotal = () => outsidePurchases.reduce((s, item) => s + (Number(item.quantity) || 0), 0);
  const calcTotalCollection = () => Number((Number(wydCol) + Number(mdyCol)).toFixed(2));

  // Dynamic row additions for Outside Purchases & Stock Outs
  const addOutsidePurchaseRow = () => setOutsidePurchases([...outsidePurchases, { sourceUnit: '', quantity: 0 }]);
  const removeOutsidePurchaseRow = (index) => setOutsidePurchases(outsidePurchases.filter((_, i) => i !== index));
  const updateOutsidePurchase = (index, field, value) => {
    const updated = [...outsidePurchases];
    updated[index][field] = field === 'quantity' ? Number(value) || 0 : value;
    setOutsidePurchases(updated);
  };

  // Helper function to build default empty product groups from product master list if no excel uploaded
  const buildDefaultProductGroups = (masterList) => {
    const groupKeyMap = {
      'Milk': 'milk',
      'Curd': 'curd',
      'Ghee': 'ghee',
      'Butter': 'butter',
      'Paneer': 'paneer',
      'Peda': 'peda',
      'Palada': 'palada',
      'Ghee Biscuit': 'gheeBiscuit',
      'Condensed Milk': 'condensedMilk',
      'Other': 'other'
    };

    const result = {
      milk: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'L', products: [] },
      curd: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'L', products: [] },
      ghee: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'L', products: [] },
      butter: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'Kg', products: [] },
      paneer: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'Kg', products: [] },
      peda: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'Kg', products: [] },
      palada: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'Kg', products: [] },
      gheeBiscuit: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'Kg', products: [] },
      condensedMilk: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'Kg', products: [] },
      other: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'Kg', products: [] }
    };

    if (Array.isArray(masterList)) {
      masterList.forEach(item => {
        const key = groupKeyMap[item.group] || 'other';
        if (result[key]) {
          result[key].products.push({
            code: item.productCode,
            name: item.productName,
            packSize: Number(item.packSizeMultiplier) || 1.0,
            obPack: 0,
            obConverted: 0,
            prodNetPack: 0,
            prodNetConverted: 0,
            invQtyPack: 0,
            invQtyConverted: 0,
            cbPack: 0,
            cbConverted: 0
          });
        }
      });
    }
    return result;
  };

  // Field change handler for product varieties in Automatically Fetched Data section
  const handleProductFieldChange = (groupKey, productIndex, field, value) => {
    setMbsProductGroups(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      const group = copy[groupKey];
      if (!group || !group.products || !group.products[productIndex]) return prev;

      const prod = group.products[productIndex];
      const numVal = Math.max(0, Number(value) || 0);

      if (field === 'obPack') prod.obPack = numVal;
      else if (field === 'prodNetPack') prod.prodNetPack = numVal;
      else if (field === 'invQtyPack') prod.invQtyPack = numVal;
      else if (field === 'cbPack') prod.cbPack = numVal;
      else if (field === 'packSize') prod.packSize = Number(value) || 0;

      // Recalculate converted values for this product (SKU x Qty)
      const factor = Number(prod.packSize) || 1.0;
      prod.obConverted = Number(((Number(prod.obPack) || 0) * factor).toFixed(2));
      prod.prodNetConverted = Number(((Number(prod.prodNetPack) || 0) * factor).toFixed(2));
      prod.invQtyConverted = Number(((Number(prod.invQtyPack) || 0) * factor).toFixed(2));
      prod.cbConverted = Number(((Number(prod.cbPack) || 0) * factor).toFixed(2));

      // Recalculate group totals
      let totOB = 0, totNetProd = 0, totInvQty = 0, totCB = 0;
      group.products.forEach(p => {
        totOB += Number(p.obConverted) || 0;
        totNetProd += Number(p.prodNetConverted) || 0;
        totInvQty += Number(p.invQtyConverted) || 0;
        totCB += Number(p.cbConverted) || 0;
      });

      group.totalOB = Number(totOB.toFixed(2));
      group.totalNetProd = Number(totNetProd.toFixed(2));
      group.totalInvQty = Number(totInvQty.toFixed(2));
      group.totalCB = Number(totCB.toFixed(2));

      return copy;
    });
  };

  const addStockOutRow = () => setStockOuts([...stockOuts, { destinationUnit: '', quantity: 0 }]);
  const removeStockOutRow = (index) => setStockOuts(stockOuts.filter((_, i) => i !== index));
  const updateStockOut = (index, field, value) => {
    const updated = [...stockOuts];
    updated[index][field] = field === 'quantity' ? Number(value) || 0 : value;
    setStockOuts(updated);
  };

  // Drag & drop handlers for Excel upload
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
  };

  // Process uploaded MBS Excel file
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
    setUploadProgress([
      '📤 Uploading MBS Product report to server...',
      '🔑 Matching rows by Product Code...',
      '⚖️ Applying SKU Pack Size unit conversion (L / Kg)...'
    ]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('date', reportDate);

    excelJustExtracted.current = true;

    fetch(`${apiBase}/api/parse-excel`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(result => {
        setIsExtracting(false);
        if (result.success && result.data) {
          const d = result.data;
          setMbsProductGroups(d.mbsProductGroups);
          setUploadProgress([
            '✅ MBS Product Report processed successfully!',
            '✅ Consolidated 10 Product Groups (Milk, Curd, Ghee, Butter, Paneer, Peda, Palada, Ghee Biscuit, Condensed Milk, Other)',
            '✅ Individual product variety sales mapped accurately.'
          ]);
        } else {
          setUploadProgress(['⚠️ Extraction completed with missing data. Verify values manually.']);
        }
        excelJustExtracted.current = false;
      })
      .catch(err => {
        console.error('Excel parse error:', err);
        setIsExtracting(false);
        setUploadProgress(['❌ Parsing failed. Check backend log or enter data manually.']);
        excelJustExtracted.current = false;
      });
  };

  // Build Payload to Save
  const collectPayload = (status) => ({
    date: reportDate,
    status,
    milkCollectionDetails: {
      wyd: Number(wydCol) || 0,
      mdy: Number(mdyCol) || 0,
      outsidePurchases,
      stockOuts,
      totalCollection: calcTotalCollection()
    },
    totalCollection: calcTotalCollection(),
    milkClosingStock: Number(milkClosingStock) || 0,
    mbsProductGroups,
    excelFileName: excelInfo ? excelInfo.name : ''
  });

  const handleSaveDraft = async () => {
    try {
      const payload = collectPayload('Draft');
      if (onSave) {
        await onSave(payload);
      }
      alert('Report saved as DRAFT. Viewer Dashboard has been updated.');
      if (onBackToDashboard) {
        onBackToDashboard(payload.date);
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Failed to save draft. Please check connection.');
    }
  };

  const handleSubmitClick = () => setShowConfirmSubmit(true);

  const handleConfirmSubmit = async () => {
    setShowConfirmSubmit(false);
    try {
      const payload = collectPayload('Submitted');
      if (onSave) {
        await onSave(payload);
      }
      alert('Report successfully submitted! Viewer Dashboard has been updated.');
      if (onBackToDashboard) {
        onBackToDashboard(payload.date);
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Please check connection.');
    }
  };

      // Subgroup Presets array matching PDF structure
      const SUBGROUP_PRESETS = [
        { code: 1, name: 'Milk Packets', maingrpCode: 1, maingrpName: 'Milk Packets', defaultUnit: 'ltr', group: 'Milk' },
        { code: 2, name: 'Curd', maingrpCode: 1, maingrpName: 'Milk Packets', defaultUnit: 'kgs', group: 'Curd' },
        { code: 3, name: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', defaultUnit: 'ltr', group: 'Curd' },
        { code: 51, name: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', defaultUnit: 'ltr', group: 'Curd' },
        { code: 4, name: 'Peda', maingrpCode: 2, maingrpName: 'Products', defaultUnit: 'kgs', group: 'Peda' },
        { code: 5, name: 'Ghee', maingrpCode: 2, maingrpName: 'Products', defaultUnit: 'kgs', group: 'Ghee' },
        { code: 6, name: 'Butter', maingrpCode: 2, maingrpName: 'Products', defaultUnit: 'kgs', group: 'Butter' },
        { code: 7, name: 'Palada', maingrpCode: 2, maingrpName: 'Products', defaultUnit: 'kgs', group: 'Palada' },
        { code: 33, name: 'Paneer', maingrpCode: 2, maingrpName: 'Products', defaultUnit: 'kgs', group: 'Paneer' },
        { code: 38, name: 'Burfi', maingrpCode: 2, maingrpName: 'Products', defaultUnit: 'kgs', group: 'Other' },
        { code: 55, name: 'Biscuits', maingrpCode: 2, maingrpName: 'Products', defaultUnit: 'kgs', group: 'Ghee Biscuit' }
      ];

      // Conversion rule calculator:
      // Rule 3: For Ghee (subgrp 5): sku = sku * 0.9 (all codes except 18)
      // Rule 4: For Curd (subgrp 2): sku = sku * 1.03 (for liter items)
      const calculateGroupValueFrontend = (subgrpCode, productCode, baseVal, groupUnit) => {
        const codeNum = Number(productCode);
        const val = Number(baseVal) || 0;
        const sCode = Number(subgrpCode);
        const unit = (groupUnit || '').toLowerCase();

        if (sCode === 5) {
          if (codeNum === 18) return val; // Code 18 Ghee 15kg Tin without 0.9 multiplier
          return Number((val * 0.9).toFixed(4));
        }
        if (sCode === 2) {
          if (unit === 'ltr' || unit === 'l') {
            return Number((val * 1.03).toFixed(4));
          }
          return val;
        }
        return val;
      };

      // Product Master save / add / delete / reset handlers
      const handleCreateMasterItem = async (e) => {
        e.preventDefault();
        if (!newProduct.productCode || !newProduct.productName) {
          alert('Product Code and Product Name are required');
          return;
        }

        const codeNum = Number(newProduct.productCode);
        const subCode = Number(newProduct.subgrpCode);
        const baseVal = Number(newProduct.baseVal !== undefined ? newProduct.baseVal : newProduct.groupValue);
        const calculatedValue = newProduct.autoCalculateSku
          ? calculateGroupValueFrontend(subCode, codeNum, baseVal, newProduct.groupUnit)
          : Number(newProduct.groupValue);

        const preset = SUBGROUP_PRESETS.find(p => p.code === subCode);

        const payload = {
          productCode: codeNum,
          productName: newProduct.productName.trim(),
          subgrpCode: subCode,
          subgrpName: newProduct.subgrpName || (preset ? preset.name : 'Milk Packets'),
          maingrpCode: Number(newProduct.maingrpCode) || (preset ? preset.maingrpCode : 1),
          maingrpName: newProduct.maingrpName || (preset ? preset.maingrpName : 'Milk Packets'),
          shortName: (newProduct.shortName || '').trim(),
          groupUnit: newProduct.groupUnit || 'ltr',
          groupNos: Number(newProduct.groupNos) || 1,
          groupValue: calculatedValue,
          packSizeMultiplier: calculatedValue,
          group: preset ? preset.group : 'Other',
          unit: newProduct.groupUnit === 'kgs' ? 'Kg' : 'L'
        };

        try {
          const res = await fetch(`${apiBase}/api/product-master`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            setIsAddingProduct(false);
            setNewProduct({
              productCode: '',
              productName: '',
              subgrpCode: 1,
              subgrpName: 'Milk Packets',
              maingrpCode: 1,
              maingrpName: 'Milk Packets',
              shortName: '',
              groupUnit: 'ltr',
              groupNos: 1,
              baseVal: 0.5,
              groupValue: 0.5,
              autoCalculateSku: true
            });
            fetchProductMaster();
          } else {
            const errData = await res.json();
            alert(errData.error || 'Failed to save product master item');
          }
        } catch (err) {
          console.error('Error creating master item:', err);
        }
      };

      const handleSaveMasterItem = async (e) => {
        e.preventDefault();
        if (!editingItem || !editingItem.productCode || !editingItem.productName) return;

        const codeNum = Number(editingItem.productCode);
        const subCode = Number(editingItem.subgrpCode);
        const baseVal = Number(editingItem.baseVal !== undefined ? editingItem.baseVal : editingItem.groupValue);

        let calcVal = Number(editingItem.groupValue);
        if (editingItem.autoCalculateSku) {
          calcVal = calculateGroupValueFrontend(subCode, codeNum, baseVal, editingItem.groupUnit);
        }

        const payload = {
          ...editingItem,
          productCode: codeNum,
          subgrpCode: subCode,
          maingrpCode: Number(editingItem.maingrpCode) || (subCode <= 3 || subCode === 51 ? 1 : 2),
          groupNos: Number(editingItem.groupNos) || 1,
          groupValue: calcVal,
          packSizeMultiplier: calcVal
        };

        try {
          const res = await fetch(`${apiBase}/api/product-master`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            setEditingItem(null);
            fetchProductMaster();
          }
        } catch (err) {
          console.error('Failed to save master item:', err);
        }
      };

      const handleDeleteMasterItem = async (code) => {
        if (!window.confirm(`Are you sure you want to delete Product Code ${code}?`)) return;
        try {
          const res = await fetch(`${apiBase}/api/product-master/${code}`, { method: 'DELETE' });
          if (res.ok) {
            fetchProductMaster();
          }
        } catch (err) {
          console.error('Failed to delete master item:', err);
        }
      };

      const handleResetMaster = async () => {
        if (!window.confirm('Reset all Product Master mappings to factory default product codes?')) return;
        try {
          const res = await fetch(`${apiBase}/api/product-master/reset`, { method: 'POST' });
          if (res.ok) {
            fetchProductMaster();
            alert('Product Master mappings reset to default.');
          }
        } catch (err) {
          console.error('Failed to reset master:', err);
        }
      };

      // Theme-aware style tokens — aligned with modern dashboard palette
      const isDark = theme ? theme === 'dark' : document.documentElement.getAttribute('data-theme') === 'dark';
      const t = {
        cardBg: isDark ? '#0e172e' : '#ffffff',
        cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
        inputBg: isDark ? '#070d19' : '#ffffff',
        inputBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
        inputText: isDark ? '#f8fafc' : '#0f172a',
        labelText: isDark ? '#94a3b8' : '#64748b',
        headerText: isDark ? '#f8fafc' : '#0f172a',
        mutedText: isDark ? '#94a3b8' : '#64748b',
        tableRowBg: isDark ? '#0e172e' : '#ffffff',
        tableBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
        numValue: isDark ? '#f8fafc' : '#0f172a',
        numSubtle: isDark ? '#cbd5e1' : '#334155',
        infoText: isDark ? '#38bdf8' : '#1d4ed8',
        brownText: isDark ? '#f59e0b' : '#b45309',
        dangerText: isDark ? '#f87171' : '#dc2626',
        cautionText: isDark ? '#f59e0b' : '#b45309',
        sectionHeaderBg: isDark ? '#0b1120' : '#f8fafc',
        pillBg: isDark ? '#17233f' : '#f1f5f9',
        pillText: isDark ? '#cbd5e1' : '#334155',
        btnPrimaryBg: isDark ? '#1d4ed8' : '#1d4ed8',
        btnPrimaryText: '#ffffff',
      };

      return (
        <div className="report-entry-page container-fluid" style={{ height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0.75rem 1rem' }}>

          {/* Main Data Entry Sections — Single Screen Screenshot Layout */}
          <div className="row g-2 flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>

            {/* LEFT COLUMN: TOP CONTROLS + MILK COLLECTION + ACTION BUTTONS */}
            <div className="col-lg-4 col-md-5 d-flex flex-column" style={{ height: '100%', minHeight: 0 }}>

              {/* Row 1: Product Master Button & Filename Status Badge */}
              <div className="d-flex align-items-center justify-content-between mb-2 flex-shrink-0">
                <button
                  className="btn btn-sm py-1 px-2 d-flex align-items-center gap-1 fw-bold"
                  onClick={() => setShowMasterModal(true)}
                  style={{ fontSize: '0.75rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.headerText }}
                >
                  <Settings size={14} /> Product Master Mappings
                </button>

                {excelInfo ? (
                  <span className="text-truncate py-1 px-2 font-monospace rounded-2 fw-bold" style={{ maxWidth: '180px', fontSize: '0.68rem', background: t.pillBg, color: t.pillText, border: `1px solid ${t.cardBorder}` }} title={excelInfo.name}>
                    📄 {excelInfo.name}
                  </span>
                ) : (
                  <span className={`badge px-2 py-1 fw-bold text-uppercase`} style={{ fontSize: '0.7rem', background: reportStatus === 'Submitted' ? 'var(--status-ok-bg)' : reportStatus === 'Updated' ? 'var(--sale-bg)' : 'var(--status-draft-bg)', color: reportStatus === 'Submitted' ? 'var(--status-ok-text)' : reportStatus === 'Updated' ? 'var(--sale-label)' : 'var(--status-draft-text)' }}>
                    STATUS: {reportStatus}
                  </span>
                )}
              </div>

              {/* Row 2: Back Button & Operations Date Picker (Expanded height & padding) */}
              <div className="rounded-3 p-2 px-3 mb-2 flex-shrink-0 shadow-sm" style={{ background: t.sectionHeaderBg, border: `1px solid ${t.cardBorder}` }}>
                <div className="d-flex align-items-center justify-content-between gap-2 py-1">
                  <button type="button" onClick={() => onBackToDashboard && onBackToDashboard(reportDate)} className="btn btn-sm px-3 py-1 d-flex align-items-center gap-1 fw-bold" style={{ fontSize: '0.8rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.headerText }}>
                    <ArrowLeft size={15} /> Back
                  </button>
                  <div className="d-flex align-items-center gap-2">
                    <label className="fw-bold mb-0" style={{ fontSize: '0.8rem', color: t.headerText }}>📅 Operations Date:</label>
                    <input
                      type="date"
                      max={getTodayDateStr()}
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="form-control form-control-sm py-1 px-2 font-monospace"
                      style={{ fontSize: '0.85rem', height: '34px', width: '145px', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Upload MBS Product Report Box — Distinct dashed dropzone */}
              <div
                className={`flex-shrink-0 d-flex flex-column align-items-center justify-content-center p-3 rounded-3 mb-2 ${isDragging ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                style={{
                  cursor: 'pointer',
                  border: `2px dashed ${t.cardBorder}`,
                  background: t.tableRowBg,
                  minHeight: '62px',
                  transition: 'border-color 0.2s, background 0.2s'
                }}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={fileInputRef}
                  onChange={(e) => { if (e.target.files.length > 0) processFile(e.target.files[0]); }}
                  className="d-none"
                />
                {isExtracting ? (
                  <div className="d-flex align-items-center gap-2 py-1" style={{ fontSize: '0.8rem', color: t.infoText }}>
                    <RefreshCw size={18} className="spinner" style={{ animation: 'spin 2s linear infinite' }} />
                    <span className="fw-bold">Processing MBS Excel File...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="d-flex align-items-center justify-content-center gap-2 fw-bold mb-1" style={{ fontSize: '0.82rem', color: t.headerText }}>
                      <Upload size={18} style={{ color: t.infoText }} />
                      <span>Upload MBS Product Report (.xls / .xlsx)</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: t.mutedText }}>
                      Drag &amp; Drop MBS report file here or <strong>Click to Browse</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Milk Collection Entry Card (Stretches cleanly to fill space) */}
              <div className="card shadow-sm flex-grow-1 d-flex flex-column mb-2" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, overflow: 'hidden' }}>
                <div className="fw-bold d-flex justify-content-between align-items-center py-2 px-3 flex-shrink-0" style={{ fontSize: '0.85rem', background: t.sectionHeaderBg, borderBottom: `1px solid ${t.cardBorder}`, color: t.headerText }}>
                  <span>🥛 Milk Collection</span>
                  <span className="font-monospace rounded-2 py-1 px-2" style={{ fontSize: '0.75rem', background: t.sectionHeaderBg, color: t.numValue, fontWeight: 700, border: `1px solid ${t.cardBorder}` }}>
                    {calcTotalCollection().toLocaleString()} Ltr
                  </span>
                </div>

                <div className="card-body p-3 overflow-auto flex-grow-1 d-flex flex-column" style={{ fontSize: '0.8rem' }}>

                  {/* Total Collection Banner */}
                  <div className="p-2 rounded-2 mb-3 text-center flex-shrink-0" style={{ background: t.sectionHeaderBg, border: `1px solid ${t.cardBorder}` }}>
                    <div className="text-uppercase fw-bold" style={{ fontSize: '0.68rem', color: t.labelText }}>TOTAL COLLECTION</div>
                    <div className="fw-black font-monospace" style={{ fontSize: '1.4rem', color: t.numValue }}>
                      {calcTotalCollection().toLocaleString()} <span style={{ fontSize: '0.8rem' }}>Ltr</span>
                    </div>
                  </div>

                  {/* WYD & MDY Inputs */}
                  <div className="row g-2 mb-3 flex-shrink-0">
                    <div className="col-6">
                      <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem', color: t.labelText }}>WYD (Ltr)</label>
                      <input
                        type="number"
                        value={wydCol || ''}
                        onChange={(e) => setWydCol(Number(e.target.value) || 0)}
                        className="form-control form-control-sm font-monospace py-1"
                        placeholder="0"
                        style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem', color: t.labelText }}>MDY (Ltr)</label>
                      <input
                        type="number"
                        value={mdyCol || ''}
                        onChange={(e) => setMdyCol(Number(e.target.value) || 0)}
                        className="form-control form-control-sm font-monospace py-1"
                        placeholder="0"
                        style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                      />
                    </div>
                  </div>

                  {/* Outside Purchases List */}
                  <div className="border-top pt-2 mb-3 flex-shrink-0">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold text-uppercase" style={{ fontSize: '0.75rem', color: t.headerText }}>Outside Purchases</span>
                      <button type="button" onClick={addOutsidePurchaseRow} className="btn btn-sm py-0 px-2" style={{ fontSize: '0.7rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.headerText }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                    {outsidePurchases.map((row, idx) => (
                      <div key={idx} className="d-flex gap-1 align-items-center mb-1">
                        <input
                          type="text"
                          placeholder="Source Unit"
                          value={row.sourceUnit}
                          onChange={(e) => updateOutsidePurchase(idx, 'sourceUnit', e.target.value)}
                          className="form-control form-control-sm py-1 px-2"
                          style={{ fontSize: '0.75rem', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                        <input
                          type="number"
                          placeholder="Qty (Ltr)"
                          value={row.quantity || ''}
                          onChange={(e) => updateOutsidePurchase(idx, 'quantity', e.target.value)}
                          className="form-control form-control-sm w-28 font-monospace py-1 px-2"
                          style={{ fontSize: '0.75rem', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                        {outsidePurchases.length > 1 && (
                          <button type="button" onClick={() => removeOutsidePurchaseRow(idx)} className="btn btn-sm p-1" style={{ background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.dangerText }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stock Out List */}
                  <div className="border-top pt-2 mb-3 flex-shrink-0">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold text-uppercase" style={{ fontSize: '0.75rem', color: t.dangerText }}>Stock Out</span>
                      <button type="button" onClick={addStockOutRow} className="btn btn-sm py-0 px-2" style={{ fontSize: '0.7rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.dangerText }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                    {stockOuts.length > 0 ? (
                      stockOuts.map((row, idx) => (
                        <div key={idx} className="d-flex gap-1 align-items-center mb-1">
                          <input
                            type="text"
                            placeholder="Destination Unit"
                            value={row.destinationUnit}
                            onChange={(e) => updateStockOut(idx, 'destinationUnit', e.target.value)}
                            className="form-control form-control-sm py-1 px-2"
                            style={{ fontSize: '0.75rem', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                          />
                          <input
                            type="number"
                            placeholder="Qty (Ltr)"
                            value={row.quantity || ''}
                            onChange={(e) => updateStockOut(idx, 'quantity', e.target.value)}
                            className="form-control form-control-sm w-28 font-monospace py-1 px-2"
                            style={{ fontSize: '0.75rem', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                          />
                          <button type="button" onClick={() => removeStockOutRow(idx)} className="btn btn-sm p-1" style={{ background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.dangerText }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted fst-italic" style={{ fontSize: '0.72rem' }}>None recorded.</div>
                    )}
                  </div>

                  {/* Closing Stock */}
                  <div className="border-top pt-2 mt-auto">
                    <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem', color: t.labelText }}>Milk Closing Stock (Ltr)</label>
                    <input
                      type="number"
                      value={milkClosingStock || ''}
                      onChange={(e) => setMilkClosingStock(Number(e.target.value) || 0)}
                      className="form-control form-control-sm font-monospace py-1"
                      placeholder="0"
                      style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                    />
                  </div>

                </div>
              </div>

              {/* Row 5: Action Buttons Panel — Proper hierarchy: Submit=Primary, Draft=Secondary, Cancel=Ghost */}
              <div className="rounded-3 p-2 px-3 flex-shrink-0 d-flex flex-row justify-content-between align-items-center gap-2 shadow-sm" style={{ background: t.sectionHeaderBg, border: `1px solid ${t.cardBorder}` }}>
                <button type="button" onClick={() => onBackToDashboard && onBackToDashboard(reportDate)} className="btn btn-sm px-3 py-1 fw-bold" style={{ background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.mutedText, fontSize: '0.78rem' }}>
                  Cancel
                </button>
                <div className="d-flex gap-2">
                  <button type="button" onClick={handleSaveDraft} className="btn btn-sm px-3 py-1 fw-bold d-flex align-items-center gap-1" style={{ background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.headerText, fontSize: '0.78rem' }}>
                    <Save size={14} /> Save Draft
                  </button>
                  <button type="button" onClick={handleSubmitClick} className="btn btn-sm px-3 py-1 fw-bold d-flex align-items-center gap-1" style={{ background: t.btnPrimaryBg, color: t.btnPrimaryText, border: 'none', fontSize: '0.78rem' }}>
                    <Check size={14} /> Submit Report
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: AUTOMATICALLY FETCHED DATA (FULL VERTICAL HEIGHT) */}
            <div className="col-lg-8 col-md-7 d-flex flex-column" style={{ height: '100%', minHeight: 0 }}>
              <div className="card shadow-sm flex-grow-1 d-flex flex-column" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, overflow: 'hidden' }}>
                <div className="fw-bold d-flex align-items-center justify-content-between py-2 px-3 flex-shrink-0" style={{ background: t.sectionHeaderBg, borderBottom: `1px solid ${t.cardBorder}`, color: t.headerText }}>
                  <span className="d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                    <Layers size={18} style={{ color: t.infoText }} />
                    Automatically Fetched Data (MBS Product Groups)
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm py-0 px-2 fw-bold d-flex align-items-center gap-1"
                      style={{ fontSize: '0.72rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.infoText }}
                      onClick={() => setShowMasterModal(true)}
                    >
                      <Database size={13} /> Product Mapping & Rules
                    </button>
                    {!mbsProductGroups && (
                      <button
                        type="button"
                        className="btn btn-sm py-0 px-2"
                        style={{ fontSize: '0.72rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.infoText }}
                        onClick={() => setMbsProductGroups(buildDefaultProductGroups(productMasterList))}
                      >
                        Load Product Template
                      </button>
                    )}
                    <span className="font-monospace rounded-2 py-1 px-2" style={{ fontSize: '0.7rem', background: t.pillBg, color: t.pillText }}>
                      Editable Values
                    </span>
                  </div>
                </div>

                {/* CARD BODY SCROLLS INTERNALLY FROM TOP TO BOTTOM */}
                <div className="card-body p-3 overflow-auto flex-grow-1">
                  {mbsProductGroups ? (
                    <div className="d-flex flex-column gap-4">
                      {Object.entries(mbsProductGroups).map(([gKey, gVal]) => {
                        const groupTitleNames = {
                          milk: 'Milk Group',
                          curd: 'Curd Group',
                          ghee: 'Ghee Group',
                          butter: 'Butter Group',
                          paneer: 'Paneer Group',
                          peda: 'Peda Group',
                          palada: 'Palada Group',
                          gheeBiscuit: 'Ghee Biscuit Group',
                          condensedMilk: 'Condensed Milk Group',
                          other: 'Other Products Group'
                        };
                        const groupTitle = groupTitleNames[gKey] || `${gKey.toUpperCase()} Group`;

                        // Calculate total excel packs for summary display
                        const calcTotalPacks = (field) => (gVal.products || []).reduce((sum, p) => sum + (Number(p[field]) || 0), 0);
                        const totalOBPacks = calcTotalPacks('obPack');
                        const totalProdPacks = calcTotalPacks('prodNetPack');
                        const totalInvPacks = calcTotalPacks('invQtyPack');
                        const totalCBPacks = calcTotalPacks('cbPack');

                        return (
                          <div key={gKey} className="mbs-group-card rounded-3 p-3 mb-3">
                            {/* Group Title Header — Neutral colors */}
                            <div className="d-flex align-items-center justify-content-between pb-2 mb-3" style={{ borderBottom: `1px solid ${t.tableBorder}` }}>
                              <h6 className="fw-black text-uppercase mb-0 d-flex align-items-center gap-2" style={{ color: t.headerText, fontSize: '0.92rem' }}>
                                <span>{groupTitle}</span>
                                <span className="font-monospace rounded-2 py-1 px-2" style={{ fontSize: '0.65rem', background: t.pillBg, color: t.pillText }}>
                                  Unit: {gVal.unit}
                                </span>
                              </h6>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: t.mutedText }}>
                                {(gVal.products || []).length} Product Varieties
                              </span>
                            </div>

                            {/* Product Varieties List */}
                            <div className="d-flex flex-column gap-3 mb-3">
                              {(gVal.products || []).length > 0 ? (
                                gVal.products.map((prod, pIdx) => (
                                  <div key={prod.code || pIdx} className="variety-card-box p-3 rounded-3 shadow-sm">
                                    {/* Variety Header */}
                                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1" style={{ borderBottom: `1px solid ${t.tableBorder}` }}>
                                      <span className="fw-bold" style={{ fontSize: '0.86rem', color: t.headerText }}>
                                        Variety {pIdx + 1}: <span className="font-monospace" style={{ color: t.infoText }}>[{prod.code}]</span> {prod.name}
                                      </span>
                                      <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                                        <span className="fw-semibold" style={{ color: t.mutedText }}>SKU Factor:</span>
                                        <input
                                          type="number"
                                          step="0.001"
                                          value={prod.packSize}
                                          onChange={(e) => handleProductFieldChange(gKey, pIdx, 'packSize', e.target.value)}
                                          className="form-control form-control-sm font-monospace py-0 px-2 text-center fw-bold"
                                          style={{ width: '75px', fontSize: '0.8rem', height: '28px', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                                          title="SKU Pack Size Multiplier factor"
                                        />
                                      </div>
                                    </div>

                                    {/* Variety Metrics Grid (OB, Production, Inv Qty, CB) */}
                                    <div className="table-responsive">
                                      <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr className="text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                            <th style={{ width: '22%', color: t.labelText, borderBottom: `2px solid ${t.tableBorder}`, padding: '6px 8px' }}>Metric</th>
                                            <th style={{ width: '28%', color: t.labelText, borderBottom: `2px solid ${t.tableBorder}`, padding: '6px 8px' }}>Excel Qty (Packs)</th>
                                            <th style={{ width: '20%', textAlign: 'center', color: t.labelText, borderBottom: `2px solid ${t.tableBorder}`, padding: '6px 8px' }}>SKU Factor</th>
                                            <th style={{ width: '30%', textAlign: 'right', color: t.labelText, borderBottom: `2px solid ${t.tableBorder}`, padding: '6px 8px' }}>SKU × Qty ({gVal.unit})</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {/* OB Row */}
                                          <tr style={{ background: t.tableRowBg }}>
                                            <td className="fw-bold text-uppercase" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>OB</td>
                                            <td style={{ borderBottom: `1px solid ${t.tableBorder}`, padding: '4px 8px' }}>
                                              <input
                                                type="number"
                                                value={prod.obPack}
                                                onChange={(e) => handleProductFieldChange(gKey, pIdx, 'obPack', e.target.value)}
                                                className="form-control form-control-sm font-monospace py-0 px-2"
                                                style={{ fontSize: '0.82rem', height: '28px', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                                              />
                                            </td>
                                            <td className="font-monospace text-center fw-bold" style={{ color: t.infoText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{prod.packSize}</td>
                                            <td className="font-monospace fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{Number(prod.obConverted || 0).toLocaleString()} {gVal.unit}</td>
                                          </tr>
                                          {/* Production Row */}
                                          <tr>
                                            <td className="fw-bold text-uppercase" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>PRODUCTION</td>
                                            <td style={{ borderBottom: `1px solid ${t.tableBorder}`, padding: '4px 8px' }}>
                                              <input
                                                type="number"
                                                value={prod.prodNetPack}
                                                onChange={(e) => handleProductFieldChange(gKey, pIdx, 'prodNetPack', e.target.value)}
                                                className="form-control form-control-sm font-monospace py-0 px-2"
                                                style={{ fontSize: '0.82rem', height: '28px', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                                              />
                                            </td>
                                            <td className="font-monospace text-center fw-bold" style={{ color: t.infoText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{prod.packSize}</td>
                                            <td className="font-monospace fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{Number(prod.prodNetConverted || 0).toLocaleString()} {gVal.unit}</td>
                                          </tr>
                                          {/* Inv Qty Row */}
                                          <tr style={{ background: t.tableRowBg }}>
                                            <td className="fw-bold text-uppercase" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>INV QTY</td>
                                            <td style={{ borderBottom: `1px solid ${t.tableBorder}`, padding: '4px 8px' }}>
                                              <input
                                                type="number"
                                                value={prod.invQtyPack}
                                                onChange={(e) => handleProductFieldChange(gKey, pIdx, 'invQtyPack', e.target.value)}
                                                className="form-control form-control-sm font-monospace py-0 px-2"
                                                style={{ fontSize: '0.82rem', height: '28px', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                                              />
                                            </td>
                                            <td className="font-monospace text-center fw-bold" style={{ color: t.infoText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{prod.packSize}</td>
                                            <td className="font-monospace fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{Number(prod.invQtyConverted || 0).toLocaleString()} {gVal.unit}</td>
                                          </tr>
                                          {/* CB Row */}
                                          <tr>
                                            <td className="fw-bold text-uppercase" style={{ color: t.headerText, padding: '6px 8px' }}>CB</td>
                                            <td style={{ padding: '4px 8px' }}>
                                              <input
                                                type="number"
                                                value={prod.cbPack}
                                                onChange={(e) => handleProductFieldChange(gKey, pIdx, 'cbPack', e.target.value)}
                                                className="form-control form-control-sm font-monospace py-0 px-2"
                                                style={{ fontSize: '0.82rem', height: '28px', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                                              />
                                            </td>
                                            <td className="font-monospace text-center fw-bold" style={{ color: t.infoText, padding: '6px 8px' }}>{prod.packSize}</td>
                                            <td className="font-monospace fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, padding: '6px 8px' }}>{Number(prod.cbConverted || 0).toLocaleString()} {gVal.unit}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted fst-italic" style={{ fontSize: '0.8rem' }}>No products mapped in this group.</div>
                              )}
                            </div>

                            {/* Group Totals Summary Box — Flat styled, high-contrast */}
                            <div className="rounded-3 p-3" style={{ fontSize: '0.8rem', background: t.sectionHeaderBg, border: `1px solid ${t.cardBorder}` }}>
                              <div className="fw-bold text-uppercase pb-1 mb-2" style={{ fontSize: '0.78rem', color: t.headerText, borderBottom: `1px solid ${t.tableBorder}` }}>
                                {groupTitle} Consolidated Totals
                              </div>
                              <div className="table-responsive">
                                <table className="table table-sm mb-0 align-middle font-monospace" style={{ fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr className="text-uppercase" style={{ fontSize: '0.72rem' }}>
                                      <th style={{ color: t.labelText, borderBottom: `2px solid ${t.tableBorder}`, padding: '6px 8px' }}>Group Metric</th>
                                      <th style={{ color: t.labelText, borderBottom: `2px solid ${t.tableBorder}`, padding: '6px 8px', textAlign: 'right' }}>Total Excel Qty (Packs)</th>
                                      <th style={{ color: t.labelText, borderBottom: `2px solid ${t.tableBorder}`, padding: '6px 8px', textAlign: 'right' }}>Calculated SKU × Qty Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr style={{ background: t.tableRowBg }}>
                                      <td className="fw-bold" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>Total OB</td>
                                      <td className="text-end" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{totalOBPacks.toLocaleString()} Packs</td>
                                      <td className="fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{Number(gVal.totalOB || 0).toLocaleString()} {gVal.unit}</td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>Total Production</td>
                                      <td className="text-end" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{totalProdPacks.toLocaleString()} Packs</td>
                                      <td className="fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{Number(gVal.totalNetProd || 0).toLocaleString()} {gVal.unit}</td>
                                    </tr>
                                    <tr style={{ background: t.tableRowBg }}>
                                      <td className="fw-bold" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>Total INV</td>
                                      <td className="text-end" style={{ color: t.headerText, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{totalInvPacks.toLocaleString()} Packs</td>
                                      <td className="fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, borderBottom: `1px solid ${t.tableBorder}`, padding: '6px 8px' }}>{Number(gVal.totalInvQty || 0).toLocaleString()} {gVal.unit}</td>
                                    </tr>
                                    <tr>
                                      <td className="fw-bold" style={{ color: t.headerText, padding: '6px 8px' }}>Total CB</td>
                                      <td className="text-end" style={{ color: t.headerText, padding: '6px 8px' }}>{totalCBPacks.toLocaleString()} Packs</td>
                                      <td className="fw-bold text-end" style={{ fontSize: '0.86rem', color: t.numValue, padding: '6px 8px' }}>{Number(gVal.totalCB || 0).toLocaleString()} {gVal.unit}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <Layers size={36} className="mb-2 opacity-50" />
                      <h6>No MBS Report Data Available</h6>
                      <p style={{ fontSize: '0.75rem' }} className="mb-3">
                        Upload an ERP/MBS Excel report above or click below to populate the editable template.
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm px-3 fw-semibold"
                        style={{ background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.infoText, borderRadius: '6px' }}
                        onClick={() => setMbsProductGroups(buildDefaultProductGroups(productMasterList))}
                      >
                        Load Product Master Template
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Confirmation Dialog Overlay */}
          {showConfirmSubmit && (
            <div className="confirm-overlay">
              <div className="confirm-box" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.headerText }}>
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: t.cautionText }}>
                  <AlertTriangle size={22} /> Confirm Submission
                </h5>
                <p className="mb-4" style={{ fontSize: '0.85rem', color: t.mutedText }}>
                  Are you sure you want to submit the daily operations report for <strong style={{ color: t.headerText }}>{reportDate}</strong>?
                  This will update the plant dashboard viewer immediately.
                </p>
                <div className="d-flex justify-content-end gap-3">
                  <button type="button" onClick={() => setShowConfirmSubmit(false)} className="btn btn-sm px-3 fw-semibold" style={{ background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.mutedText, borderRadius: '6px' }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleConfirmSubmit} className="btn btn-sm px-4 fw-bold" style={{ background: t.btnPrimaryBg, color: '#ffffff', border: 'none', borderRadius: '6px' }}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Master Manager Modal — Subgroup Wise Mapping & Add Option */}
          {showMasterModal && (
            <div className="confirm-overlay" style={{ zIndex: 1050 }}>
              <div className="confirm-box p-4" style={{ maxWidth: '1150px', width: '95%', maxHeight: '90vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.headerText, borderRadius: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>

                {/* Modal Header */}
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3" style={{ borderColor: t.cardBorder }}>
                  <div className="d-flex align-items-center gap-2">
                    <Database size={22} style={{ color: t.infoText }} />
                    <div>
                      <h5 className="fw-bold mb-0" style={{ color: t.headerText }}>Subgroup Wise Product Mapping Table</h5>
                      <span style={{ fontSize: '0.75rem', color: t.mutedText }}>
                        Manage product master codes, subgroup mappings, and conversion rules
                      </span>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm fw-bold d-flex align-items-center gap-1"
                      onClick={() => { setIsAddingProduct(true); setEditingItem(null); }}
                      style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px' }}
                    >
                      <Plus size={14} /> Add Product
                    </button>
                    <button className="btn btn-sm d-flex align-items-center gap-1" onClick={handleResetMaster} style={{ background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.dangerText, borderRadius: '6px' }}>
                      <RotateCcw size={14} /> Reset Defaults
                    </button>
                    <button className="btn btn-sm" onClick={handleCloseMasterModal} style={{ background: t.pillBg, border: `1px solid ${t.cardBorder}`, color: t.headerText, borderRadius: '6px' }}>
                      Close
                    </button>
                  </div>
                </div>

                {/* Conversion Rule Info Banner */}
                <div className="py-2 px-3 mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2 rounded-2" style={{ fontSize: '0.78rem', background: isDark ? 'rgba(56, 189, 248, 0.1)' : '#eff6ff', border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #bfdbfe', color: isDark ? '#38bdf8' : '#1d4ed8' }}>
                  <div className="d-flex align-items-center gap-3">
                    <span>🧈 <strong>Ghee Rule (Subgroup 5):</strong> <code>sku = sku * 0.9</code> (All codes except Code 18)</span>
                    <span>•</span>
                    <span>🥛 <strong>Curd Rule (Subgroup 2):</strong> <code>sku = sku * 1.03</code> (Liters conversion)</span>
                  </div>
                  <div className="fw-bold" style={{ color: t.headerText }}>
                    Total Products: {productMasterList.length}
                  </div>
                </div>

                {/* Subgroup Filters Bar & Search Box */}
                <div className="row g-2 align-items-center mb-3">
                  <div className="col-md-8 d-flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="btn btn-xs px-2 py-1"
                      style={{
                        fontSize: '0.72rem',
                        borderRadius: '6px',
                        background: subgrpFilter === 'ALL' ? t.btnPrimaryBg : t.cardBg,
                        color: subgrpFilter === 'ALL' ? '#ffffff' : t.mutedText,
                        border: `1px solid ${subgrpFilter === 'ALL' ? t.btnPrimaryBg : t.cardBorder}`,
                        fontWeight: 600
                      }}
                      onClick={() => setSubgrpFilter('ALL')}
                    >
                      All Subgroups ({productMasterList.length})
                    </button>
                    {SUBGROUP_PRESETS.map(sg => {
                      const count = productMasterList.filter(p => Number(p.subgrpCode) === sg.code).length;
                      const isActive = Number(subgrpFilter) === sg.code;
                      return (
                        <button
                          key={sg.code}
                          type="button"
                          className="btn btn-xs px-2 py-1"
                          style={{
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                            background: isActive ? (isDark ? '#382a10' : '#fef3c7') : t.cardBg,
                            color: isActive ? (isDark ? '#fde047' : '#92400e') : t.mutedText,
                            border: `1px solid ${isActive ? (isDark ? '#78350f' : '#fde68a') : t.cardBorder}`,
                            fontWeight: 600
                          }}
                          onClick={() => setSubgrpFilter(String(sg.code))}
                        >
                          {sg.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      placeholder="Search code, product name, short name..."
                      value={searchMasterQuery}
                      onChange={e => setSearchMasterQuery(e.target.value)}
                      className="form-control form-control-sm"
                      style={{ fontSize: '0.78rem', background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                    />
                  </div>
                </div>

                {/* Add Product Form */}
                {isAddingProduct && (
                  <form onSubmit={handleCreateMasterItem} className="p-3 mb-3 rounded-3" style={{ background: t.sectionHeaderBg, border: `1px solid ${t.cardBorder}` }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold mb-0" style={{ color: isDark ? '#4ade80' : '#16a34a' }}>➕ Add New Product Mapping</h6>
                      <button type="button" className="btn btn-sm btn-link p-0 text-decoration-none" style={{ color: t.mutedText }} onClick={() => setIsAddingProduct(false)}>Cancel</button>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Product Code *</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 1535"
                          value={newProduct.productCode}
                          onChange={e => setNewProduct({ ...newProduct, productCode: e.target.value })}
                          className="form-control form-control-sm font-monospace"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Product Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Special Curd 500g"
                          value={newProduct.productName}
                          onChange={e => setNewProduct({ ...newProduct, productName: e.target.value })}
                          className="form-control form-control-sm"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Subgroup Preset</label>
                        <select
                          value={newProduct.subgrpCode}
                          onChange={e => {
                            const code = Number(e.target.value);
                            const preset = SUBGROUP_PRESETS.find(p => p.code === code);
                            if (preset) {
                              setNewProduct({
                                ...newProduct,
                                subgrpCode: preset.code,
                                subgrpName: preset.name,
                                maingrpCode: preset.maingrpCode,
                                maingrpName: preset.maingrpName,
                                groupUnit: preset.defaultUnit
                              });
                            }
                          }}
                          className="form-select form-select-sm"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        >
                          {SUBGROUP_PRESETS.map(p => (
                            <option key={p.code} value={p.code}>{p.code}: {p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Short Name</label>
                        <input
                          type="text"
                          placeholder="e.g. SC500"
                          value={newProduct.shortName}
                          onChange={e => setNewProduct({ ...newProduct, shortName: e.target.value })}
                          className="form-control form-control-sm font-monospace"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mt-1 align-items-center">
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Subgrp Code</label>
                        <input
                          type="number"
                          value={newProduct.subgrpCode}
                          onChange={e => setNewProduct({ ...newProduct, subgrpCode: Number(e.target.value) })}
                          className="form-control form-control-sm"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Subgrp Name</label>
                        <input
                          type="text"
                          value={newProduct.subgrpName}
                          onChange={e => setNewProduct({ ...newProduct, subgrpName: e.target.value })}
                          className="form-control form-control-sm"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Maingrp Code / Name</label>
                        <select
                          value={newProduct.maingrpCode}
                          onChange={e => {
                            const code = Number(e.target.value);
                            setNewProduct({
                              ...newProduct,
                              maingrpCode: code,
                              maingrpName: code === 1 ? 'Milk Packets' : 'Products'
                            });
                          }}
                          className="form-select form-select-sm"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        >
                          <option value={1}>1: Milk Packets</option>
                          <option value={2}>2: Products</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Group Unit</label>
                        <select
                          value={newProduct.groupUnit}
                          onChange={e => setNewProduct({ ...newProduct, groupUnit: e.target.value })}
                          className="form-select form-select-sm font-monospace"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        >
                          <option value="ltr">ltr</option>
                          <option value="kgs">kgs</option>
                        </select>
                      </div>
                      <div className="col-md-1">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Nos</label>
                        <input
                          type="number"
                          value={newProduct.groupNos}
                          onChange={e => setNewProduct({ ...newProduct, groupNos: e.target.value })}
                          className="form-control form-control-sm"
                          style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Base SKU Vol / Wt</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newProduct.baseVal}
                          onChange={e => setNewProduct({ ...newProduct, baseVal: e.target.value, groupValue: e.target.value })}
                          className="form-control form-control-sm font-monospace fw-bold"
                          style={{ background: t.inputBg, color: t.cautionText, border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top" style={{ borderColor: t.cardBorder }}>
                      <div className="form-check form-switch small">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="autoCalculateCheckNew"
                          checked={newProduct.autoCalculateSku}
                          onChange={e => setNewProduct({ ...newProduct, autoCalculateSku: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="autoCalculateCheckNew" style={{ fontSize: '0.75rem', color: t.infoText }}>
                          Auto-apply Conversion Rules (Ghee <code>* 0.9</code> except 18, Curd <code>* 1.03</code>)
                        </label>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="small" style={{ color: t.headerText }}>
                          Final Group Value (SKU): <strong className="font-monospace" style={{ fontSize: '0.9rem', color: isDark ? '#4ade80' : '#16a34a' }}>
                            {newProduct.autoCalculateSku
                              ? calculateGroupValueFrontend(newProduct.subgrpCode, newProduct.productCode, newProduct.baseVal, newProduct.groupUnit)
                              : newProduct.groupValue}
                          </strong>
                        </span>
                        <button type="submit" className="btn btn-sm px-3 fw-bold" style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px' }}>Save New Product</button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Edit Product Form */}
                {editingItem && (
                  <form onSubmit={handleSaveMasterItem} className="p-3 mb-3 rounded-3" style={{ background: t.sectionHeaderBg, border: `1px solid ${t.cardBorder}` }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold mb-0" style={{ color: t.infoText }}>✏️ Edit Product Master Mapping (Code: {editingItem.productCode})</h6>
                      <button type="button" className="btn btn-sm btn-link p-0 text-decoration-none" style={{ color: t.mutedText }} onClick={() => setEditingItem(null)}>Cancel</button>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Code</label>
                        <input type="number" value={editingItem.productCode} disabled className="form-control form-control-sm font-monospace" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }} />
                      </div>
                      <div className="col-md-4">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Product Name</label>
                        <input type="text" value={editingItem.productName} onChange={e => setEditingItem({ ...editingItem, productName: e.target.value })} className="form-control form-control-sm" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }} />
                      </div>
                      <div className="col-md-3">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Subgrp Name</label>
                        <input type="text" value={editingItem.subgrpName} onChange={e => setEditingItem({ ...editingItem, subgrpName: e.target.value })} className="form-control form-control-sm" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }} />
                      </div>
                      <div className="col-md-3">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Short Name</label>
                        <input type="text" value={editingItem.shortName || ''} onChange={e => setEditingItem({ ...editingItem, shortName: e.target.value })} className="form-control form-control-sm font-monospace" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }} />
                      </div>
                    </div>

                    <div className="row g-2 mt-1 align-items-center">
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Subgrp Code</label>
                        <input type="number" value={editingItem.subgrpCode} onChange={e => setEditingItem({ ...editingItem, subgrpCode: Number(e.target.value) })} className="form-control form-control-sm" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }} />
                      </div>
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Maingrp Name</label>
                        <input type="text" value={editingItem.maingrpName} onChange={e => setEditingItem({ ...editingItem, maingrpName: e.target.value })} className="form-control form-control-sm" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }} />
                      </div>
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Group Unit</label>
                        <select value={editingItem.groupUnit} onChange={e => setEditingItem({ ...editingItem, groupUnit: e.target.value })} className="form-select form-select-sm font-monospace" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }}>
                          <option value="ltr">ltr</option>
                          <option value="kgs">kgs</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Group Nos</label>
                        <input type="number" value={editingItem.groupNos} onChange={e => setEditingItem({ ...editingItem, groupNos: e.target.value })} className="form-control form-control-sm" style={{ background: t.inputBg, color: t.inputText, border: `1px solid ${t.inputBorder}` }} />
                      </div>
                      <div className="col-md-4">
                        <label style={{ fontSize: '0.7rem', color: t.labelText }}>Group Value (SKU)</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editingItem.groupValue}
                          onChange={e => setEditingItem({ ...editingItem, groupValue: e.target.value, packSizeMultiplier: e.target.value })}
                          className="form-control form-control-sm font-monospace fw-bold"
                          style={{ background: t.inputBg, color: isDark ? '#4ade80' : '#16a34a', border: `1px solid ${t.inputBorder}` }}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-2">
                      <button type="button" className="btn btn-sm" onClick={() => setEditingItem(null)} style={{ background: t.pillBg, border: `1px solid ${t.cardBorder}`, color: t.headerText }}>Cancel</button>
                      <button type="submit" className="btn btn-sm fw-bold" style={{ background: t.btnPrimaryBg, color: '#ffffff', border: 'none', borderRadius: '6px' }}>Update Mapping</button>
                    </div>
                  </form>
                )}

                {/* Subgroup Wise Products Table */}
                <div className="table-responsive rounded-2" style={{ maxHeight: '420px', border: `1px solid ${t.tableBorder}` }}>
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.75rem', color: t.headerText, background: t.cardBg }}>
                    <thead className="sticky-top" style={{ background: t.sectionHeaderBg, borderBottom: `2px solid ${t.tableBorder}` }}>
                      <tr>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }}>Product Code</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }}>Product Name</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }} className="text-center">Subgrp Code</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }}>Subgrp Name</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }} className="text-center">Maingrp Code</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }}>Maingrp Name</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }}>Short Name</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }}>Group Unit</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }} className="text-center">Group Nos</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }}>Group Value</th>
                        <th style={{ background: t.sectionHeaderBg, color: t.mutedText, borderBottom: `1px solid ${t.tableBorder}` }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productMasterList
                        .filter(item => {
                          const matchesSubgroup = subgrpFilter === 'ALL' || Number(item.subgrpCode) === Number(subgrpFilter);
                          const q = searchMasterQuery.toLowerCase().trim();
                          const matchesSearch = !q ||
                            String(item.productCode).includes(q) ||
                            (item.productName || '').toLowerCase().includes(q) ||
                            (item.shortName || '').toLowerCase().includes(q) ||
                            (item.subgrpName || '').toLowerCase().includes(q);
                          return matchesSubgroup && matchesSearch;
                        })
                        .map(item => {
                          const sCode = Number(item.subgrpCode);
                          const isGhee = sCode === 5;
                          const isCurd = sCode === 2;
                          const isCode18 = Number(item.productCode) === 18;

                          return (
                            <tr key={item.productCode} style={{ borderBottom: `1px solid ${t.tableBorder}`, background: t.cardBg }}>
                              <td className="fw-bold font-monospace" style={{ color: t.cautionText }}>{item.productCode}</td>
                              <td className="fw-semibold" style={{ color: t.headerText }}>{item.productName}</td>
                              <td className="font-monospace text-center" style={{ color: t.mutedText }}>{item.subgrpCode}</td>
                              <td>
                                <span className="badge" style={{ fontSize: '0.7rem', background: t.pillBg, color: t.pillText, border: `1px solid ${t.cardBorder}` }}>
                                  {item.subgrpName}
                                </span>
                              </td>
                              <td className="font-monospace text-center" style={{ color: t.mutedText }}>{item.maingrpCode}</td>
                              <td style={{ color: t.mutedText }}>{item.maingrpName}</td>
                              <td className="font-monospace" style={{ color: t.infoText }}>{item.shortName || '--'}</td>
                              <td className="font-monospace" style={{ color: t.headerText }}>{item.groupUnit}</td>
                              <td className="font-monospace text-center" style={{ color: t.mutedText }}>{item.groupNos}</td>
                              <td className="font-monospace fw-bold" style={{ fontSize: '0.82rem', color: isDark ? '#4ade80' : '#16a34a' }}>
                                {item.groupValue}
                                {isGhee && !isCode18 && (
                                  <span className="badge ms-1" style={{ fontSize: '0.62rem', background: isDark ? '#382a10' : '#fef3c7', color: isDark ? '#fde047' : '#92400e' }}>0.9x</span>
                                )}
                                {isGhee && isCode18 && (
                                  <span className="badge ms-1" style={{ fontSize: '0.62rem', background: isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe', color: t.infoText }}>Code 18 (No 0.9)</span>
                                )}
                                {isCurd && item.groupUnit === 'kgs' && item.groupValue !== 5 && item.groupValue !== 0.525 && item.groupValue !== 0.45 && (
                                  <span className="badge ms-1" style={{ fontSize: '0.62rem', background: isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe', color: t.infoText }}>1.03x</span>
                                )}
                              </td>
                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  <button
                                    className="btn btn-sm p-1 py-0"
                                    style={{ fontSize: '0.7rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.infoText }}
                                    onClick={() => setEditingItem(item)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-sm p-1 py-0"
                                    style={{ fontSize: '0.7rem', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.dangerText }}
                                    onClick={() => handleDeleteMasterItem(item.productCode)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

        </div>
      );
    };

    export default ReportEntry;
