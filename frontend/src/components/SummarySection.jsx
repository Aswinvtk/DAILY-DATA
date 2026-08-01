import React, { useEffect, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Truck, ShoppingCart, CupSoda, ClipboardList, TrendingUp } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

// Value change flash animator wrapper
const AnimatedValue = ({ value, unit = '', className = '' }) => {
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
    <div className={`${className} ${flash ? 'value-flash' : ''}`}>
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
    purchase = { unitName: '', quantity: 0 }
  } = data;

  const totalCollection = collectionData.wyd + collectionData.mvd;

  // Chart configuration for Total Collection
  const isDark = theme === 'dark';
  const collectionChartData = {
    labels: ['Wayanad (WYD)', 'Mananthavady (MVD)'],
    datasets: [
      {
        data: [collectionData.wyd, collectionData.mvd],
        backgroundColor: [
          isDark ? '#00E5FF' : '#007bff', // blue
          isDark ? '#39FF14' : '#28a745'  // green
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


  return (
    <div className="section-summary">
      
      {/* 1. Total Collection Card */}
      <div className="industrial-card card-collection">
        <div className="card-title-text">
          <TrendingUp size={15} style={{ color: 'var(--color-collection)' }} />
          TOTAL WAYANAD COLLECTION
        </div>
        <div className="collection-card-body">
          <div className="collection-chart-container">
            <Doughnut data={collectionChartData} options={chartOptions} />
            <div 
              className="position-absolute text-center" 
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
            >
              <div className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>
                WYD : MVD
              </div>
              <div className="fw-bold" style={{ fontSize: '0.75rem', color: 'var(--text-color)' }}>
                {totalCollection > 0 
                  ? `${((collectionData.wyd / totalCollection) * 100).toFixed(0)}%:${((collectionData.mvd / totalCollection) * 100).toFixed(0)}%`
                  : '0%:0%'}
              </div>
            </div>
          </div>
          <div className="collection-details">
            <div className="text-muted text-uppercase" style={{ fontSize: '0.6rem', fontWeight: 700 }}>Total Collection</div>
            <AnimatedValue 
              value={totalCollection} 
              unit="Ltr" 
              className="fw-bold text-wrap" 
              style={{ fontSize: '1.25rem', fontFamily: 'var(--font-digital)', color: 'var(--text-color)' }} 
            />
            
            <div className="collection-detail-row mt-2 border-top border-opacity-10 pt-1">
              <span>WYD:</span>
              <span className="fw-bold font-monospace">{collectionData.wyd.toLocaleString()} Ltr</span>
            </div>
            <div className="collection-detail-row">
              <span>MVD:</span>
              <span className="fw-bold font-monospace">{collectionData.mvd.toLocaleString()} Ltr</span>
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

      {/* 2. Milk Received Card */}
      <div className="industrial-card card-received">
        <div className="card-title-text">
          <Truck size={15} style={{ color: 'var(--color-received)' }} />
          MILK RECEIVED AT DOCK
        </div>
        <div className="d-flex flex-column justify-content-between flex-grow-1">
          <div>
            <div className="text-muted text-uppercase" style={{ fontSize: '0.65rem', fontWeight: 700 }}>Total Proc (Ltr)</div>
            <AnimatedValue value={milkReceived.total} unit="Ltr" className="value-display" />
          </div>
          <div 
            className="text-center rounded py-2 border fw-bold text-uppercase" 
            style={{ 
              background: 'rgba(0, 123, 255, 0.06)', 
              borderColor: 'var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--color-received)'
            }}
          >
            {milkReceived.unit} : {milkReceived.total.toLocaleString()} Ltr
          </div>
        </div>
      </div>

      {/* 3. Milk Sale Card */}
      <div className="industrial-card card-sale">
        <div className="card-title-text">
          <ShoppingCart size={15} style={{ color: 'var(--color-sale)' }} />
          MILK NET SALE
        </div>
        <div>
          <div className="text-muted text-uppercase" style={{ fontSize: '0.65rem', fontWeight: 700 }}>Total Sale (Ltr)</div>
          <AnimatedValue value={milkSale.total} unit="Ltr" className="value-display" />
        </div>
        <div className="border-top border-opacity-10 pt-1">
          <div className="text-muted text-uppercase font-weight-bold" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>Category Wise</div>
          {renderCategoriesTable(milkSale.categories, 'Ltr')}
        </div>
      </div>

      {/* 4. Curd Sale Card */}
      <div className="industrial-card card-curd">
        <div className="card-title-text">
          <CupSoda size={15} style={{ color: 'var(--color-curd)' }} />
          CURD SALE
        </div>
        <div>
          <div className="text-muted text-uppercase" style={{ fontSize: '0.65rem', fontWeight: 700 }}>Total Curd Sale (Kg)</div>
          <AnimatedValue value={curdSale.total} unit="Kg" className="value-display" />
        </div>
        <div className="border-top border-opacity-10 pt-1">
          <div className="text-muted text-uppercase font-weight-bold" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>Category Wise</div>
          {renderCategoriesTable(curdSale.categories, 'Kg')}
        </div>
      </div>

      {/* 5. Purchase Card */}
      <div className="industrial-card card-purchase">
        <div className="card-title-text">
          <ClipboardList size={15} style={{ color: 'var(--color-purchase)' }} />
          PURCHASE (WAYANAD DAIRY)
        </div>
        <div className="d-flex flex-column justify-content-between flex-grow-1">
          <div>
            <div className="text-muted text-uppercase" style={{ fontSize: '0.65rem', fontWeight: 700 }}>Total Purchase (Ltr)</div>
            {purchase.quantity > 0 ? (
              <AnimatedValue value={purchase.quantity} unit="Ltr" className="value-display" />
            ) : (
              <div className="fw-bold font-monospace text-muted mt-2" style={{ fontSize: '1.25rem' }}>
                No Purchase Today
              </div>
            )}
          </div>
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

    </div>
  );
};

export default SummarySection;
