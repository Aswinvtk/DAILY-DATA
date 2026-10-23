import React from 'react';
import { Calendar } from 'lucide-react';

// Format numbers according to Indian numbering system (e.g. 2,20,000 or -1,82,64,683)
// For cards: maxDecimals = 0 (no decimals)
// For table: maxDecimals = 1 (1 decimal if fractional)
const formatIN = (val, maxDecimals = 0) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const hasFraction = maxDecimals > 0 && absNum % 1 !== 0;
  const formatted = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: hasFraction ? maxDecimals : 0,
    maximumFractionDigits: maxDecimals
  });
  return isNegative ? `-${formatted}` : formatted;
};

// Format date as DD/MM/YYYY
const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {}
  return dateStr;
};

const SummarySection = ({ data, selectedDate, onOpenDataEntry }) => {
  // Extract Milk Collection details
  const colDetails = data?.milkCollectionDetails || {};
  const wydCol = Number(colDetails.wyd || data?.collectionData?.wyd || 0);
  const mdyCol = Number(colDetails.mdy || data?.collectionData?.mvd || 0);

  const outsidePurchases = Array.isArray(colDetails.outsidePurchases) && colDetails.outsidePurchases.length > 0
    ? colDetails.outsidePurchases.filter(p => (Number(p.quantity) || 0) > 0 || (p.sourceUnit && p.sourceUnit.trim() !== ''))
    : (data?.purchase?.quantity > 0 ? [{ sourceUnit: data.purchase.unitName || 'Outside Unit', quantity: data.purchase.quantity }] : []);

  const stockOuts = Array.isArray(colDetails.stockOuts)
    ? colDetails.stockOuts.filter(s => (Number(s.quantity) || 0) > 0 || (s.destinationUnit && s.destinationUnit.trim() !== ''))
    : [];

  const totalOutsidePurchase = outsidePurchases.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalStockOut = stockOuts.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Requirement 3: Total milk collected = Wayanad Dairy (WYD) + Manathavady (MDY) ONLY.
  // Do NOT add outside purchase. Do NOT subtract stock transfers.
  const totalCollected = wydCol + mdyCol;

  // Extract MBS Consolidated Product Groups
  const groups = data?.mbsProductGroups || {};
  const milkGroup = groups.milk || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.milkSale?.total || 0, totalCB: 0 };
  const curdGroup = groups.curd || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.curdSale?.total || 0, totalCB: 0 };
  const gheeGroup = groups.ghee || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.gheeNetSale || 0, totalCB: 0 };

  const butterGroup = groups.butter || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.butterNetSale || 0, totalCB: 0 };
  const paneerGroup = groups.paneer || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.paneerNetSale || 0, totalCB: 0 };
  const pedaGroup = groups.peda || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.pedaNetSale || 0, totalCB: 0 };
  const paladaGroup = groups.palada || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.paladaNetSale || 0, totalCB: 0 };
  const gheeBiscuitGroup = groups.gheeBiscuit || { totalOB: 0, totalNetProd: 0, totalInvQty: data?.gheeBiscuitNetSale || 0, totalCB: 0 };
  const condensedMilkGroup = groups.condensedMilk || { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 };

  const milkProd = Number(milkGroup.totalNetProd || 0);
  const milkSale = Number(milkGroup.totalInvQty || 0);

  const curdProd = Number(curdGroup.totalNetProd || 0);
  const curdSale = Number(curdGroup.totalInvQty || 0);

  const gheeProd = Number(gheeGroup.totalNetProd || 0);
  const gheeSale = Number(gheeGroup.totalInvQty || 0);

  // Check if date has no data
  const isNoData = !data || data.status === 'No Data' || (
    wydCol === 0 &&
    mdyCol === 0 &&
    totalOutsidePurchase === 0 &&
    totalStockOut === 0 &&
    milkProd === 0 &&
    milkSale === 0 &&
    curdProd === 0 &&
    curdSale === 0 &&
    gheeProd === 0 &&
    gheeSale === 0
  );

  // Empty-state card per Requirement 1
  if (isNoData) {
    const formattedDate = formatDDMMYYYY(selectedDate) || selectedDate || 'the selected date';
    return (
      <div className="milma-empty-container">
        <div className="milma-empty-card">
          <div className="milma-empty-icon-circle">
            <Calendar size={32} className="milma-empty-icon" />
          </div>
          <h3 className="milma-empty-text">
            No data for {formattedDate}. Pick another date or add figures in Data entry.
          </h3>
          <button
            type="button"
            className="milma-empty-entry-btn"
            onClick={onOpenDataEntry}
          >
            Go to Data entry
          </button>
        </div>
      </div>
    );
  }

  // Row 2 Donut calculation: WYD vs MDY ONLY (do not show outside purchase)
  const wydMdyTotal = wydCol + mdyCol;
  const wydPct = wydMdyTotal > 0 ? Math.round((wydCol / wydMdyTotal) * 100) : 0;
  const mdyPct = wydMdyTotal > 0 ? (100 - wydPct) : 0;

  // SVG Donut geometry
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.292
  const wydArc = (wydPct / 100) * circumference;
  const mdyArc = (mdyPct / 100) * circumference;

  // Products List for bottom table per Requirement 5
  const productsList = [
    { name: 'Butter', unit: 'Kg', group: butterGroup },
    { name: 'Paneer', unit: 'Kg', group: paneerGroup },
    { name: 'Peda', unit: 'Kg', group: pedaGroup },
    { name: 'Palada', unit: 'Kg', group: paladaGroup },
    { name: 'Ghee biscuit', unit: 'Kg', group: gheeBiscuitGroup },
    { name: 'Condensed milk', unit: 'Kg', group: condensedMilkGroup }
  ];

  return (
    <div className="milma-dashboard-content">
      {/* ========================================================= */}
      {/* ROW 1: Four Equal-Width Cards                             */}
      {/* ========================================================= */}
      <div className="milma-kpi-grid-4">
        {/* Card 1: Total milk collected (Solid Blue Highlight) */}
        <div className="milma-kpi-card milma-kpi-blue">
          <div className="milma-kpi-title">Total milk collected</div>
          <div className="milma-kpi-value">
            {formatIN(totalCollected)}{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-kpi-subtext">
            Wayanad Dairy + Manathavady
          </div>
        </div>

        {/* Card 2: Outside purchase */}
        <div className="milma-kpi-card">
          <div className="milma-kpi-title">Outside purchase</div>
          <div className="milma-kpi-value">
            {formatIN(totalOutsidePurchase)}{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-card-list">
            {outsidePurchases.length > 0 ? (
              outsidePurchases.map((p, idx) => (
                <div key={idx} className="milma-card-list-row">
                  <span className="milma-list-label">{p.sourceUnit || 'Outside Supplier'}</span>
                  <span className="milma-list-val">{formatIN(p.quantity)} L</span>
                </div>
              ))
            ) : (
              <div className="milma-card-list-empty">No outside purchases</div>
            )}
          </div>
        </div>

        {/* Card 3: Milk sale */}
        <div className="milma-kpi-card">
          <div className="milma-kpi-title">Milk sale</div>
          <div className="milma-kpi-value">
            {formatIN(milkSale)}{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-kpi-subtext">Today's milk sale</div>
        </div>

        {/* Card 4: Stock out (stock transfers) */}
        <div className="milma-kpi-card">
          <div className="milma-kpi-title">Stock out (transfers)</div>
          <div className="milma-kpi-value">
            {formatIN(totalStockOut)}{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-card-list">
            {stockOuts.length > 0 ? (
              stockOuts.map((s, idx) => (
                <div key={idx} className="milma-card-list-row">
                  <span className="milma-list-label">{s.destinationUnit || 'Unit not specified'}</span>
                  <span className="milma-list-val">{formatIN(s.quantity)} L</span>
                </div>
              ))
            ) : (
              <div className="milma-card-list-empty">No transfers today</div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 2: Four Equal-Width, Equal-Height Cards               */}
      {/* ========================================================= */}
      <div className="milma-row2-grid-4">
        {/* Card 1: Where the milk came from (Donut Chart) */}
        <div className="milma-card milma-donut-card">
          <h2 className="milma-card-title">Where the milk came from</h2>

          <div className="milma-donut-wrapper">
            <svg
              className="milma-donut-svg"
              width="150"
              height="150"
              viewBox="0 0 150 150"
            >
              {/* Background circle track */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                className="milma-donut-bg-track"
                fill="none"
                strokeWidth="16"
              />

              {/* Rotated segment container starting at 12 o'clock */}
              <g transform="rotate(-90 75 75)">
                {/* WYD Segment (Dark Blue) */}
                {wydMdyTotal > 0 && wydArc > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="none"
                    stroke="#0b57d0"
                    strokeWidth="16"
                    strokeDasharray={`${wydArc} ${circumference}`}
                    strokeDashoffset="0"
                  />
                )}
                {/* MDY Segment (Light Blue) */}
                {wydMdyTotal > 0 && mdyArc > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="16"
                    strokeDasharray={`${mdyArc} ${circumference}`}
                    strokeDashoffset={`-${wydArc}`}
                  />
                )}
              </g>

              {/* Center Value and Label */}
              <text
                x="75"
                y="71"
                textAnchor="middle"
                className="milma-donut-val"
              >
                {formatIN(wydMdyTotal)}
              </text>
              <text
                x="75"
                y="88"
                textAnchor="middle"
                className="milma-donut-lbl"
              >
                LITRES
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="milma-donut-legend">
            <div className="milma-legend-row">
              <div className="milma-legend-label">
                <span className="milma-color-dot milma-dot-wyd" />
                <span>Wayanad Dairy (WYD)</span>
              </div>
              <div className="milma-legend-val">
                {formatIN(wydCol)} L ({wydPct}%)
              </div>
            </div>

            <div className="milma-legend-row">
              <div className="milma-legend-label">
                <span className="milma-color-dot milma-dot-mdy" />
                <span>Manathavady (MDY)</span>
              </div>
              <div className="milma-legend-val">
                {formatIN(mdyCol)} L ({mdyPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Milk details */}
        <div className="milma-card milma-detail-card">
          <h2 className="milma-card-title">Milk details</h2>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Production</span>
            <div className="milma-metric-huge">
              {formatIN(milkProd)}{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Sale</span>
            <div className="milma-metric-huge">
              {formatIN(milkSale)}{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-bottom">
            <div className="milma-balance-item">
              <span className="milma-balance-lbl">Opening</span>
              <span className={`milma-balance-num ${Number(milkGroup.totalOB) < 0 ? 'milma-val-negative' : ''}`}>
                {formatIN(milkGroup.totalOB)}
              </span>
            </div>
            <div className="milma-balance-item text-end">
              <span className="milma-balance-lbl">Closing</span>
              <span className={`milma-balance-num ${Number(milkGroup.totalCB) < 0 ? 'milma-val-negative' : ''}`}>
                {formatIN(milkGroup.totalCB)}
              </span>
            </div>
          </div>

          {Number(milkGroup.totalCB) < 0 && (
            <div className="milma-badge-negative mt-2">Negative stock</div>
          )}
        </div>

        {/* Card 3: Curd details */}
        <div className="milma-card milma-detail-card">
          <h2 className="milma-card-title">Curd details</h2>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Production</span>
            <div className="milma-metric-huge">
              {formatIN(curdProd)}{' '}
              <span className="milma-metric-unit">L/Kg</span>
            </div>
          </div>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Sale</span>
            <div className="milma-metric-huge">
              {formatIN(curdSale)}{' '}
              <span className="milma-metric-unit">L/Kg</span>
            </div>
          </div>

          <div className="milma-detail-bottom">
            <div className="milma-balance-item">
              <span className="milma-balance-lbl">Opening</span>
              <span className={`milma-balance-num ${Number(curdGroup.totalOB) < 0 ? 'milma-val-negative' : ''}`}>
                {formatIN(curdGroup.totalOB)}
              </span>
            </div>
            <div className="milma-balance-item text-end">
              <span className="milma-balance-lbl">Closing</span>
              <span className={`milma-balance-num ${Number(curdGroup.totalCB) < 0 ? 'milma-val-negative' : ''}`}>
                {formatIN(curdGroup.totalCB)}
              </span>
            </div>
          </div>

          {Number(curdGroup.totalCB) < 0 && (
            <div className="milma-badge-negative mt-2">Negative stock</div>
          )}
        </div>

        {/* Card 4: Ghee details */}
        <div className="milma-card milma-detail-card">
          <h2 className="milma-card-title">Ghee details</h2>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Production</span>
            <div className="milma-metric-huge">
              {formatIN(gheeProd)}{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Sale</span>
            <div className="milma-metric-huge">
              {formatIN(gheeSale)}{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-bottom">
            <div className="milma-balance-item">
              <span className="milma-balance-lbl">Opening</span>
              <span className={`milma-balance-num ${Number(gheeGroup.totalOB) < 0 ? 'milma-val-negative' : ''}`}>
                {formatIN(gheeGroup.totalOB)}
              </span>
            </div>
            <div className="milma-balance-item text-end">
              <span className="milma-balance-lbl">Closing</span>
              <span className={`milma-balance-num ${Number(gheeGroup.totalCB) < 0 ? 'milma-val-negative' : ''}`}>
                {formatIN(gheeGroup.totalCB)}
              </span>
            </div>
          </div>

          {Number(gheeGroup.totalCB) < 0 && (
            <div className="milma-badge-negative mt-2">Negative stock</div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 3: Product-wise Breakdown (Full-Width Table)          */}
      {/* ========================================================= */}
      <div className="milma-card milma-card-table">
        <h2 className="milma-card-title">Product-wise breakdown</h2>

        <div className="milma-table-container">
          <table className="milma-products-table">
            <thead>
              <tr>
                <th className="milma-th-left">Product (Kg)</th>
                <th className="milma-th-right">Opening</th>
                <th className="milma-th-right">Production</th>
                <th className="milma-th-right">Sale</th>
                <th className="milma-th-right">Closing</th>
                <th className="milma-th-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {productsList.map((item) => {
                const ob = Number(item.group?.totalOB || 0);
                const prod = Number(item.group?.totalNetProd || 0);
                const sale = Number(item.group?.totalInvQty || 0);
                const cb = Number(item.group?.totalCB || 0);
                const isNoActivity = ob === 0 && prod === 0 && sale === 0 && cb === 0;

                return (
                  <tr key={item.name}>
                    <td className="milma-td-name">{item.name}</td>
                    <td className={`milma-td-num ${ob < 0 ? 'milma-val-negative' : ''}`}>
                      {formatIN(ob, 1)}
                    </td>
                    <td className="milma-td-num">{formatIN(prod, 1)}</td>
                    <td className="milma-td-num">{formatIN(sale, 1)}</td>
                    <td className={`milma-td-num ${cb < 0 ? 'milma-val-negative' : ''}`}>
                      {formatIN(cb, 1)}
                    </td>
                    <td className="milma-td-right">
                      {cb < 0 ? (
                        <span className="milma-badge-negative">Negative stock</span>
                      ) : (cb === 0 || isNoActivity) ? (
                        <span className="milma-badge-noactivity">No activity</span>
                      ) : (
                        <span className="milma-badge-instock">In stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
