import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

/**
 * Wayanad Daily Sales Excel Parser
 *
 * Reads an .xlsx / .xls workbook uploaded by the user.
 * Scans all sheets for a column named "Net Grp Qty" (case-insensitive).
 * Maps each product row to a dashboard category by matching product name keywords.
 *
 * Returned categories (Net Grp Qty totals):
 *   milkNetSale      — Milk / Milk Packets (single line)
 *   curdNetSale      — Curd (all curd varieties)
 *   gheeNetSale      — Ghee
 *   pedaNetSale      — Peda
 *   paladaNetSale    — Palada / Palada Payasam
 *   sambaramNetSale  — Sambaram
 *   butterNetSale    — Butter
 *   uhtMilkNetSale   — UHT Milk
 *   purchaseTotal    — Purchase (if a Purchase row exists)
 */

// ─── Category keyword map ─────────────────────────────────────────────────────
const CATEGORY_MAP = [
  { key: 'uhtMilkNetSale', keywords: ['uht'] },
  { key: 'gheeNetSale', keywords: ['ghee'] },
  { key: 'pedaNetSale', keywords: ['peda'] },
  { key: 'paladaNetSale', keywords: ['palada'] },
  { key: 'sambaramNetSale', keywords: ['sambaram'] },
  { key: 'butterNetSale', keywords: ['butter'] },
  { key: 'curdNetSale', keywords: ['curd', 'katti', 'moru', 'kanthari', 'probiotic', 'thairu', 'curds'] },
  // Milk: matches any milk, HTM, Toned, Cow, Smart, Full Cream, etc.
  { key: 'milkNetSale', keywords: ['milk', 'htm', 'toned', 'std', 'smart', 'cow milk', 'full cream', 'pkt milk'] },
];

const PURCHASE_KEYWORDS = ['purchase', 'purchased'];

function classifyProduct(productName) {
  if (!productName) return null;
  const lc = String(productName).toLowerCase().trim();
  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.some(kw => lc.includes(kw))) return cat.key;
  }
  return null;
}

function isPurchaseRow(productName) {
  if (!productName) return false;
  const lc = String(productName).toLowerCase().trim();
  return PURCHASE_KEYWORDS.some(kw => lc.includes(kw));
}

function detectColumns(rows) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;
    const keys = Object.keys(row);
    let nameCol = null, qtyCol = null;
    for (const k of keys) {
      const val = String(row[k] || '').toLowerCase().trim();
      if (!nameCol && (val.includes('product') || val.includes('description') || val.includes('item') || val.includes('name') || val.includes('particulars'))) nameCol = k;
      if (!qtyCol && (val.includes('net grp qty') || val.includes('net group qty') || val.includes('netgrpqty') || val === 'net qty' || val === 'net grp' || val.includes('wayanad qty') || val.includes('wyd qty') || val === 'qty')) qtyCol = k;
    }
    if (nameCol && qtyCol) return { nameCol, qtyCol, headerRowIdx: i };
  }
  return null;
}

export function parseWayanadExcel(buffer) {
  const result = {
    milkNetSale: 0, curdNetSale: 0, gheeNetSale: 0,
    pedaNetSale: 0, paladaNetSale: 0, sambaramNetSale: 0,
    butterNetSale: 0, uhtMilkNetSale: 0,
    purchaseTotal: 0, purchaseUnitName: '',
    extractedFields: []
  };

  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    console.error('[excelParser] Failed to read workbook:', err.message);
    return result;
  }

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, blankrows: false });
    if (!rows || rows.length < 3) continue;

    const detected = detectColumns(rows);

    if (!detected) {
      // Fallback: raw array mode
      const arrRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
      if (arrRows.length < 3) continue;
      let headerIdx = -1, nameColIdx = -1, qtyColIdx = -1;
      for (let i = 0; i < Math.min(arrRows.length, 15); i++) {
        const row = arrRows[i];
        for (let j = 0; j < row.length; j++) {
          const val = String(row[j] || '').toLowerCase().trim();
          if (nameColIdx < 0 && (val.includes('product') || val.includes('description') || val.includes('particulars') || val.includes('item'))) nameColIdx = j;
          if (qtyColIdx < 0 && (val.includes('net grp qty') || val.includes('net group qty') || val.includes('netgrpqty') || val === 'net qty')) qtyColIdx = j;
        }
        if (nameColIdx >= 0 && qtyColIdx >= 0) { headerIdx = i; break; }
      }
      if (headerIdx < 0 || qtyColIdx < 0) continue;
      for (let i = headerIdx + 1; i < arrRows.length; i++) {
        const row = arrRows[i];
        if (!row || row.length === 0) continue;
        const productName = nameColIdx >= 0 ? String(row[nameColIdx] || '') : '';
        const qty = parseFloat(String(row[qtyColIdx] || '0').replace(/,/g, '')) || 0;
        if (!productName.trim() && qty === 0) continue;
        const category = classifyProduct(productName);
        if (category) { result[category] += qty; if (!result.extractedFields.includes(category)) result.extractedFields.push(category); }
        else if (isPurchaseRow(productName)) { result.purchaseTotal += qty; if (!result.extractedFields.includes('purchase')) result.extractedFields.push('purchase'); }
      }
      if (result.extractedFields.length > 0) break;
      continue;
    }

    const { nameCol, qtyCol, headerRowIdx } = detected;
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const productName = String(row[nameCol] || '');
      const qty = parseFloat(String(row[qtyCol] || '0').replace(/,/g, '')) || 0;
      if (!productName.trim() && qty === 0) continue;
      const category = classifyProduct(productName);
      if (category) { result[category] += qty; if (!result.extractedFields.includes(category)) result.extractedFields.push(category); }
      else if (isPurchaseRow(productName)) { result.purchaseTotal += qty; if (!result.extractedFields.includes('purchase')) result.extractedFields.push('purchase'); }
    }
    if (result.extractedFields.length > 0) break;
  }

  // Round all numeric values
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'number') result[key] = Math.round(result[key]);
  }

  console.log('[excelParser] Extracted fields:', result.extractedFields);
  console.log('[excelParser] Totals:', { milk: result.milkNetSale, curd: result.curdNetSale, ghee: result.gheeNetSale, peda: result.pedaNetSale, palada: result.paladaNetSale, sambaram: result.sambaramNetSale, butter: result.butterNetSale, uht: result.uhtMilkNetSale, purchase: result.purchaseTotal });

  return result;
}
