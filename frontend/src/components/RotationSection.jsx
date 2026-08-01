import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box, Layers, ShieldCheck, Database, Calendar } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const RotationSection = ({
  products = [],
  currentIndex = 0,
  countdown = 20,
  onSelectProduct,
  theme
}) => {
  if (!products || products.length === 0) return null;

  const currentProduct = products[currentIndex];
  const isDark = theme === 'dark';

  // Variant breakdown colors matching the mockup
  const variantColors = [
    isDark ? '#007bff' : '#0d6efd', // Blue
    isDark ? '#28a745' : '#198754', // Green
    isDark ? '#fd7e14' : '#ffc107', // Orange/Yellow
    isDark ? '#6f42c1' : '#820ad1'  // Purple
  ];

  // Configure chart for variant stock
  const totalStock = currentProduct.totalStock || 0;
  const hasVariants = currentProduct.variants && currentProduct.variants.length > 0;
  
  const chartData = {
    labels: hasVariants ? currentProduct.variants.map(v => v.name) : ['Bulk Stock'],
    datasets: [
      {
        data: hasVariants ? currentProduct.variants.map(v => v.value) : [totalStock],
        backgroundColor: hasVariants ? variantColors : [isDark ? '#00E5FF' : '#007bff'],
        borderWidth: isDark ? 1 : 2,
        borderColor: isDark ? '#1e1e1e' : '#ffffff',
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    cutout: '60%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const pct = totalStock > 0 ? ((val / totalStock) * 100).toFixed(1) : 0;
            return `${context.label}: ${val.toLocaleString()} Kg (${pct}%)`;
          }
        }
      }
    }
  };

  // Helper to map product icons
  const getProductIcon = (name) => {
    switch (name.toUpperCase()) {
      case 'CREAM': return '🥛';
      case 'SMP': return '📦';
      case 'BUTTER': return '🧈';
      case 'PANEER': return '🧀';
      case 'GHEE': return '🧈';
      default: return '📦';
    }
  };

  return (
    <div className="section-rotation flex-grow-1">
      {/* 1. Header label for Section 2 */}
      <div className="section-divider mb-3">
        <div className="section-divider-line"></div>
        <div className="section-divider-text">PRODUCT STOCK (AUTO ROTATES EVERY 20 SECONDS)</div>
      </div>

      <div className="rotation-container flex-grow-1">
        
        {/* Card A: Current Product & Countdown */}
        <div className="rotation-product-card">
          <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
            CURRENT PRODUCT
          </div>
          <div className="rotation-product-title text-primary fw-bolder">
            {currentProduct.productName}
          </div>
          
          <div className="mt-2 text-center">
            <div className="text-muted text-uppercase" style={{ fontSize: '0.62rem', fontWeight: 700 }}>Total Stock</div>
            <div className="fw-bold font-monospace" style={{ fontSize: '1.9rem', color: 'var(--text-color)', fontFamily: 'var(--font-digital)' }}>
              {totalStock.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Kg</span>
            </div>
          </div>

          <div className="rotation-countdown">
            <span>NEXT CHANGE IN</span>
            <span className="countdown-number">{countdown}</span>
            <span>SEC</span>
          </div>
        </div>

        {/* Card B: Variant Stock Doughnut Chart */}
        <div className="rotation-chart-container">
          <Doughnut data={chartData} options={chartOptions} />
        </div>

        {/* Card C: Variant Wise Stock Table */}
        <div className="stock-table-card">
          <div className="stock-table-title">Variant Wise Stock</div>
          <div className="table-responsive" style={{ maxHeight: '100%' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th className="text-end">Stock (Kg)</th>
                  <th className="text-end">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {hasVariants ? (
                  currentProduct.variants.map((v, idx) => {
                    const pct = totalStock > 0 ? ((v.value / totalStock) * 100).toFixed(1) : 0;
                    return (
                      <tr key={v.name}>
                        <td style={{ color: 'var(--text-color)' }}>
                          <span 
                            className="category-dot" 
                            style={{ backgroundColor: variantColors[idx % variantColors.length] }}
                          />
                          {v.name}
                        </td>
                        <td className="text-end value-num">{v.value.toLocaleString()}</td>
                        <td className="text-end text-muted font-monospace">{pct}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td style={{ color: 'var(--text-color)' }}>
                      <span 
                        className="category-dot" 
                        style={{ backgroundColor: isDark ? '#00E5FF' : '#007bff' }}
                      />
                      Bulk Stock
                    </td>
                    <td className="text-end value-num">{totalStock.toLocaleString()}</td>
                    <td className="text-end text-muted font-monospace">100%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* Card D: All Products Stock Summary */}
        <div className="stock-table-card">
          <div className="stock-table-title">All Products Stock</div>
          <div className="table-responsive" style={{ maxHeight: '100%' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-end">Total Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <tr 
                      key={p.productName} 
                      className={isActive ? 'row-active-product' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectProduct(idx)}
                    >
                      <td style={{ color: isActive ? 'var(--color-purchase)' : 'var(--text-color)' }}>
                        <span className="me-2">{getProductIcon(p.productName)}</span>
                        {p.productName}
                      </td>
                      <td className="text-end value-num font-monospace fw-bold">
                        {p.totalStock.toLocaleString()} Kg
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Tabs navigation controls at the bottom */}
      <div className="d-flex flex-column align-items-center mt-2">
        <div className="bottom-tabs">
          {products.map((p, idx) => (
            <button
              key={p.productName}
              onClick={() => onSelectProduct(idx)}
              className={`tab-btn ${idx === currentIndex ? 'active-tab' : ''}`}
            >
              <span>{getProductIcon(p.productName)}</span>
              <span>{p.productName}</span>
            </button>
          ))}
        </div>
        <div className="pagination-dots">
          {products.map((_, idx) => (
            <span
              key={idx}
              onClick={() => onSelectProduct(idx)}
              className={`dot ${idx === currentIndex ? 'active-dot' : ''}`}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RotationSection;
