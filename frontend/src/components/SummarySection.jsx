import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

// Format numbers according to Indian numbering system (e.g. 2,20,000 or -1,82,64,683)
// For cards: maxDecimals = 0 (no decimals)
// For table: maxDecimals = 1 (1 decimal)
export const formatIN = (val, maxDecimals = 0) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: maxDecimals > 0 ? maxDecimals : 0,
    maximumFractionDigits: maxDecimals
  });
  return isNegative ? `-${formatted}` : formatted;
};

// Animated Number Component (Counts up from 0 to value in ~1 second with ease-out)
const AnimatedNumber = ({ value, maxDecimals = 0, duration = 1000 }) => {
  const targetVal = Number(value) || 0;
  const [currentVal, setCurrentVal] = useState(0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrentVal(targetVal);
      return;
    }

    let startTimestamp = null;
    let animId;
    const startVal = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = startVal + (targetVal - startVal) * ease;
      setCurrentVal(val);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCurrentVal(targetVal);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetVal, duration]);

  return <>{formatIN(currentVal, maxDecimals)}</>;
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
  const milkClosingStock = Number(data?.milkClosingStock || 0);

  const outsidePurchases = Array.isArray(colDetails.outsidePurchases) && colDetails.outsidePurchases.length > 0
    ? colDetails.outsidePurchases.filter(p => (Number(p.quantity) || 0) > 0 || (p.sourceUnit && p.sourceUnit.trim() !== ''))
    : (data?.purchase?.quantity > 0 ? [{ sourceUnit: data.purchase.unitName || 'Outside Unit', quantity: data.purchase.quantity }] : []);

  const stockOuts = Array.isArray(colDetails.stockOuts)
    ? colDetails.stockOuts.filter(s => (Number(s.quantity) || 0) > 0 || (s.destinationUnit && s.destinationUnit.trim() !== ''))
    : [];

  const totalOutsidePurchase = outsidePurchases.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalStockOut = stockOuts.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Total milk collected = WYD + MDY ONLY
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

  // Empty-state card
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

  // Row 2 Progress bar calculation: WYD vs MDY ONLY
  const wydMdyTotal = wydCol + mdyCol;
  const wydPct = wydMdyTotal > 0 ? Math.round((wydCol / wydMdyTotal) * 100) : 0;
  const mdyPct = wydMdyTotal > 0 ? (100 - wydPct) : 0;

  // Products List for bottom table
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
        {/* Card 1: Total milk collected (Royal-Blue Gradient with light sweep) */}
        <div className="milma-kpi-card milma-kpi-blue milma-stagger-1">
          <div className="milma-kpi-title">Total milk collected</div>
          <div className="milma-kpi-value">
            <AnimatedNumber value={totalCollected} />{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-kpi-subtext">
            Wayanad Dairy + Manathavady
          </div>
        </div>

        {/* Card 2: Outside purchase */}
        <div className="milma-kpi-card milma-stagger-2">
          <div className="milma-kpi-title">Outside purchase</div>
          <div className="milma-kpi-value milma-val-neutral">
            <AnimatedNumber value={totalOutsidePurchase} />{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-card-list">
            {outsidePurchases.length > 0 ? (
              outsidePurchases.map((p, idx) => (
                <div key={idx} className="milma-card-list-row">
                  <span className="milma-list-label">{p.sourceUnit || 'Outside Supplier'}</span>
                  <span className="milma-list-val">
                    <AnimatedNumber value={p.quantity} /> L
                  </span>
                </div>
              ))
            ) : (
              <div className="milma-card-list-empty">No outside purchases</div>
            )}
          </div>
        </div>

        {/* Card 3: Milk Closing Stock (Ltr) (SALE value: gold) */}
        <div className="milma-kpi-card milma-stagger-3">
          <div className="milma-kpi-title">Milk Closing Stock (Ltr)</div>
          <div className="milma-kpi-value milma-val-sale">
            <AnimatedNumber value={milkClosingStock} />{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-kpi-subtext">Today's OB</div>
        </div>

        {/* Card 4: Stock out (transfers) */}
        <div className="milma-kpi-card milma-stagger-4">
          <div className="milma-kpi-title">Stock out (transfers)</div>
          <div className="milma-kpi-value milma-val-neutral">
            <AnimatedNumber value={totalStockOut} />{' '}
            <span className="milma-kpi-unit">L</span>
          </div>
          <div className="milma-card-list">
            {stockOuts.length > 0 ? (
              stockOuts.map((s, idx) => (
                <div key={idx} className="milma-card-list-row">
                  <span className="milma-list-label">{s.destinationUnit || 'Unit not specified'}</span>
                  <span className="milma-list-val">
                    <AnimatedNumber value={s.quantity} /> L
                  </span>
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
        {/* Card 1: Where the milk came from (Clean horizontal bar layout) */}
        <div className="milma-card milma-stagger-5 milma-milk-source-card">
          <h2 className="milma-card-title">Where the milk came from</h2>

          <div className="milma-source-total-wrap">
            <span className="milma-source-total-num">
              <AnimatedNumber value={wydMdyTotal} />
            </span>
            <span className="milma-source-total-tag">L TOTAL</span>
          </div>

          <div className="milma-source-bar-track">
            <div
              className="milma-source-bar-fill milma-source-bar-wyd"
              style={{ width: `${wydPct}%` }}
              title={`Wayanad Dairy (WYD): ${wydPct}%`}
            />
            <div
              className="milma-source-bar-fill milma-source-bar-mdy"
              style={{ width: `${mdyPct}%` }}
              title={`Manathavady (MDY): ${mdyPct}%`}
            />
          </div>

          <div className="milma-source-rows">
            <div className="milma-source-row">
              <div className="milma-source-label">
                <span className="milma-pie-sq milma-sq-wyd" />
                <span>Wayanad Dairy (WYD)</span>
              </div>
              <div className="milma-source-val-wrap">
                <div className="milma-source-qty">
                  <AnimatedNumber value={wydCol} /> L
                </div>
                <div className="milma-source-pct">{wydPct}%</div>
              </div>
            </div>

            <div className="milma-source-row">
              <div className="milma-source-label">
                <span className="milma-pie-sq milma-sq-mdy" />
                <span>Manathavady (MDY)</span>
              </div>
              <div className="milma-source-val-wrap">
                <div className="milma-source-qty">
                  <AnimatedNumber value={mdyCol} /> L
                </div>
                <div className="milma-source-pct">{mdyPct}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Milk details */}
        <div className="milma-card milma-detail-card milma-stagger-6">
          <h2 className="milma-card-title milma-title-underline milma-title-underline-milk">Milk details</h2>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Production</span>
            <div className="milma-metric-huge milma-val-prod">
              <AnimatedNumber value={milkProd} />{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Sale</span>
            <div className="milma-metric-huge milma-val-sale">
              <AnimatedNumber value={milkSale} />{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-bottom">
            <div className="milma-balance-item">
              <span className="milma-balance-lbl">Opening</span>
              <span className={`milma-balance-num ${Number(milkGroup.totalOB) < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                <AnimatedNumber value={milkGroup.totalOB} />
              </span>
            </div>
            <div className="milma-balance-item text-end">
              <span className="milma-balance-lbl">Closing</span>
              <span className={`milma-balance-num ${Number(milkGroup.totalCB) < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                <AnimatedNumber value={milkGroup.totalCB} />
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Curd details */}
        <div className="milma-card milma-detail-card milma-stagger-7">
          <h2 className="milma-card-title milma-title-underline milma-title-underline-curd">Curd details</h2>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Production</span>
            <div className="milma-metric-huge milma-val-prod">
              <AnimatedNumber value={curdProd} />{' '}
              <span className="milma-metric-unit">L/Kg</span>
            </div>
          </div>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Sale</span>
            <div className="milma-metric-huge milma-val-sale">
              <AnimatedNumber value={curdSale} />{' '}
              <span className="milma-metric-unit">L/Kg</span>
            </div>
          </div>

          <div className="milma-detail-bottom">
            <div className="milma-balance-item">
              <span className="milma-balance-lbl">Opening</span>
              <span className={`milma-balance-num ${Number(curdGroup.totalOB) < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                <AnimatedNumber value={curdGroup.totalOB} />
              </span>
            </div>
            <div className="milma-balance-item text-end">
              <span className="milma-balance-lbl">Closing</span>
              <span className={`milma-balance-num ${Number(curdGroup.totalCB) < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                <AnimatedNumber value={curdGroup.totalCB} />
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Ghee details */}
        <div className="milma-card milma-detail-card milma-stagger-8">
          <h2 className="milma-card-title milma-title-underline milma-title-underline-ghee">Ghee details</h2>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Production</span>
            <div className="milma-metric-huge milma-val-prod">
              <AnimatedNumber value={gheeProd} />{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-metric">
            <span className="milma-detail-metric-label">Sale</span>
            <div className="milma-metric-huge milma-val-sale">
              <AnimatedNumber value={gheeSale} />{' '}
              <span className="milma-metric-unit">L</span>
            </div>
          </div>

          <div className="milma-detail-bottom">
            <div className="milma-balance-item">
              <span className="milma-balance-lbl">Opening</span>
              <span className={`milma-balance-num ${Number(gheeGroup.totalOB) < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                <AnimatedNumber value={gheeGroup.totalOB} />
              </span>
            </div>
            <div className="milma-balance-item text-end">
              <span className="milma-balance-lbl">Closing</span>
              <span className={`milma-balance-num ${Number(gheeGroup.totalCB) < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                <AnimatedNumber value={gheeGroup.totalCB} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 3: Product-wise Breakdown (Full-Width Table)          */}
      {/* ========================================================= */}
      <div className="milma-card milma-card-table milma-stagger-9">
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
              {productsList.map((item, idx) => {
                const ob = Number(item.group?.totalOB || 0);
                const prod = Number(item.group?.totalNetProd || 0);
                const sale = Number(item.group?.totalInvQty || 0);
                const cb = Number(item.group?.totalCB || 0);
                const isNoActivity = ob === 0 && prod === 0 && sale === 0 && cb === 0;

                return (
                  <tr
                    key={item.name}
                    className="milma-table-row-fade"
                    style={{ animationDelay: `${0.55 + idx * 0.06}s` }}
                  >
                    <td className="milma-td-name">{item.name}</td>
                    <td className={`milma-td-num ${ob < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                      <AnimatedNumber value={ob} maxDecimals={1} />
                    </td>
                    <td className="milma-td-num milma-val-prod">
                      <AnimatedNumber value={prod} maxDecimals={1} />
                    </td>
                    <td className="milma-td-num milma-val-sale">
                      <AnimatedNumber value={sale} maxDecimals={1} />
                    </td>
                    <td className={`milma-td-num ${cb < 0 ? 'milma-val-negative' : 'milma-val-neutral'}`}>
                      <AnimatedNumber value={cb} maxDecimals={1} />
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
