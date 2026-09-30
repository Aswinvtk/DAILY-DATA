import React, { useState } from 'react';
import {
  Truck, ShoppingCart, CupSoda, Flame,
  ChevronDown, ChevronUp
} from 'lucide-react';

const AnimatedValue = ({ value, unit = '', className = '', style }) => {
  const displayVal = typeof value === 'number' 
    ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) 
    : (value || '0');

  return (
    <div className={`${className}`} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {displayVal} <span style={{ fontSize: '0.6em', opacity: 0.7, fontWeight: 600 }}>{unit}</span>
    </div>
  );
};

const SummarySection = ({ data, theme }) => {
  if (!data) return null;
  const isDark = theme === 'dark';

  const [expandedMilk, setExpandedMilk] = useState(true);
  const [expandedCurd, setExpandedCurd] = useState(true);
  const [expandedGhee, setExpandedGhee] = useState(true);

  // Extract Milk Collection details
  const colDetails = data.milkCollectionDetails || {};
  const wydCol = colDetails.wyd || data.collectionData?.wyd || 0;
  const mdyCol = colDetails.mdy || data.collectionData?.mvd || 0;
  const outsidePurchases = Array.isArray(colDetails.outsidePurchases) && colDetails.outsidePurchases.length > 0
    ? colDetails.outsidePurchases
    : (data.purchase?.quantity > 0 ? [{ sourceUnit: data.purchase.unitName || 'Outside Unit', quantity: data.purchase.quantity }] : []);
  const stockOuts = Array.isArray(colDetails.stockOuts) ? colDetails.stockOuts : [];

  const totalOutsidePurchase = outsidePurchases.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalStockOut = stockOuts.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const calculatedTotalCollection = colDetails.totalCollection !== undefined
    ? colDetails.totalCollection
    : (wydCol + mdyCol + totalOutsidePurchase - totalStockOut);

  // Extract MBS Consolidated Product Groups
  const groups = data.mbsProductGroups || {};
  const milkGroup = groups.milk || { totalOB: 0, totalNetProd: 0, totalInvQty: data.milkSale?.total || 0, totalCB: 0, products: [] };
  const curdGroup = groups.curd || { totalOB: 0, totalNetProd: 0, totalInvQty: data.curdSale?.total || 0, totalCB: 0, products: [] };
  const gheeGroup = groups.ghee || { totalOB: 0, totalNetProd: 0, totalInvQty: data.gheeNetSale || 0, totalCB: 0, products: [] };

  const butterGroup = groups.butter || { totalOB: 0, totalNetProd: 0, totalInvQty: data.butterNetSale || 0, totalCB: 0 };
  const paneerGroup = groups.paneer || { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 };
  const pedaGroup = groups.peda || { totalOB: 0, totalNetProd: 0, totalInvQty: data.pedaNetSale || 0, totalCB: 0 };
  const paladaGroup = groups.palada || { totalOB: 0, totalNetProd: 0, totalInvQty: data.paladaNetSale || 0, totalCB: 0 };
  const gheeBiscuitGroup = groups.gheeBiscuit || { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 };
  const condensedMilkGroup = groups.condensedMilk || { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 };
  const otherGroup = groups.other || { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 };

  // Semantic color system — purpose-driven, not product-driven
  const sem = {
    production:  isDark ? '#4ade80' : '#166534',
    sale:        isDark ? '#60a5fa' : '#1d4ed8',
    obCb:        isDark ? '#f8fafc' : '#0f172a',
    label:       isDark ? '#94a3b8' : '#334155',
    warning:     isDark ? '#fbbf24' : '#b45309',
    danger:      isDark ? '#f87171' : '#dc2626',
    collection:  isDark ? '#4ade80' : '#15803d',
    // Card backgrounds
    cardBg:      isDark ? '#0d1527' : '#ffffff',
    cardBorder:  isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
    headerText:  isDark ? '#ffffff' : '#0f172a',
    boxBg:       isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
    boxBorder:   isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    // Subtle semantic backgrounds
    prodBg:      isDark ? 'rgba(74, 222, 128, 0.08)' : 'rgba(22, 101, 52, 0.04)',
    saleBg:      isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(29, 78, 216, 0.05)',
    obCbBg:      isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
  };

  // Bottom 7 product category tiles
  const bottomTiles = [
    { id: 'butter', title: 'BUTTER', groupData: butterGroup, unit: 'Kg' },
    { id: 'paneer', title: 'PANEER', groupData: paneerGroup, unit: 'Kg' },
    { id: 'peda', title: 'PEDA', groupData: pedaGroup, unit: 'Kg' },
    { id: 'palada', title: 'PALADA', groupData: paladaGroup, unit: 'Kg' },
    { id: 'ghee-biscuit', title: 'GHEE BISCUIT', groupData: gheeBiscuitGroup, unit: 'Kg' },
    { id: 'condensed-milk', title: 'CONDENSED MILK', groupData: condensedMilkGroup, unit: 'Kg' },
    { id: 'other', title: 'OTHER PRODUCTS', groupData: otherGroup, unit: 'Kg' }
  ];

  // Reusable metric box for the top 4 cards (OB / PROD / SALE / CB)
  const MetricBox = ({ label, value, unit, color, bgColor, borderColor, isSale = false }) => (
    <div 
      className="p-2 rounded-3 text-center" 
      style={{ 
        background: bgColor || sem.obCbBg, 
        border: borderColor ? `1px solid ${borderColor}` : `1px solid ${sem.boxBorder}` 
      }}
    >
      <div 
        className="fw-bold text-uppercase" 
        style={{ fontSize: '0.72rem', color: sem.label, letterSpacing: '0.5px' }}
      >
        {label}
      </div>
      <AnimatedValue 
        value={value} 
        unit={unit} 
        className="fw-black font-monospace" 
        style={{ color, fontSize: isSale ? '1.25rem' : '1.15rem' }} 
      />
    </div>
  );

  // Reusable product list for collapsible variant sales
  const ProductSalesList = ({ products, saleColor, expanded, setExpanded, title = 'Product-wise Sales' }) => (
    <div className="border-top pt-2">
      <button 
        className="btn btn-sm w-100 d-flex align-items-center justify-content-between p-1 fw-bold"
        style={{ fontSize: '0.75rem', color: sem.label }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="fw-bold text-uppercase">{title}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div 
          className="d-flex flex-column gap-1 mt-1 overflow-y-auto pe-1 position-relative" 
          style={{ maxHeight: '150px', fontSize: '0.75rem' }}
        >
          {products && products.length > 0 ? (
            products.map(p => (
              <div 
                key={p.code} 
                className="d-flex align-items-center justify-content-between p-1 px-2 rounded" 
                style={{ background: sem.boxBg, border: `1px solid ${sem.boxBorder}` }}
              >
                <span className="fw-medium" style={{ color: sem.headerText, whiteSpace: 'normal', lineHeight: 1.3 }}>
                  {p.name}
                  <sup style={{ fontSize: '0.55rem', color: sem.label, marginLeft: '3px', fontWeight: 500 }}>{p.code}</sup>
                </span>
                <span 
                  className="fw-black font-monospace text-nowrap ms-2" 
                  style={{ color: saleColor, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                >
                  {p.invQtyConverted.toLocaleString()} L
                </span>
              </div>
            ))
          ) : (
            <div className="fst-italic p-1" style={{ fontSize: '0.72rem', color: sem.label }}>No variety sales data</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="section-summary-wrapper">

      {/* TOP SECTION: 4 MAIN TILES */}
      <div className="row g-3 mb-3">
        
        {/* TILE 1: MILK COLLECTION */}
        <div className="col-12 col-xl-3 col-md-6">
          <div 
            className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden position-relative"
            style={{ 
              background: sem.cardBg,
              border: `1px solid ${sem.cardBorder}`
            }}
          >
            <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-3" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                  <Truck size={18} />
                </div>
                <h6 className="fw-black text-uppercase mb-0 tracking-wider" style={{ fontSize: '0.92rem', color: sem.headerText }}>
                  MILK COLLECTION
                </h6>
              </div>
            </div>

            <div className="card-body p-3 d-flex flex-column justify-content-between">
              {/* Total Collection Highlight */}
              <div 
                className="p-3 rounded-3 text-center mb-3 position-relative"
                style={{ 
                  background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.35)'
                }}
              >
                <div className="text-uppercase fw-bold" style={{ fontSize: '0.72rem', color: sem.collection, letterSpacing: '0.5px' }}>
                  TOTAL MILK COLLECTION
                </div>
                <AnimatedValue 
                  value={calculatedTotalCollection} 
                  unit="Ltr" 
                  className="fw-black my-1" 
                  style={{ fontSize: '1.9rem', color: sem.collection }}
                />
              </div>

              {/* Source breakdown list */}
              <div className="d-flex flex-column gap-2" style={{ fontSize: '0.78rem' }}>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: sem.boxBg, border: `1px solid ${sem.boxBorder}` }}>
                  <span className="fw-bold" style={{ color: sem.label }}>Wayanad Dairy (WYD)</span>
                  <span className="fw-black font-monospace" style={{ color: sem.collection }}>{wydCol.toLocaleString()} L</span>
                </div>

                <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: sem.boxBg, border: `1px solid ${sem.boxBorder}` }}>
                  <span className="fw-bold" style={{ color: sem.label }}>Mananthavady (MDY)</span>
                  <span className="fw-black font-monospace" style={{ color: sem.collection }}>{mdyCol.toLocaleString()} L</span>
                </div>

                {/* Outside Purchase list */}
                <div className="border-top pt-2 mt-1">
                  <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                    <span className="fw-black text-uppercase" style={{ color: sem.warning }}>Outside Purchase</span>
                    <span className="fw-black font-monospace" style={{ color: sem.warning }}>+{totalOutsidePurchase.toLocaleString()} L</span>
                  </div>
                  {outsidePurchases.length > 0 ? (
                    outsidePurchases.map((p, idx) => (
                      <div key={idx} className="d-flex justify-content-between px-2 py-1 rounded ms-2 mb-1" style={{ background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)', fontSize: '0.72rem' }}>
                        <span className="text-truncate fw-medium" style={{ maxWidth: '120px', color: sem.headerText }}>{p.sourceUnit || 'Outside Unit'}</span>
                        <span className="font-monospace fw-black" style={{ color: sem.warning }}>{Number(p.quantity || 0).toLocaleString()} L</span>
                      </div>
                    ))
                  ) : (
                    <div className="fst-italic px-2" style={{ fontSize: '0.72rem', color: sem.label }}>None</div>
                  )}
                </div>

                {/* Stock Out list */}
                <div className="border-top pt-2">
                  <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                    <span className="fw-black text-uppercase" style={{ color: sem.danger }}>Stock Out</span>
                    <span className="fw-black font-monospace" style={{ color: sem.danger }}>-{totalStockOut.toLocaleString()} L</span>
                  </div>
                  {stockOuts.length > 0 ? (
                    stockOuts.map((s, idx) => (
                      <div key={idx} className="d-flex justify-content-between px-2 py-1 rounded ms-2 mb-1" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)', fontSize: '0.72rem' }}>
                        <span className="text-truncate fw-medium" style={{ maxWidth: '120px', color: sem.headerText }}>{s.destinationUnit || 'Unit'}</span>
                        <span className="font-monospace fw-black" style={{ color: sem.danger }}>{Number(s.quantity || 0).toLocaleString()} L</span>
                      </div>
                    ))
                  ) : (
                    <div className="fst-italic px-2" style={{ fontSize: '0.72rem', color: sem.label }}>None</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* TILE 2: MILK */}
        <div className="col-12 col-xl-3 col-md-6">
          <div 
            className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden"
            style={{ 
              background: sem.cardBg,
              border: `1px solid ${sem.cardBorder}`
            }}
          >
            <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-3" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                  <ShoppingCart size={18} />
                </div>
                <h6 className="fw-black text-uppercase mb-0 tracking-wider" style={{ fontSize: '0.92rem', color: sem.headerText }}>
                  MILK
                </h6>
              </div>
            </div>

            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <MetricBox label="OB" value={milkGroup.totalOB} unit="L" color={sem.obCb} />
                </div>
                <div className="col-6">
                  <MetricBox label="PRODUCTION" value={milkGroup.totalNetProd} unit="L" color={sem.production} bgColor={sem.prodBg} borderColor={isDark ? 'rgba(74,222,128,0.2)' : 'rgba(22,101,52,0.15)'} />
                </div>
                <div className="col-6">
                  <MetricBox label="SALE" value={milkGroup.totalInvQty} unit="L" color={sem.sale} bgColor={sem.saleBg} borderColor={isDark ? 'rgba(96,165,250,0.3)' : 'rgba(29,78,216,0.2)'} isSale />
                </div>
                <div className="col-6">
                  <MetricBox label="CB" value={milkGroup.totalCB} unit="L" color={sem.obCb} />
                </div>
              </div>

              <ProductSalesList 
                products={milkGroup.products} 
                saleColor={sem.sale} 
                expanded={expandedMilk} 
                setExpanded={setExpandedMilk} 
              />
            </div>
          </div>
        </div>

        {/* TILE 3: CURD */}
        <div className="col-12 col-xl-3 col-md-6">
          <div 
            className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden"
            style={{ 
              background: sem.cardBg,
              border: `1px solid ${sem.cardBorder}`
            }}
          >
            <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-3" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  <CupSoda size={18} />
                </div>
                <h6 className="fw-black text-uppercase mb-0 tracking-wider" style={{ fontSize: '0.92rem', color: sem.headerText }}>
                  CURD
                </h6>
              </div>
            </div>

            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <MetricBox label="OB" value={curdGroup.totalOB} unit="L/Kg" color={sem.obCb} />
                </div>
                <div className="col-6">
                  <MetricBox label="PRODUCTION" value={curdGroup.totalNetProd} unit="L/Kg" color={sem.production} bgColor={sem.prodBg} borderColor={isDark ? 'rgba(74,222,128,0.2)' : 'rgba(22,101,52,0.15)'} />
                </div>
                <div className="col-6">
                  <MetricBox label="SALE" value={curdGroup.totalInvQty} unit="L/Kg" color={sem.sale} bgColor={sem.saleBg} borderColor={isDark ? 'rgba(96,165,250,0.3)' : 'rgba(29,78,216,0.2)'} isSale />
                </div>
                <div className="col-6">
                  <MetricBox label="CB" value={curdGroup.totalCB} unit="L/Kg" color={sem.obCb} />
                </div>
              </div>

              <ProductSalesList 
                products={curdGroup.products} 
                saleColor={sem.sale} 
                expanded={expandedCurd} 
                setExpanded={setExpandedCurd} 
              />
            </div>
          </div>
        </div>

        {/* TILE 4: GHEE */}
        <div className="col-12 col-xl-3 col-md-6">
          <div 
            className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden"
            style={{ 
              background: sem.cardBg,
              border: `1px solid ${sem.cardBorder}`
            }}
          >
            <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-3" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                  <Flame size={18} />
                </div>
                <h6 className="fw-black text-uppercase mb-0 tracking-wider" style={{ fontSize: '0.92rem', color: sem.headerText }}>
                  GHEE
                </h6>
              </div>
            </div>

            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <MetricBox label="OB" value={gheeGroup.totalOB} unit="L" color={sem.obCb} />
                </div>
                <div className="col-6">
                  <MetricBox label="PRODUCTION" value={gheeGroup.totalNetProd} unit="L" color={sem.production} bgColor={sem.prodBg} borderColor={isDark ? 'rgba(74,222,128,0.2)' : 'rgba(22,101,52,0.15)'} />
                </div>
                <div className="col-6">
                  {/* Ghee SALE: uses amber in light mode for WCAG AA compliance (not yellow) */}
                  <MetricBox label="SALE" value={gheeGroup.totalInvQty} unit="L" color={sem.sale} bgColor={sem.saleBg} borderColor={isDark ? 'rgba(96,165,250,0.3)' : 'rgba(29,78,216,0.2)'} isSale />
                </div>
                <div className="col-6">
                  <MetricBox label="CB" value={gheeGroup.totalCB} unit="L" color={sem.obCb} />
                </div>
              </div>

              <ProductSalesList 
                products={gheeGroup.products} 
                saleColor={sem.sale} 
                expanded={expandedGhee} 
                setExpanded={setExpandedGhee} 
                title="Major Product Sales"
              />
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: 7 TILES — CLEAN BORDERLESS 4-COLUMN MICRO-GRID */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
          gap: '10px', 
          width: '100%',
          alignItems: 'stretch'
        }}
      >
        {bottomTiles.map(tile => (
          <div key={tile.id} style={{ minWidth: 0 }}>
            <div 
              className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden d-flex flex-column"
              style={{ 
                background: sem.cardBg,
                border: `1px solid ${sem.cardBorder}`,
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.05)'
              }}
            >
              {/* Tile Header: GROUP NAME */}
              <div 
                className="p-2 text-center border-bottom"
                style={{ 
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                  borderColor: sem.boxBorder
                }}
              >
                <h6 
                  className="fw-black text-uppercase mb-0 text-truncate" 
                  style={{ 
                    fontSize: '0.78rem', 
                    letterSpacing: '0.5px',
                    color: sem.headerText 
                  }}
                  title={tile.title}
                >
                  {tile.title}
                </h6>
              </div>

              {/* Borderless 4-Column Micro-Grid: OB | PROD | SALE | CB */}
              <div 
                className="flex-grow-1 p-2"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                }}
              >
                {/* OB */}
                <div className="text-center p-1 rounded-2" style={{ background: sem.obCbBg }}>
                  <div className="fw-bold text-uppercase" style={{ fontSize: '0.65rem', color: sem.label, letterSpacing: '0.5px' }}>
                    OB
                  </div>
                  <div className="fw-black font-monospace" style={{ fontSize: '1.1rem', color: sem.obCb, fontVariantNumeric: 'tabular-nums' }}>
                    {(tile.groupData.totalOB || 0).toLocaleString()}
                    <span style={{ fontSize: '0.55em', opacity: 0.7, fontWeight: 600, marginLeft: '2px' }}>{tile.unit}</span>
                  </div>
                </div>

                {/* PRODUCTION */}
                <div className="text-center p-1 rounded-2" style={{ background: sem.prodBg }}>
                  <div className="fw-bold text-uppercase" style={{ fontSize: '0.65rem', color: sem.label, letterSpacing: '0.5px' }}>
                    PROD
                  </div>
                  <div className="fw-black font-monospace" style={{ fontSize: '1.1rem', color: sem.production, fontVariantNumeric: 'tabular-nums' }}>
                    {(tile.groupData.totalNetProd || 0).toLocaleString()}
                    <span style={{ fontSize: '0.55em', opacity: 0.7, fontWeight: 600, marginLeft: '2px' }}>{tile.unit}</span>
                  </div>
                </div>

                {/* SALE — visually emphasized */}
                <div className="text-center p-1 rounded-2" style={{ background: sem.saleBg, border: isDark ? '1px solid rgba(96,165,250,0.25)' : '1px solid rgba(29,78,216,0.15)' }}>
                  <div className="fw-black text-uppercase" style={{ fontSize: '0.65rem', color: sem.sale, letterSpacing: '0.5px' }}>
                    SALE
                  </div>
                  <div className="fw-black font-monospace" style={{ fontSize: '1.2rem', color: sem.sale, fontVariantNumeric: 'tabular-nums' }}>
                    {(tile.groupData.totalInvQty || 0).toLocaleString()}
                    <span style={{ fontSize: '0.55em', opacity: 0.7, fontWeight: 600, marginLeft: '2px' }}>{tile.unit}</span>
                  </div>
                </div>

                {/* CB */}
                <div className="text-center p-1 rounded-2" style={{ background: sem.obCbBg }}>
                  <div className="fw-bold text-uppercase" style={{ fontSize: '0.65rem', color: sem.label, letterSpacing: '0.5px' }}>
                    CB
                  </div>
                  <div className="fw-black font-monospace" style={{ fontSize: '1.1rem', color: sem.obCb, fontVariantNumeric: 'tabular-nums' }}>
                    {(tile.groupData.totalCB || 0).toLocaleString()}
                    <span style={{ fontSize: '0.55em', opacity: 0.7, fontWeight: 600, marginLeft: '2px' }}>{tile.unit}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SummarySection;
