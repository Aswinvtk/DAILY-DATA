import React, { useEffect, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  Truck, ShoppingCart, CupSoda, ClipboardList,
  Flame, Candy, UtensilsCrossed, Droplets, Milk, Zap, Database
} from 'lucide-react';

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
      {displayVal} <span style={{ fontSize: '0.85em', fontWeight: 500 }}>{unit}</span>
    </div>
  );
};

const SummarySection = ({ data, theme }) => {
  if (!data) return null;

  const {
    milkSale = { total: 0 },
    curdSale = { total: 0 },
    purchase = { unitName: '', quantity: 0 },
    milkClosingStock = 0,
    totalCollection = 0,
    gheeNetSale = 0,
    pedaNetSale = 0,
    paladaNetSale = 0,
    sambaramNetSale = 0,
    butterNetSale = 0,
    uhtMilkNetSale = 0,
  } = data;

  const milkSaleTotal = milkSale.total || 0;
  const curdSaleTotal = curdSale.total || 0;
  const isDark = theme === 'dark';

  // Received at Dock breakdown (WYD vs MDY)
  const dockWyd = data.receivedAtDockWyd || data.milkReceived?.dairy || 0;
  const dockMdy = data.receivedAtDockMdy || data.milkReceived?.mvd || 0;
  const dockTotal = dockWyd + dockMdy;

  const wydPct = dockTotal > 0 ? ((dockWyd / dockTotal) * 100).toFixed(1) : '0.0';
  const mdyPct = dockTotal > 0 ? ((dockMdy / dockTotal) * 100).toFixed(1) : '0.0';

  // Doughnut Chart Data for Dock Receipts (WYD vs MDY)
  const dockChartData = {
    labels: ['WYD Dock', 'MDY Dock'],
    datasets: [
      {
        data: dockTotal > 0 ? [dockWyd, dockMdy] : [1, 0],
        backgroundColor: [
          '#6366F1', // WYD Indigo
          '#14B8A6'  // MDY Teal
        ],
        borderWidth: 2,
        borderColor: isDark ? '#111827' : '#ffffff',
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const pct = dockTotal > 0 ? ((val / dockTotal) * 100).toFixed(1) : 0;
            return `${context.label}: ${val.toLocaleString()} Ltr (${pct}%)`;
          }
        }
      }
    }
  };

  // Bottom 6 Product Cards
  const bottomCards = [
    {
      id: 'ghee-net-sale',
      icon: <Flame size={16} color="#f59e0b" />,
      title: 'GHEE NET SALE',
      value: gheeNetSale,
      unit: 'Ltr',
      color: '#f59e0b',
      bgColor: isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.05)',
      borderColor: 'rgba(245,158,11,0.35)',
      subLabel: 'GHEE SALES'
    },
    {
      id: 'peda-net-sale',
      icon: <Candy size={16} color="#ec4899" />,
      title: 'PEDA NET SALE',
      value: pedaNetSale,
      unit: 'Kg',
      color: '#ec4899',
      bgColor: isDark ? 'rgba(236,72,153,0.07)' : 'rgba(236,72,153,0.05)',
      borderColor: 'rgba(236,72,153,0.35)',
      subLabel: 'SWEET SALES'
    },
    {
      id: 'palada-net-sale',
      icon: <UtensilsCrossed size={16} color="#8b5cf6" />,
      title: 'PALADA NET SALE',
      value: paladaNetSale,
      unit: 'Kg',
      color: '#8b5cf6',
      bgColor: isDark ? 'rgba(139,92,246,0.07)' : 'rgba(139,92,246,0.05)',
      borderColor: 'rgba(139,92,246,0.35)',
      subLabel: 'PAYASAM MIX'
    },
    {
      id: 'sambaram',
      icon: <Droplets size={16} color="#06b6d4" />,
      title: 'SAMBARAM',
      value: sambaramNetSale,
      unit: 'Ltr',
      color: '#06b6d4',
      bgColor: isDark ? 'rgba(6,182,212,0.07)' : 'rgba(6,182,212,0.05)',
      borderColor: 'rgba(6,182,212,0.35)',
      subLabel: 'SPICED BUTTERMILK'
    },
    {
      id: 'butter-net-sale',
      icon: <Milk size={16} color="#f97316" />,
      title: 'BUTTER',
      value: butterNetSale,
      unit: 'Kg',
      color: '#f97316',
      bgColor: isDark ? 'rgba(249,115,22,0.07)' : 'rgba(249,115,22,0.05)',
      borderColor: 'rgba(249,115,22,0.35)',
      subLabel: 'BUTTER SALES'
    },
    {
      id: 'uht-milk',
      icon: <Zap size={16} color="#22d3ee" />,
      title: 'UHT MILK',
      value: uhtMilkNetSale,
      unit: 'Ltr',
      color: '#22d3ee',
      bgColor: isDark ? 'rgba(34,211,238,0.07)' : 'rgba(34,211,238,0.05)',
      borderColor: 'rgba(34,211,238,0.35)',
      subLabel: 'LONG LIFE MILK'
    }
  ];

  return (
    <div className="section-summary-wrapper">

      {/* ── Top 4 Cards ─────────────────────────────────────────────── */}
      <div className="section-summary-top">

        {/* CARD 1: MILK COLLECTION */}
        <div className="industrial-card card-collection d-flex flex-column justify-content-between p-3" style={{ background: isDark ? '#0b1329' : '#ffffff' }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e' }}>
              <Truck size={16} color="#22c55e" />
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>•••━</span>
              <span className="fw-black text-uppercase tracking-wider" style={{ fontSize: '1.05rem', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '1.5px' }}>MILK COLLECTION</span>
              <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>━•••</span>
            </div>
          </div>

          {/* TOTAL MILK COLLECTION Box */}
          <div
            className="rounded-3 p-2 text-center position-relative my-1"
            style={{
              background: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)',
              border: '1px solid rgba(34,197,94,0.35)',
              boxShadow: isDark ? '0 0 15px rgba(34,197,94,0.1)' : 'none'
            }}
          >
            <div className="text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: isDark ? '#a7f3d0' : '#166534', letterSpacing: '1px' }}>
              TOTAL MILK COLLECTION
            </div>
            <AnimatedValue
              value={totalCollection}
              unit="Ltr"
              className="value-display my-0 fw-black"
              style={{ fontSize: '2.2rem', color: '#22c55e' }}
            />
          </div>

          {/* WYD Box | Donut Chart | MDY Box */}
          <div className="d-flex align-items-center justify-content-between my-2 position-relative px-1">
            <div
              className="rounded-3 p-2 text-center flex-grow-1"
              style={{
                background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.35)',
                maxWidth: '120px'
              }}
            >
              <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                <span className="rounded-circle" style={{ width: '7px', height: '7px', backgroundColor: '#6366F1' }}></span>
                <span className="fw-bold text-uppercase" style={{ fontSize: '0.72rem', color: isDark ? '#e0e7ff' : '#3730a3' }}>WYD</span>
              </div>
              <div className="fw-black font-monospace" style={{ fontSize: '1.05rem', color: '#818CF8' }}>
                {dockWyd.toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.62rem' }}>Ltr</div>
              <div className="border-top border-secondary border-opacity-25 mt-1 pt-1 fw-bold" style={{ fontSize: '0.65rem', color: '#818CF8' }}>
                {wydPct}% <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>OF TOTAL</span>
              </div>
            </div>

            <div className="flex-grow-1 border-top border-secondary border-opacity-50 mx-1" style={{ borderStyle: 'dotted' }}></div>

            <div style={{ width: '110px', height: '110px', position: 'relative', flexShrink: 0 }}>
              <Doughnut data={dockChartData} options={chartOptions} />
              <div
                className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '46px',
                  height: '46px',
                  background: isDark ? '#090d16' : '#f8fafc',
                  border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}
              >
                <Milk size={22} color="#38bdf8" />
              </div>
            </div>

            <div className="flex-grow-1 border-top border-secondary border-opacity-50 mx-1" style={{ borderStyle: 'dotted' }}></div>

            <div
              className="rounded-3 p-2 text-center flex-grow-1"
              style={{
                background: isDark ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.05)',
                border: '1px solid rgba(20,184,166,0.35)',
                maxWidth: '120px'
              }}
            >
              <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                <span className="rounded-circle" style={{ width: '7px', height: '7px', backgroundColor: '#14B8A6' }}></span>
                <span className="fw-bold text-uppercase" style={{ fontSize: '0.72rem', color: isDark ? '#ccfbf1' : '#115e59' }}>MDY</span>
              </div>
              <div className="fw-black font-monospace" style={{ fontSize: '1.05rem', color: '#2DD4BF' }}>
                {dockMdy.toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.62rem' }}>Ltr</div>
              <div className="border-top border-secondary border-opacity-25 mt-1 pt-1 fw-bold" style={{ fontSize: '0.65rem', color: '#2DD4BF' }}>
                {mdyPct}% <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>OF TOTAL</span>
              </div>
            </div>
          </div>

          {/* TOTAL MILK RECEIVED AT DOCK Box */}
          <div
            className="rounded-3 p-2 d-flex align-items-center justify-content-between my-1"
            style={{
              background: isDark ? 'rgba(6,182,212,0.07)' : 'rgba(6,182,212,0.04)',
              border: '1px dashed rgba(6,182,212,0.4)'
            }}
          >
            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(6,182,212,0.2)', width: '32px', height: '32px' }}>
              <Truck size={16} color="#38bdf8" />
            </div>
            <div className="text-center">
              <div className="text-uppercase fw-bold" style={{ fontSize: '0.62rem', color: isDark ? '#cffaff' : '#0e7490', letterSpacing: '0.5px' }}>
                TOTAL MILK RECEIVED AT DOCK
              </div>
              <div className="fw-black font-monospace" style={{ fontSize: '1.3rem', color: '#38bdf8' }}>
                {dockTotal.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Ltr</span>
              </div>
            </div>
            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(6,182,212,0.2)', width: '32px', height: '32px' }}>
              <Milk size={16} color="#38bdf8" />
            </div>
          </div>

          {/* CLOSING STOCK Box */}
          <div
            className="rounded-3 p-2 d-flex align-items-center justify-content-between mt-1"
            style={{
              background: isDark ? 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(217,119,6,0.1) 100%)' : 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, rgba(217,119,6,0.05) 100%)',
              border: '1.5px solid #eab308',
              boxShadow: isDark ? '0 0 15px rgba(234,179,8,0.15)' : 'none'
            }}
          >
            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(234,179,8,0.25)', width: '36px', height: '36px' }}>
              <Database size={18} color="#eab308" />
            </div>
            <div className="text-center flex-grow-1 ms-2 me-2">
              <div className="fw-black text-uppercase" style={{ fontSize: '0.72rem', color: isDark ? '#fef08a' : '#854d0e', letterSpacing: '1px' }}>
                CLOSING STOCK
              </div>
              <AnimatedValue
                value={milkClosingStock}
                unit="Ltr"
                className="value-display my-0 fw-black font-monospace"
                style={{ fontSize: '1.7rem', color: '#eab308' }}
              />
            </div>
            <div style={{ width: '36px' }}></div>
          </div>

        </div>

        {/* CARD 2: MILK NET SALE */}
        <div className="industrial-card card-sale d-flex flex-column justify-content-between p-3 text-center" style={{ background: isDark ? '#0b1329' : '#ffffff' }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6' }}>
              <ShoppingCart size={16} color="#3b82f6" />
            </div>
            <div className="d-flex align-items-center gap-1">
              <span style={{ color: '#3b82f6', fontSize: '0.7rem' }}>••━</span>
              <span className="fw-black text-uppercase tracking-wider" style={{ fontSize: '0.98rem', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '1px' }}>MILK NET SALE</span>
              <span style={{ color: '#3b82f6', fontSize: '0.7rem' }}>━••</span>
            </div>
          </div>

          {/* Central Main Box with ENLARGED Quantity */}
          <div
            className="rounded-3 p-3 my-auto d-flex flex-column align-items-center justify-content-center flex-grow-1"
            style={{
              background: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)',
              border: '1px solid rgba(59,130,246,0.35)',
              boxShadow: isDark ? '0 0 20px rgba(59,130,246,0.12)' : 'none'
            }}
          >
            <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', color: isDark ? '#bfdbfe' : '#1e40af', letterSpacing: '1px' }}>
              WAYAND DAIRY TOTAL MILK SALES
            </div>
            <AnimatedValue
              value={milkSaleTotal}
              unit="Ltr"
              className="value-display my-1 fw-black text-center"
              style={{ fontSize: '3.1rem', color: '#60a5fa' }}
            />
            <div className="badge bg-primary bg-opacity-25 text-primary px-3 py-1 mt-1 font-monospace" style={{ fontSize: '0.68rem' }}>
              HTM + COW MILK + STD  + ETC
            </div>
          </div>

          {/* Bottom Container */}
          <div
            className="rounded-3 p-2 text-center text-uppercase mt-2"
            style={{
              background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.3)'
            }}
          >
            <div className="text-muted fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>DISTRIBUTION REGION</div>
            <div className="fw-bold font-monospace" style={{ color: isDark ? '#93c5fd' : '#1d4ed8', fontSize: '0.85rem' }}>WAYANAD + NADAPURAM + ULIYERI + NILAMBUR </div>
          </div>

        </div>

        {/* CARD 3: CURD NET SALE */}
        <div className="industrial-card card-curd d-flex flex-column justify-content-between p-3 text-center" style={{ background: isDark ? '#0b1329' : '#ffffff' }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981' }}>
              <CupSoda size={16} color="#10b981" />
            </div>
            <div className="d-flex align-items-center gap-1">
              <span style={{ color: '#10b981', fontSize: '0.7rem' }}>••━</span>
              <span className="fw-black text-uppercase tracking-wider" style={{ fontSize: '0.98rem', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '1px' }}>CURD NET SALE</span>
              <span style={{ color: '#10b981', fontSize: '0.7rem' }}>━••</span>
            </div>
          </div>

          {/* Central Main Box with ENLARGED Quantity */}
          <div
            className="rounded-3 p-3 my-auto d-flex flex-column align-items-center justify-content-center flex-grow-1"
            style={{
              background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
              border: '1px solid rgba(16,185,129,0.35)',
              boxShadow: isDark ? '0 0 20px rgba(16,185,129,0.12)' : 'none'
            }}
          >
            <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', color: isDark ? '#a7f3d0' : '#065f46', letterSpacing: '1px' }}>
              TOTAL CURD SALES IN KG
            </div>
            <AnimatedValue
              value={curdSaleTotal}
              unit="Kg"
              className="value-display my-1 fw-black text-center"
              style={{ fontSize: '3.1rem', color: '#34d399' }}
            />
            <div className="badge bg-success bg-opacity-25 text-success px-3 py-1 mt-1 font-monospace" style={{ fontSize: '0.68rem' }}>
              CURD + KATTIMORU
            </div>
          </div>

          {/* Bottom Container */}
          <div
            className="rounded-3 p-2 text-center text-uppercase mt-2"
            style={{
              background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.3)'
            }}
          >
            <div className="text-muted fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>PRODUCT CATEGORY</div>
            <div className="fw-bold font-monospace" style={{ color: isDark ? '#6ee7b7' : '#047857', fontSize: '0.85rem' }}>PACKAGED CURD &amp; MORU</div>
          </div>

        </div>

        {/* CARD 4: PURCHASE */}
        <div className="industrial-card card-purchase d-flex flex-column justify-content-between p-3 text-center" style={{ background: isDark ? '#0b1329' : '#ffffff' }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b' }}>
              <ClipboardList size={16} color="#f59e0b" />
            </div>
            <div className="d-flex align-items-center gap-1">
              <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>••━</span>
              <span className="fw-black text-uppercase tracking-wider" style={{ fontSize: '0.98rem', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '1px' }}>PURCHASE</span>
              <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>━••</span>
            </div>
          </div>

          {/* Central Main Box with ENLARGED Quantity */}
          <div
            className="rounded-3 p-3 my-auto d-flex flex-column align-items-center justify-content-center flex-grow-1"
            style={{
              background: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)',
              border: '1px solid rgba(245,158,11,0.35)',
              boxShadow: isDark ? '0 0 20px rgba(245,158,11,0.12)' : 'none'
            }}
          >
            <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', color: isDark ? '#fef08a' : '#854d0e', letterSpacing: '1px' }}>
              OUTSIDE MILK PURCHASED
            </div>
            <AnimatedValue
              value={purchase.quantity}
              unit="Ltr"
              className="value-display my-1 fw-black text-center"
              style={{ fontSize: '3.1rem', color: '#fbbf24' }}
            />
            <div className="badge bg-warning bg-opacity-25 text-warning px-3 py-1 mt-1 font-monospace" style={{ fontSize: '0.68rem' }}>
              OUTSIDE UNIT INFLOW
            </div>
          </div>

          {/* Bottom Container: SOURCE UNIT */}
          <div
            className="rounded-3 p-2 text-center text-uppercase mt-2"
            style={{
              background: isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.12) 100%)' : 'rgba(245,158,11,0.08)',
              border: '1.5px solid #f59e0b'
            }}
          >
            <div className="text-muted fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>SOURCE UNIT</div>
            <div className="fw-black font-monospace" style={{ color: '#fbbf24', fontSize: '1.15rem', letterSpacing: '1px' }}>
              {purchase.quantity > 0 ? purchase.unitName : 'N/A'}
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom 6 Product Cards (Center Aligned, Enlarged Numbers, Glowing Borders) ───────────────────────── */}
      <div className="section-summary-bottom">
        {bottomCards.map(card => (
          <div
            key={card.id}
            className="industrial-card d-flex flex-column justify-content-between p-3 text-center"
            style={{
              background: card.bgColor,
              border: `1px solid ${card.borderColor}`,
              boxShadow: isDark ? `0 0 15px ${card.borderColor}` : 'none'
            }}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
              <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {card.icon}
              </div>
              <div className="fw-black text-uppercase" style={{ fontSize: '0.74rem', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '0.5px' }}>
                {card.title}
              </div>
            </div>

            {/* ENLARGED Quantity Display */}
            <div className="my-auto py-1">
              <AnimatedValue
                value={card.value}
                unit={card.unit}
                className="value-display my-0 fw-black text-center"
                style={{
                  fontSize: '2.2rem',
                  color: card.color
                }}
              />
            </div>

            {/* Bottom Sub-label Badge */}
            <div
              className="rounded-2 py-1 px-2 text-center text-uppercase font-monospace fw-bold"
              style={{
                fontSize: '0.62rem',
                background: 'rgba(0,0,0,0.2)',
                color: card.color,
                border: `1px solid ${card.borderColor}`,
                letterSpacing: '0.5px'
              }}
            >
              {card.subLabel}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default SummarySection;
