import React, { useState, useEffect } from 'react';
import { Save, Database, Info } from 'lucide-react';

const DataEntry = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('summary');

  useEffect(() => {
    if (initialData) {
      // Create a deep copy of initialData to edit
      setFormData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (section, field, value, index = null, subfield = null) => {
    setFormData(prev => {
      const copy = { ...prev };

      if (index !== null && subfield !== null) {
        // Nested array (e.g. products.variants)
        copy[section][index][subfield] = Number(value) || 0;
      } else if (index !== null) {
        // Array item
        copy[section][index][field] = Number(value) || 0;
      } else if (subfield) {
        // Nested object
        copy[section][field] = Number(value) || 0;
      } else {
        // Root or shallow object field
        if (typeof copy[section] === 'object') {
          copy[section][field] = value;
        } else {
          copy[section] = value;
        }
      }
      return copy;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(0,0,0,0.65)',
        zIndex: 1050,
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        className="card shadow-lg"
        style={{
          width: '760px',
          maxWidth: '92%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card-bg)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        {/* Header */}
        <div className="card-header d-flex justify-content-between align-items-center py-3 px-4" style={{ background: 'var(--section-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--header-text)' }}>
            <Database className="text-primary" size={20} />
            Data Entry Terminal &mdash; Date: {formData.date}
          </h5>
          <button onClick={onClose} className="btn-close" aria-label="Close"></button>
        </div>

        {/* Tab Buttons */}
        <div className="d-flex p-2 px-3 gap-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn btn-sm px-3 fw-semibold"
            style={{
              background: activeFormTab === 'summary' ? 'var(--btn-primary-bg)' : 'transparent',
              color: activeFormTab === 'summary' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${activeFormTab === 'summary' ? 'var(--btn-primary-bg)' : 'var(--border-color)'}`,
              borderRadius: '6px'
            }}
            onClick={() => setActiveFormTab('summary')}
          >
            Collections & Received
          </button>
          <button
            type="button"
            className="btn btn-sm px-3 fw-semibold"
            style={{
              background: activeFormTab === 'sales' ? 'var(--btn-primary-bg)' : 'transparent',
              color: activeFormTab === 'sales' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${activeFormTab === 'sales' ? 'var(--btn-primary-bg)' : 'var(--border-color)'}`,
              borderRadius: '6px'
            }}
            onClick={() => setActiveFormTab('sales')}
          >
            Sales Breakdown
          </button>
          <button
            type="button"
            className="btn btn-sm px-3 fw-semibold"
            style={{
              background: activeFormTab === 'stocks' ? 'var(--btn-primary-bg)' : 'transparent',
              color: activeFormTab === 'stocks' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${activeFormTab === 'stocks' ? 'var(--btn-primary-bg)' : 'var(--border-color)'}`,
              borderRadius: '6px'
            }}
            onClick={() => setActiveFormTab('stocks')}
          >
            Product Stock (Variants)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="card-body overflow-auto py-4">

            {/* TAB 1: SUMMARY DETAILS */}
            {activeFormTab === 'summary' && (
              <div className="row g-3">
                <div className="col-12">
                  <h6 className="fw-bold border-bottom pb-2">Milk Collection (Liters)</h6>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Wayanad Dairy (WYD)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.collectionData.wyd}
                    onChange={(e) => handleChange('collectionData', 'wyd', e.target.value, null, 'sub')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Mananthavady (MVD)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.collectionData.mvd}
                    onChange={(e) => handleChange('collectionData', 'mvd', e.target.value, null, 'sub')}
                    required
                  />
                </div>

                <div className="col-12 mt-4">
                  <h6 className="fw-bold border-bottom pb-2">Milk Received At Dock (Liters)</h6>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Total Quantity Received</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.milkReceived.total}
                    onChange={(e) => handleChange('milkReceived', 'total', e.target.value, null, 'sub')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Receiving Unit Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.milkReceived.unit}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const copy = { ...prev };
                        copy.milkReceived.unit = val;
                        return copy;
                      });
                    }}
                  />
                </div>

                <div className="col-12 mt-4">
                  <h6 className="fw-bold border-bottom pb-2">Outside Purchase</h6>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Purchase Source Unit</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.purchase.unitName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const copy = { ...prev };
                        copy.purchase.unitName = val;
                        return copy;
                      });
                    }}
                    placeholder="e.g. MANDYA DAIRY"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Purchase Quantity (Ltr)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.purchase.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData(prev => {
                        const copy = { ...prev };
                        copy.purchase.quantity = val;
                        return copy;
                      });
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: SALES BREAKDOWN */}
            {activeFormTab === 'sales' && (
              <div className="row g-3">
                <div className="col-12">
                  <h6 className="fw-bold border-bottom pb-2">Milk Net Sales Categories (Liters)</h6>
                </div>
                {formData.milkSale.categories.map((cat, idx) => (
                  <div className="col-md-6" key={cat.name}>
                    <label className="form-label text-muted">{cat.name}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={cat.value}
                      onChange={(e) => handleChange('milkSale', 'value', e.target.value, idx)}
                    />
                  </div>
                ))}

                <div className="col-12 mt-4">
                  <h6 className="fw-bold border-bottom pb-2">Curd Sales Categories (Kg)</h6>
                </div>
                {formData.curdSale.categories.map((cat, idx) => (
                  <div className="col-md-6" key={cat.name}>
                    <label className="form-label text-muted">{cat.name}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={cat.value}
                      onChange={(e) => handleChange('curdSale', 'value', e.target.value, idx)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: PRODUCT STOCKS & VARIANTS */}
            {activeFormTab === 'stocks' && (
              <div className="d-flex flex-column gap-4">
                {formData.products.map((prod, pIdx) => (
                  <div key={prod.productName} className="p-3 rounded-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <h6 className="fw-bold pb-2 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--header-text)' }}>
                      <span>{prod.productName} STOCK</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Auto-computed Total: <strong style={{ color: 'var(--header-text)' }}>{prod.variants.reduce((sum, v) => sum + (Number(v.value) || 0), 0).toLocaleString()} Kg</strong>
                      </span>
                    </h6>
                    <div className="row g-3">
                      {prod.variants.map((variant, vIdx) => (
                        <div className="col-md-3" key={variant.name}>
                          <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{variant.name} Variant</label>
                          <input
                            type="number"
                            className="form-control form-control-sm font-monospace"
                            value={variant.value}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setFormData(prev => {
                                const copy = { ...prev };
                                copy.products[pIdx].variants[vIdx].value = val;
                                return copy;
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Footer Controls */}
          <div className="card-footer d-flex justify-content-between align-items-center py-3 px-4" style={{ background: 'var(--section-header-bg)', borderTop: '1px solid var(--border-color)' }}>
            <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <Info size={14} className="text-primary" />
              Saving updates the database. The Live dashboard will pick up changes on refresh.
            </span>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm px-4 fw-semibold"
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm px-4 d-flex align-items-center gap-1 fw-bold"
                style={{ background: 'var(--btn-primary-bg)', color: '#ffffff', border: 'none', borderRadius: '6px' }}
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataEntry;
