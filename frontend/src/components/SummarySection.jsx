import React, { useEffect, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Truck, ShoppingCart, CupSoda, ClipboardList, TrendingUp, Database } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

// Value change flash animator wrapper
const AnimatedValue = ({ value, unit = '', className = '', style }) => {
  const prevValueRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1000);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const displayVal = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className={`${className} ${flash ? 'value-flash' : ''}`} style={style}>
      {displayVal} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{unit}</span>
    </div>
  );
};

const SummarySection = ({ data, theme }) => {
  if (!data) return null;

  const {
    collectionData = { wyd: 0, mvd: 0 },
    milkReceived = { total: 0, unit: 'WYD' },
    milkSale = { total: 0, categories: [] },
    curdSale = { total: 0, categories: [] },
    purchase = { unitName: '', quantity: 0 },
    milkClosingStock = 0,
    yesterdayClosingStock = 0
  } = data;

  const totalCollection = collectionData.wyd + collectionData.mvd;

  // Chart configuration for Total Collection
  const isDark = theme === 'dark';
  const collectionChartData = {
    labels: ['Wayanad Dairy', 'Mananthavady RMRD'],
    datasets: [
      {
        data: [collectionData.wyd, collectionData.mvd],
        backgroundColor: [
          isDark ? '#6366F1' : '#4F46E5', // Indigo
          isDark ? '#14B8A6' : '#0D9488'  // Teal
        ],
        borderWidth: isDark ? 1 : 2,
        borderColor: isDark ? '#1e1e1e' : '#ffffff',
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    cutout: '65%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const pct = totalCollection > 0 ? ((val / totalCollection) * 100).toFixed(1) : 0;
            return `${context.label}: ${val.toLocaleString()} Ltr (${pct}%)`;
          }
        }
      }
    }
  };

  // Helper for sales breakdown tables
  const renderCategoriesTable = (categories, unit) => {
    if (!categories || categories.length === 0) return <div className="text-muted text-center py-2">No categories</div>;

    return (
      <table className="category-table">
        <tbody>
          {categories.map((cat, i) => {
            let dotColor = '#dee2e6';
            const colors = [
              '#007bff', '#28a745', '#fd7e14', '#6f42c1', '#0dcaf0', '#e83e8c', '#20c997'
            ];
            dotColor = colors[i % colors.length];

            return (
              <tr key={i} style={{ lineHeight: '1.2' }}>
                <td style={{ color: 'var(--text-color)', padding: '2px 0', fontSize: '0.7rem' }}>
                  <span className="category-dot" style={{ backgroundColor: dotColor, width: '5px', height: '5px' }}></span>
                  {cat.name}
                </td>
                <td className="text-end font-monospace text-muted" style={{ padding: '2px 0', fontSize: '0.7rem' }}>
                  {cat.value > 0 ? `${cat.value.toLocaleString()} ${unit}` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };


  const closingStockDiff = (milkClosingStock || 0) - (yesterdayClosingStock || 0);
  const diffSign = closingStockDiff >= 0 ? '+' : '';
  const diffColor = closingStockDiff >= 0 ? 'var(--color-collection)' : '#dc3545';

  return (
    <div className="section-summary">

      {/* 1. Total Collection Card */}
      <div className="industrial-card card-collection">
        <div className="card-title-text d-flex justify-content-between align-items-center w-100 mb-2">
          <div className="d-flex align-items-center gap-2">
            <TrendingUp size={15} style={{ color: 'var(--color-collection)' }} />
            <span>TOTAL WAYANAD COLLECTION</span>
          </div>
        </div>

        {/* Top metrics (large size) wrapped in rounded rectangles */}
        <div className="d-flex justify-content-between align-items-center mb-2 gap-2 px-1">
          <div className="flex-grow-1 p-2 rounded" style={{
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '6px'
          }}>
            <div className="text-muted text-uppercase" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.3px' }}>Total Collection</div>
            <AnimatedValue value={totalCollection} unit="Ltr" className="value-display" style={{ fontSize: '1.9rem', margin: '4px 0 0 0' }} />
          </div>

          <div className="flex-grow-1 p-2 rounded text-end" style={{
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '6px'
          }}>
            <div className="text-muted text-uppercase" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.3px' }}>Milk received at DOCK</div>
            <AnimatedValue value={milkReceived.total} unit="Ltr" className="value-display" style={{ color: 'var(--color-received)', fontSize: '1.9rem', margin: '4px 0 0 0' }} />
          </div>
        </div>

        <div className="collection-card-body mt-1">
          {/* Doughnut Chart */}
          <div className="collection-chart-container" style={{ flex: '1 1 50%', width: '50%', height: '145px', minHeight: '145px', maxHeight: '145px' }}>
            <Doughnut data={collectionChartData} options={chartOptions} />
            <div
              className="position-absolute text-center"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
            >
              <div className="text-muted" style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1 }}>
                WYD : MDY
              </div>
              <div className="fw-bold" style={{ fontSize: '0.8rem', color: 'var(--text-color)', lineHeight: 1.15 }}>
                {totalCollection > 0
                  ? `${((collectionData.wyd / totalCollection) * 100).toFixed(0)}%:${((collectionData.mvd / totalCollection) * 100).toFixed(0)}%`
                  : '0%:0%'}
              </div>
            </div>
          </div>

          {/* Collection Details */}
          <div className="collection-details" style={{ flex: '1 1 50%', gap: '14px', overflow: 'visible', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '1rem' }}>
            <div className="d-flex align-items-start">
              <span className="category-dot mt-1" style={{ backgroundColor: isDark ? '#6366F1' : '#4F46E5', width: '7px', height: '7px', marginRight: '6px', borderRadius: '50%', flexShrink: 0 }} />
              <div className="d-flex flex-column" style={{ lineHeight: 1.25 }}>
                <span className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>Wayanad</span>
                <div style={{ whiteSpace: 'nowrap' }}>
                  <span className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>Dairy:</span>
                  <span className="fw-bold font-monospace ms-1" style={{ color: isDark ? '#818CF8' : '#4F46E5', fontSize: '1.28rem' }}>
                    {collectionData.wyd.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-start">
              <span className="category-dot mt-1" style={{ backgroundColor: isDark ? '#14B8A6' : '#0D9488', width: '7px', height: '7px', marginRight: '6px', borderRadius: '50%', flexShrink: 0 }} />
              <div className="d-flex flex-column" style={{ lineHeight: 1.25 }}>
                <span className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>Mananthavady</span>
                <div style={{ whiteSpace: 'nowrap' }}>
                  <span className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>RMRD:</span>
                  <span className="fw-bold font-monospace ms-1" style={{ color: isDark ? '#2DD4BF' : '#0D9488', fontSize: '1.28rem' }}>
                    {collectionData.mvd.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="text-center rounded mt-2 py-1"
          style={{ background: 'rgba(40,167,69,0.08)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-collection)' }}
        >
          Total Collection = WYD + Mananthavady
        </div>
      </div>

      {/* 2. Milk Net Sale Card */}
      <div className="industrial-card card-sale">
        <div className="card-title-text">
          <ShoppingCart size={15} style={{ color: 'var(--color-sale)' }} />
          MILK NET SALE
        </div>
        <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
          Total Milk Sale in ltr.
        </div>
        <AnimatedValue value={milkSale.total} unit="Ltr" className="value-display mt-0 mb-2" style={{ fontSize: '2.5rem' }} />
        <div className="border-top border-opacity-10 pt-2 flex-grow-1">
          <div className="text-muted text-uppercase font-weight-bold" style={{ fontSize: '0.6rem', letterSpacing: '0.5px', marginBottom: '10px' }}>Category Wise</div>
          {renderCategoriesTable(milkSale.categories, 'Ltr')}
        </div>
      </div>

      {/* 3. Curd Sale Card */}
      <div className="industrial-card card-curd">
        <div className="card-title-text">
          <CupSoda size={15} style={{ color: 'var(--color-curd)' }} />
          CURD SALE
        </div>
        <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
          Total Curd  Sale in kg.
        </div>
        <AnimatedValue value={curdSale.total} unit="Kg" className="value-display mt-0 mb-2" style={{ fontSize: '2.5rem' }} />
        <div className="border-top border-opacity-10 pt-2 flex-grow-1">
          <div className="text-muted text-uppercase font-weight-bold" style={{ fontSize: '0.6rem', letterSpacing: '0.5px', marginBottom: '4px' }}>Category Wise</div>
          {renderCategoriesTable(curdSale.categories, 'Kg')}
        </div>
      </div>

      {/* 4. Purchase Card */}
      <div className="industrial-card card-purchase">
        <div className="card-title-text">
          <ClipboardList size={15} style={{ color: 'var(--color-purchase)' }} />
          PURCHASE (WAYANAD DAIRY)
        </div>
        <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
          Total Purchase in ltr.
        </div>
        {purchase.quantity > 0 ? (
          <AnimatedValue value={purchase.quantity} unit="Ltr" className="value-display mt-0 mb-2" style={{ fontSize: '2.5rem' }} />
        ) : (
          <div className="value-display mt-0 mb-2 text-muted" style={{ fontSize: '1.7rem', fontFamily: 'var(--font-digital)' }}>No Purchase</div>
        )}
        <div className="border-top border-opacity-10 pt-2 flex-grow-1 d-flex flex-column justify-content-end">
          <div
            className="text-center rounded py-2 border text-uppercase"
            style={{
              background: 'rgba(111, 66, 193, 0.06)',
              borderColor: 'var(--border-color)',
              fontSize: '0.72rem',
              color: 'var(--color-purchase)'
            }}
          >
            <div className="text-muted" style={{ fontSize: '0.6rem' }}>From Unit</div>
            <div className="fw-bold">{purchase.quantity > 0 ? purchase.unitName : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* 5. Closing Stock Card */}
      <div className="industrial-card card-stock">
        <div className="card-title-text">
          <Database size={15} style={{ color: 'var(--color-stock-highlight)' }} />
          Milk Closing Stock
        </div>
        <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
          Total Milk Closing Stock in ltr.
        </div>
        <AnimatedValue value={milkClosingStock || 0} unit="Ltr" className="value-display mt-0 mb-2" style={{ fontSize: '2.5rem' }} />
        <div className="border-top border-opacity-10 pt-2 flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted text-uppercase" style={{ fontSize: '0.62rem', fontWeight: 700 }}>Yesterday</span>
            <span className="fw-bold font-monospace" style={{ fontSize: '0.8rem', color: 'var(--text-color)' }}>
              {(yesterdayClosingStock || 0).toLocaleString()} Ltr
            </span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted text-uppercase" style={{ fontSize: '0.62rem', fontWeight: 700 }}>Difference</span>
            <span className="fw-bold font-monospace" style={{ fontSize: '0.82rem', color: diffColor }}>
              {diffSign}{closingStockDiff.toLocaleString()} Ltr
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SummarySection;
