import React, { useState, useEffect } from 'react';
import { X, Save, Database, Info } from 'lucide-react';

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
        backgroundColor: 'rgba(0,0,0,0.7)', 
        zIndex: 1050,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="card shadow-lg border-secondary"
        style={{ 
          width: '750px', 
          maxWidth: '90%', 
          maxHeight: '85vh', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: 'var(--card-bg)',
          color: 'var(--text-color)'
        }}
      >
        {/* Header */}
        <div className="card-header d-flex justify-content-between align-items-center border-bottom border-secondary py-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <Database className="text-warning" size={20} />
            Data Entry Terminal &mdash; Date: {formData.date}
          </h5>
          <button onClick={onClose} className="btn-close btn-close-white" style={{ filter: 'invert(var(--theme-invert, 0))' }}></button>
        </div>

        {/* Tab Buttons */}
        <div className="bg-light bg-opacity-10 d-flex p-2 gap-2 border-bottom border-secondary">
          <button 
            type="button"
            className={`btn btn-sm ${activeFormTab === 'summary' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveFormTab('summary')}
          >
            Collections & Received
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeFormTab === 'sales' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveFormTab('sales')}
          >
            Sales Breakdown
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeFormTab === 'stocks' ? 'btn-primary' : 'btn-outline-secondary'}`}
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
                    className="form-control bg-dark text-white border-secondary"
                    value={formData.collectionData.wyd}
                    onChange={(e) => handleChange('collectionData', 'wyd', e.target.value, null, 'sub')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Mananthavady (MVD)</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary"
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
                    className="form-control bg-dark text-white border-secondary"
                    value={formData.milkReceived.total}
                    onChange={(e) => handleChange('milkReceived', 'total', e.target.value, null, 'sub')}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Receiving Unit Name</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
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
                    className="form-control bg-dark text-white border-secondary"
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
                    className="form-control bg-dark text-white border-secondary"
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
                      className="form-control bg-dark text-white border-secondary"
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
                      className="form-control bg-dark text-white border-secondary"
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
                  <div key={prod.productName} className="border border-secondary p-3 rounded">
                    <h6 className="fw-bold border-bottom border-secondary pb-2 text-warning d-flex justify-content-between">
                      <span>{prod.productName} STOCK</span>
                      <span className="text-white opacity-50" style={{ fontSize: '0.8rem' }}>
                        Auto-computed Total: {prod.variants.reduce((sum, v) => sum + (Number(v.value) || 0), 0).toLocaleString()} Kg
                      </span>
                    </h6>
                    <div className="row g-3">
                      {prod.variants.map((variant, vIdx) => (
                        <div className="col-md-3" key={variant.name}>
                          <label className="form-label text-muted" style={{ fontSize: '0.75rem' }}>{variant.name} Variant</label>
                          <input
                            type="number"
                            className="form-control form-control-sm bg-dark text-white border-secondary"
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
          <div className="card-footer d-flex justify-content-between align-items-center border-top border-secondary py-3">
            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
              <Info size={14} className="text-info" />
              Saving updates the database. The Live dashboard will pick up changes on refresh.
            </span>
            <div className="d-flex gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-outline-light px-4"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-warning px-4 d-flex align-items-center gap-1 fw-bold"
              >
                <Save size={16} />
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
