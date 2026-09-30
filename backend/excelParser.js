import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

/**
 * MBS Product Report Parser
 *
 * Identifies products primarily by Product Code.
 * Applies SKU Pack Size Multiplier to convert packet/unit counts into actual volume (L) or weight (Kg).
 * Consolidates converted quantities into 10 Dashboard Product Groups:
 *   - Milk (codes: 45, 54, 53, 64, 81)
 *   - Curd (codes: 90, 1530, 50, 67, 1474, 39, 1526)
 *   - Ghee (codes: 9, 10, 11, 18, 199, 202, 203, 1344, 1310, 1314, 394, 395, 396, 397, 1514, 1515)
 *   - Butter (codes: 230, 232, 361, 358, 391, 392, 406, 407, 1488, 360)
 *   - Paneer (codes: 383, 249, 250, 1511, 1512)
 *   - Peda (codes: 1363, 1362, 1407)
 *   - Palada (codes: 16, 398)
 *   - Ghee Biscuit (codes: 462, 1479)
 *   - Condensed Milk (code: 5107)
 *   - Other (codes: 317, 314, 1339 and extensible)
 */

function parseNum(val) {
  if (val === null || val === undefined || val === '') return 0;
  const num = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

export function parseMBSReport(buffer, productMasterMap) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });

  // Default structure for output
  const createGroupObj = (unit = 'Kg') => ({
    totalOB: 0,
    totalNetProd: 0,
    totalInvQty: 0,
    totalCB: 0,
    unit,
    products: []
  });

  const productGroups = {
    milk: createGroupObj('L'),
    curd: createGroupObj('L'),
    ghee: createGroupObj('L'),
    butter: createGroupObj('Kg'),
    paneer: createGroupObj('Kg'),
    peda: createGroupObj('Kg'),
    palada: createGroupObj('Kg'),
    gheeBiscuit: createGroupObj('Kg'),
    condensedMilk: createGroupObj('Kg'),
    other: createGroupObj('Kg')
  };

  if (!rawRows || rawRows.length < 5) {
    return { productGroups, unmappedProducts: [] };
  }

  // Find header row (usually contains 'Code', 'Product', 'OB', 'Net', 'Invoiced Qty', 'CB')
  let codeColIdx = 1;
  let nameColIdx = 2;
  let obColIdx = 3;
  let prodNetColIdx = 6;
  let invQtyColIdx = 10;
  let cbColIdx = 21;
  let headerRowIdx = -1;

  for (let i = 0; i < Math.min(15, rawRows.length); i++) {
    const row = rawRows[i];
    if (!row || !Array.isArray(row)) continue;
    let foundCode = false, foundOB = false;
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim();
      if (cell === 'code' || cell === 'product code') { codeColIdx = j; foundCode = true; }
      else if (cell === 'product' || cell === 'product name') { nameColIdx = j; }
      else if (cell === 'ob') { obColIdx = j; foundOB = true; }
      else if (cell === 'net' && j >= 4) { prodNetColIdx = j; }
      else if (cell.includes('invoiced') || cell === 'inv qty') { invQtyColIdx = j; }
      else if (cell === 'cb') { cbColIdx = j; }
    }
    if (foundCode && foundOB) {
      headerRowIdx = i;
      break;
    }
  }

  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 5;
  const unmappedProducts = [];

  for (let i = startRow; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length <= codeColIdx) continue;

    const rawCode = row[codeColIdx];
    if (rawCode === undefined || rawCode === null || rawCode === '') continue;

    const pCode = Number(rawCode);
    if (isNaN(pCode)) continue; // skip non-numeric headers or footer totals

    const pName = String(row[nameColIdx] || '').trim();
    const obPack = parseNum(row[obColIdx]);
    const prodNetPack = parseNum(row[prodNetColIdx]);
    const invQtyPack = parseNum(row[invQtyColIdx]);
    const cbPack = parseNum(row[cbColIdx]);

    // Lookup in Product Master Map
    const masterInfo = productMasterMap.get(pCode);

    if (masterInfo) {
      const multiplier = masterInfo.groupValue !== undefined && masterInfo.groupValue !== null 
        ? Number(masterInfo.groupValue) 
        : (Number(masterInfo.packSizeMultiplier) || 1.0);
      const obConverted = obPack * multiplier;
      const prodNetConverted = prodNetPack * multiplier;
      const invQtyConverted = invQtyPack * multiplier;
      const cbConverted = cbPack * multiplier;

      // Map group string or subgrpName to key in productGroups object
      let groupKey = null;
      const grp = masterInfo.group || masterInfo.subgrpName || '';
      const subCode = Number(masterInfo.subgrpCode);

      if (grp === 'Milk' || grp === 'Milk Packets' || subCode === 1) groupKey = 'milk';
      else if (grp === 'Curd' || grp === 'Sambaram' || grp === 'Lassi' || subCode === 2 || subCode === 3 || subCode === 51) groupKey = 'curd';
      else if (grp === 'Ghee' || subCode === 5) groupKey = 'ghee';
      else if (grp === 'Butter' || subCode === 6) groupKey = 'butter';
      else if (grp === 'Paneer' || subCode === 33) groupKey = 'paneer';
      else if (grp === 'Peda' || subCode === 4) groupKey = 'peda';
      else if (grp === 'Palada' || subCode === 7) groupKey = 'palada';
      else if (grp === 'Ghee Biscuit' || grp === 'Biscuits' || subCode === 55) groupKey = 'gheeBiscuit';
      else if (grp === 'Condensed Milk') groupKey = 'condensedMilk';
      else groupKey = 'other';

      const targetGroup = productGroups[groupKey];
      if (targetGroup) {
        targetGroup.totalOB += obConverted;
        targetGroup.totalNetProd += prodNetConverted;
        targetGroup.totalInvQty += invQtyConverted;
        targetGroup.totalCB += cbConverted;

        targetGroup.products.push({
          code: pCode,
          name: pName || masterInfo.productName,
          packSize: multiplier,
          obPack,
          obConverted,
          prodNetPack,
          prodNetConverted,
          invQtyPack,
          invQtyConverted,
          cbPack,
          cbConverted
        });
      }
    } else {
      unmappedProducts.push({ code: pCode, name: pName, ob: obPack, prodNet: prodNetPack, invQty: invQtyPack, cb: cbPack });
    }
  }

  // Round numbers for clean display
  for (const groupKey of Object.keys(productGroups)) {
    const g = productGroups[groupKey];
    g.totalOB = Number(g.totalOB.toFixed(2));
    g.totalNetProd = Number(g.totalNetProd.toFixed(2));
    g.totalInvQty = Number(g.totalInvQty.toFixed(2));
    g.totalCB = Number(g.totalCB.toFixed(2));
    for (const p of g.products) {
      p.obConverted = Number(p.obConverted.toFixed(2));
      p.prodNetConverted = Number(p.prodNetConverted.toFixed(2));
      p.invQtyConverted = Number(p.invQtyConverted.toFixed(2));
      p.cbConverted = Number(p.cbConverted.toFixed(2));
    }
  }

  return { productGroups, unmappedProducts };
}

/** Legacy Fallback */
export function parseWayanadExcel(buffer) {
  return {
    milkNetSale: 0, curdNetSale: 0, gheeNetSale: 0,
    pedaNetSale: 0, paladaNetSale: 0, sambaramNetSale: 0,
    butterNetSale: 0, uhtMilkNetSale: 0,
    purchaseTotal: 0, purchaseUnitName: '',
    extractedFields: []
  };
}
