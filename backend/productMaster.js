import mongoose from 'mongoose';

const ProductMasterSchema = new mongoose.Schema({
  productCode: { type: Number, required: true, unique: true, index: true },
  productName: { type: String, required: true },
  subgrpCode: { type: Number, required: true, default: 1 },
  subgrpName: { type: String, required: true, default: 'Milk Packets' },
  maingrpCode: { type: Number, required: true, default: 1 },
  maingrpName: { type: String, required: true, default: 'Milk Packets' },
  shortName: { type: String, default: '' },
  groupUnit: { type: String, required: true, default: 'ltr' },
  groupNos: { type: Number, required: true, default: 1 },
  groupValue: { type: Number, required: true, default: 1.0 },
  group: { 
    type: String, 
    required: true, 
    default: 'Milk' 
  },
  unit: { type: String, required: true, default: 'L' },
  packSizeMultiplier: { type: Number, required: true, default: 1.0 }
}, { timestamps: true });

export const ProductMaster = mongoose.model('ProductMaster', ProductMasterSchema);

/**
 * Helper to calculate converted Group Value (SKU) based on specific rules:
 * Rule 3: Ghee (Subgroup 5): sku = sku * 0.9 (for all codes except code 18)
 * Rule 4: Curd (Subgroup 2): sku = sku * 1.03 (for liters conversion)
 */
export function calculateSkuGroupValue({ subgrpCode, subgrpName, productCode, baseValue, groupUnit }) {
  const codeNum = Number(productCode);
  const val = Number(baseValue) || 0;
  const subCode = Number(subgrpCode);
  const subName = (subgrpName || '').toLowerCase();
  const unit = (groupUnit || '').toLowerCase();

  // Rule 3: Ghee liter to kg conversion (sku = sku * 0.9) for all code except code 18
  if (subCode === 5 || subName.includes('ghee')) {
    if (codeNum === 18) {
      return val; // Code 18 is 15kg tin, no 0.9 multiplier
    }
    return Number((val * 0.9).toFixed(4));
  }

  // Rule 4: Curd conversion (sku = sku * 1.03) for liquid curd/moru or liter units
  if (subCode === 2 || subName.includes('curd')) {
    if (unit === 'ltr' || unit === 'l' || subName.includes('moru') || subName.includes('curd')) {
      return Number((val * 1.03).toFixed(4));
    }
    return val;
  }

  return val;
}

export const DEFAULT_PRODUCT_MAPPINGS = [
  // 1. Milk Packets (Subgrp Code: 1, Subgrp Name: Milk Packets, Maingrp Code: 1, Maingrp Name: Milk Packets)
  { productCode: 45, productName: 'Coolbar Milk 1/2 Ltr', subgrpCode: 1, subgrpName: 'Milk Packets', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'FZRMILK', groupUnit: 'ltr', groupNos: 1, groupValue: 0.5, group: 'Milk', unit: 'L', packSizeMultiplier: 0.5 },
  { productCode: 53, productName: 'Std Homogenized Milk - 5 Ltr', subgrpCode: 1, subgrpName: 'Milk Packets', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'STDH5L', groupUnit: 'ltr', groupNos: 1, groupValue: 5, group: 'Milk', unit: 'L', packSizeMultiplier: 5 },
  { productCode: 54, productName: 'Std Homogenized Milk 1 Ltr', subgrpCode: 1, subgrpName: 'Milk Packets', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'STDH1L', groupUnit: 'ltr', groupNos: 1, groupValue: 1, group: 'Milk', unit: 'L', packSizeMultiplier: 1 },
  { productCode: 64, productName: 'Homogenized Tonned Milk 1 Ltr', subgrpCode: 1, subgrpName: 'Milk Packets', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'HM1LTR', groupUnit: 'ltr', groupNos: 1, groupValue: 1, group: 'Milk', unit: 'L', packSizeMultiplier: 1 },
  { productCode: 68, productName: 'Milma Cow Milk 500ml', subgrpCode: 1, subgrpName: 'Milk Packets', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'CWM500', groupUnit: 'ltr', groupNos: 1, groupValue: 0.5, group: 'Milk', unit: 'L', packSizeMultiplier: 0.5 },
  { productCode: 81, productName: 'Homogenised Toned Milk - 515 Ml (Prime)', subgrpCode: 1, subgrpName: 'Milk Packets', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'HM515', groupUnit: 'ltr', groupNos: 1, groupValue: 0.515, group: 'Milk', unit: 'L', packSizeMultiplier: 0.515 },

  // 2. Curd (Subgrp Code: 2, Subgrp Name: Curd, Maingrp Code: 1, Maingrp Name: Milk Packets) - Curd Rule: sku = sku * 1.03 for liquid curd/moru
  { productCode: 50, productName: 'Skimmed Milk Curd 5kg', subgrpCode: 2, subgrpName: 'Curd', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'SMC5KG', groupUnit: 'kgs', groupNos: 1, groupValue: 5, group: 'Curd', unit: 'Kg', packSizeMultiplier: 5 },
  { productCode: 67, productName: 'Milma Katti Moru 1 Ltr', subgrpCode: 2, subgrpName: 'Curd', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'KM1LTR', groupUnit: 'kgs', groupNos: 1, groupValue: 1.03, group: 'Curd', unit: 'Kg', packSizeMultiplier: 1.03 },
  { productCode: 90, productName: 'Skimmed Milk Curd 525g', subgrpCode: 2, subgrpName: 'Curd', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'SC525', groupUnit: 'kgs', groupNos: 1, groupValue: 0.525, group: 'Curd', unit: 'Kg', packSizeMultiplier: 0.525 },
  { productCode: 1474, productName: 'Kattimoru 450 Ml Pet', subgrpCode: 2, subgrpName: 'Curd', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'KM450', groupUnit: 'kgs', groupNos: 1, groupValue: 0.4635, group: 'Curd', unit: 'Kg', packSizeMultiplier: 0.4635 },
  { productCode: 1503, productName: 'Kantharimoru 700 Ml Pet', subgrpCode: 2, subgrpName: 'Curd', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: '700ML', groupUnit: 'kgs', groupNos: 1, groupValue: 0.721, group: 'Curd', unit: 'Kg', packSizeMultiplier: 0.721 },
  { productCode: 1530, productName: 'Curd Special (Toned Milk) (Elite) - 450 G', subgrpCode: 2, subgrpName: 'Curd', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'CST450', groupUnit: 'kgs', groupNos: 22, groupValue: 0.45, group: 'Curd', unit: 'Kg', packSizeMultiplier: 0.45 },

  // 3. Sambaram (Subgrp Code: 3, Subgrp Name: Sambaram, Maingrp Code: 1, Maingrp Name: Milk Packets)
  { productCode: 39, productName: 'Butter Milk 180ml', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BM180', groupUnit: 'ltr', groupNos: 1, groupValue: 0.18, group: 'Curd', unit: 'L', packSizeMultiplier: 0.18 },
  { productCode: 49, productName: 'Butter Milk 175 Ml - Sambharam', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BM175', groupUnit: 'ltr', groupNos: 1, groupValue: 0.175, group: 'Curd', unit: 'L', packSizeMultiplier: 0.175 },
  { productCode: 71, productName: 'Butter Milk 250ml-Nellikka', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BM250N', groupUnit: 'ltr', groupNos: 1, groupValue: 0.25, group: 'Curd', unit: 'L', packSizeMultiplier: 0.25 },
  { productCode: 87, productName: 'Ayur Butter Milk 200 Ml', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'A200', groupUnit: 'ltr', groupNos: 1, groupValue: 0.2, group: 'Curd', unit: 'L', packSizeMultiplier: 0.2 },
  { productCode: 96, productName: 'Butter Milk 200 Ml', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BM200N', groupUnit: 'ltr', groupNos: 1, groupValue: 0.2, group: 'Curd', unit: 'L', packSizeMultiplier: 0.2 },
  { productCode: 97, productName: 'Butter Milk 175 Ml Cup', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BC175', groupUnit: 'ltr', groupNos: 1, groupValue: 0.175, group: 'Curd', unit: 'L', packSizeMultiplier: 0.175 },
  { productCode: 268, productName: 'Butter Milk 250ml', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BM250', groupUnit: 'ltr', groupNos: 1, groupValue: 0.25, group: 'Curd', unit: 'L', packSizeMultiplier: 0.25 },
  { productCode: 373, productName: 'Butter Milk 200ml -Cup', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BM200', groupUnit: 'ltr', groupNos: 1, groupValue: 0.2, group: 'Curd', unit: 'L', packSizeMultiplier: 0.2 },
  { productCode: 439, productName: 'Butter Milk 180ml Cup', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BMCUP', groupUnit: 'ltr', groupNos: 1, groupValue: 0.18, group: 'Curd', unit: 'L', packSizeMultiplier: 0.18 },
  { productCode: 5117, productName: 'Buttermilk Bulk', subgrpCode: 3, subgrpName: 'Sambaram', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'BTMBLK', groupUnit: 'ltr', groupNos: 1, groupValue: 1, group: 'Curd', unit: 'L', packSizeMultiplier: 1 },

  // 4. Lassi (Subgrp Code: 51, Subgrp Name: Lassi, Maingrp Code: 1, Maingrp Name: Milk Packets)
  { productCode: 85, productName: 'Lassi 180ml Pet Bottle', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'L180P', groupUnit: 'ltr', groupNos: 1, groupValue: 0.18, group: 'Curd', unit: 'L', packSizeMultiplier: 0.18 },
  { productCode: 345, productName: 'Milma Lassi 200ml', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'LASSI200', groupUnit: 'ltr', groupNos: 1, groupValue: 0.2, group: 'Curd', unit: 'L', packSizeMultiplier: 0.2 },
  { productCode: 390, productName: 'Lassi 180ml', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'LASSI180', groupUnit: 'ltr', groupNos: 1, groupValue: 0.18, group: 'Curd', unit: 'L', packSizeMultiplier: 0.18 },
  { productCode: 429, productName: 'Sweet Lassi 180ml', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'SL180', groupUnit: 'ltr', groupNos: 1, groupValue: 0.18, group: 'Curd', unit: 'L', packSizeMultiplier: 0.18 },
  { productCode: 440, productName: 'Mango Lassi 170ml', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'ML170', groupUnit: 'ltr', groupNos: 1, groupValue: 0.17, group: 'Curd', unit: 'L', packSizeMultiplier: 0.17 },
  { productCode: 441, productName: 'Sweet Lassi 170ml', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'SW170', groupUnit: 'ltr', groupNos: 1, groupValue: 0.17, group: 'Curd', unit: 'L', packSizeMultiplier: 0.17 },
  { productCode: 1342, productName: 'Mango Lassi 175 Ml', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'ML175', groupUnit: 'ltr', groupNos: 1, groupValue: 0.175, group: 'Curd', unit: 'L', packSizeMultiplier: 0.175 },
  { productCode: 1372, productName: 'Mango Lassi 160 Ml (Sachet)', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'ML160', groupUnit: 'ltr', groupNos: 1, groupValue: 0.16, group: 'Curd', unit: 'L', packSizeMultiplier: 0.16 },
  { productCode: 1526, productName: 'Mango Lassi 150 Ml (Sachet)', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'ML150', groupUnit: 'ltr', groupNos: 1, groupValue: 0.15, group: 'Curd', unit: 'L', packSizeMultiplier: 0.15 },
  { productCode: 5114, productName: 'Lassi Bulk', subgrpCode: 51, subgrpName: 'Lassi', maingrpCode: 1, maingrpName: 'Milk Packets', shortName: 'LSBLK', groupUnit: 'ltr', groupNos: 1, groupValue: 1, group: 'Curd', unit: 'L', packSizeMultiplier: 1 },

  // 5. Peda (Subgrp Code: 4, Subgrp Name: Peda, Maingrp Code: 2, Maingrp Name: Products)
  { productCode: 1362, productName: 'Peda 700g Bulk', subgrpCode: 4, subgrpName: 'Peda', maingrpCode: 2, maingrpName: 'Products', shortName: 'PB700', groupUnit: 'kgs', groupNos: 1, groupValue: 0.7, group: 'Peda', unit: 'Kg', packSizeMultiplier: 0.7 },
  { productCode: 1363, productName: 'Peda 140g Family', subgrpCode: 4, subgrpName: 'Peda', maingrpCode: 2, maingrpName: 'Products', shortName: 'PF140', groupUnit: 'kgs', groupNos: 1, groupValue: 0.14, group: 'Peda', unit: 'Kg', packSizeMultiplier: 0.14 },
  { productCode: 1407, productName: 'Mili Peda 100 G', subgrpCode: 4, subgrpName: 'Peda', maingrpCode: 2, maingrpName: 'Products', shortName: 'MP100', groupUnit: 'kgs', groupNos: 1, groupValue: 0.1, group: 'Peda', unit: 'Kg', packSizeMultiplier: 0.1 },

  // 6. Ghee (Subgrp Code: 5, Subgrp Name: Ghee, Maingrp Code: 2, Maingrp Name: Products) - Ghee Rule: sku = sku * 0.9 for all EXCEPT code 18
  { productCode: 9, productName: 'Ghee 100ml Botls', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G100BOT', groupUnit: 'kgs', groupNos: 1, groupValue: 0.09, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.09 },
  { productCode: 10, productName: 'Ghee 500ml Pet', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G500PET', groupUnit: 'kgs', groupNos: 1, groupValue: 0.45, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.45 },
  { productCode: 11, productName: 'Ghee 200ml Pet', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G200PET', groupUnit: 'kgs', groupNos: 1, groupValue: 0.18, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.18 },
  { productCode: 18, productName: 'Ghee 15kg Tin', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'GH15KG', groupUnit: 'kgs', groupNos: 1, groupValue: 15.0, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 15.0 }, // WITHOUT 0.9 MULTIPLIER
  { productCode: 199, productName: 'Ghee 1 Ltr Pet', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G1PJAR', groupUnit: 'kgs', groupNos: 1, groupValue: 0.9, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.9 },
  { productCode: 202, productName: 'Biriyani Ghee-Export-500ml', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'BG50E', groupUnit: 'kgs', groupNos: 1, groupValue: 0.45, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.45 },
  { productCode: 203, productName: 'Biriyani Ghee-Export-200ml', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'BG20E', groupUnit: 'kgs', groupNos: 1, groupValue: 0.18, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.18 },
  { productCode: 394, productName: 'Ghee 100ml Export', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G100E', groupUnit: 'kgs', groupNos: 1, groupValue: 0.09, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.09 },
  { productCode: 395, productName: 'Ghee 200ml Export', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G200E', groupUnit: 'kgs', groupNos: 1, groupValue: 0.18, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.18 },
  { productCode: 396, productName: 'Ghee 500ml Export', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G500E', groupUnit: 'kgs', groupNos: 1, groupValue: 0.45, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.45 },
  { productCode: 397, productName: 'Ghee 1 Ltr Export', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G1LEX', groupUnit: 'kgs', groupNos: 1, groupValue: 0.9, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.9 },
  { productCode: 1310, productName: 'Ghee 5ltr Jar', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'GH5JR', groupUnit: 'kgs', groupNos: 1, groupValue: 4.5, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 4.5 },
  { productCode: 1314, productName: 'Ghee 50ml Pp Special', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'GH50PPJN', groupUnit: 'kgs', groupNos: 1, groupValue: 0.0455, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.0455 },
  { productCode: 1349, productName: 'Ghee 2 Ltr Jar', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'GH2JR', groupUnit: 'kgs', groupNos: 1, groupValue: 1.8, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 1.8 },
  { productCode: 1514, productName: 'Samrudhi Ghee - 1 Ltr', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'SG1L', groupUnit: 'kgs', groupNos: 1, groupValue: 0.9, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.9 },
  { productCode: 1515, productName: 'Samrudhi Ghee - 500 Ml', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'SG500', groupUnit: 'kgs', groupNos: 1, groupValue: 0.45, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.45 },
  { productCode: 1517, productName: 'Ghee 2 Litre Tin- Export', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'G2LEX', groupUnit: 'kgs', groupNos: 1, groupValue: 2.0, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 2.0 },
  { productCode: 1531, productName: 'Samrudhi Ghee - 1 Ltr (Export)', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'SG1EX', groupUnit: 'kgs', groupNos: 1, groupValue: 1.0, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 1.0 },
  { productCode: 1532, productName: 'Samrudhi Ghee - 500 Ml (Export)', subgrpCode: 5, subgrpName: 'Ghee', maingrpCode: 2, maingrpName: 'Products', shortName: 'SG500EX', groupUnit: 'kgs', groupNos: 1, groupValue: 0.5, group: 'Ghee', unit: 'Kg', packSizeMultiplier: 0.5 },

  // 7. Butter (Subgrp Code: 6, Subgrp Name: Butter, Maingrp Code: 2, Maingrp Name: Products)
  { productCode: 230, productName: 'Desi Cooking Butter 100 G(Carton)', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'CBTR100', groupUnit: 'kgs', groupNos: 1, groupValue: 0.1, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.1 },
  { productCode: 232, productName: 'Desi Cooking Butter 500gm(Carton)', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'CBTR500', groupUnit: 'kgs', groupNos: 1, groupValue: 0.5, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.5 },
  { productCode: 358, productName: 'Butter Bulk 20kg', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'BTR20', groupUnit: 'kgs', groupNos: 1, groupValue: 20, group: 'Butter', unit: 'Kg', packSizeMultiplier: 20 },
  { productCode: 360, productName: 'Desi Cooking Butter 400gm(Tub)', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'BTR400', groupUnit: 'kgs', groupNos: 1, groupValue: 0.4, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.4 },
  { productCode: 361, productName: 'Desi Cooking Butter 100gm(Tub)', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'BTR100', groupUnit: 'kgs', groupNos: 1, groupValue: 0.1, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.1 },
  { productCode: 391, productName: 'Desi Cooking Butter 200g(Tub)', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'BTR200', groupUnit: 'kgs', groupNos: 1, groupValue: 0.2, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.2 },
  { productCode: 392, productName: 'Desi Cooking Butter 50g(Tub)', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'BTR50', groupUnit: 'kgs', groupNos: 1, groupValue: 0.05, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.05 },
  { productCode: 406, productName: 'Table Butter 100gm Salted', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'TBBTR', groupUnit: 'kgs', groupNos: 1, groupValue: 0.1, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.1 },
  { productCode: 407, productName: 'Table Butter 200gm Salted(Carton)', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'TB200G', groupUnit: 'kgs', groupNos: 1, groupValue: 0.2, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.2 },
  { productCode: 1488, productName: 'Table Butter 500gm Salted', subgrpCode: 6, subgrpName: 'Butter', maingrpCode: 2, maingrpName: 'Products', shortName: 'TB500S', groupUnit: 'kgs', groupNos: 1, groupValue: 0.5, group: 'Butter', unit: 'Kg', packSizeMultiplier: 0.5 },

  // 8. Palada (Subgrp Code: 7, Subgrp Name: Palada, Maingrp Code: 2, Maingrp Name: Products)
  { productCode: 16, productName: 'Palada Mix 200gm', subgrpCode: 7, subgrpName: 'Palada', maingrpCode: 2, maingrpName: 'Products', shortName: 'PALADA', groupUnit: 'kgs', groupNos: 1, groupValue: 0.2, group: 'Palada', unit: 'Kg', packSizeMultiplier: 0.2 },
  { productCode: 398, productName: 'Palada Mix 200 G Export', subgrpCode: 7, subgrpName: 'Palada', maingrpCode: 2, maingrpName: 'Products', shortName: 'PALDA', groupUnit: 'kgs', groupNos: 1, groupValue: 0.2, group: 'Palada', unit: 'Kg', packSizeMultiplier: 0.2 },

  // 9. Paneer (Subgrp Code: 33, Subgrp Name: Paneer, Maingrp Code: 2, Maingrp Name: Products)
  { productCode: 249, productName: 'Paneer 500gm', subgrpCode: 33, subgrpName: 'Paneer', maingrpCode: 2, maingrpName: 'Products', shortName: 'PA500', groupUnit: 'kgs', groupNos: 1, groupValue: 0.5, group: 'Paneer', unit: 'Kg', packSizeMultiplier: 0.5 },
  { productCode: 250, productName: 'Paneer 1kg', subgrpCode: 33, subgrpName: 'Paneer', maingrpCode: 2, maingrpName: 'Products', shortName: 'PAN1000', groupUnit: 'kgs', groupNos: 1, groupValue: 1, group: 'Paneer', unit: 'Kg', packSizeMultiplier: 1 },
  { productCode: 383, productName: 'Paneer 200gm - Sliced', subgrpCode: 33, subgrpName: 'Paneer', maingrpCode: 2, maingrpName: 'Products', shortName: 'PANEER', groupUnit: 'kgs', groupNos: 1, groupValue: 0.2, group: 'Paneer', unit: 'Kg', packSizeMultiplier: 0.2 },
  { productCode: 1511, productName: 'Sliced Paneer Export - 200 G', subgrpCode: 33, subgrpName: 'Paneer', maingrpCode: 2, maingrpName: 'Products', shortName: 'PA20E', groupUnit: 'kgs', groupNos: 1, groupValue: 0.2, group: 'Paneer', unit: 'Kg', packSizeMultiplier: 0.2 },
  { productCode: 1512, productName: 'Sliced Paneer Export - 400 G', subgrpCode: 33, subgrpName: 'Paneer', maingrpCode: 2, maingrpName: 'Products', shortName: 'PA40E', groupUnit: 'kgs', groupNos: 1, groupValue: 0.4, group: 'Paneer', unit: 'Kg', packSizeMultiplier: 0.4 },
  { productCode: 1513, productName: 'Paneer Export - 1 Kg', subgrpCode: 33, subgrpName: 'Paneer', maingrpCode: 2, maingrpName: 'Products', shortName: 'PA1E', groupUnit: 'kgs', groupNos: 1, groupValue: 1, group: 'Paneer', unit: 'Kg', packSizeMultiplier: 1 },

  // 10. Burfi (Subgrp Code: 38, Subgrp Name: Burfi, Maingrp Code: 2, Maingrp Name: Products)
  { productCode: 317, productName: 'Coconut Burfi 150gm', subgrpCode: 38, subgrpName: 'Burfi', maingrpCode: 2, maingrpName: 'Products', shortName: 'CB150', groupUnit: 'kgs', groupNos: 1, groupValue: 0.15, group: 'Other', unit: 'Kg', packSizeMultiplier: 0.15 },
  { productCode: 5026, productName: 'Coconut Burfi Bulk', subgrpCode: 38, subgrpName: 'Burfi', maingrpCode: 2, maingrpName: 'Products', shortName: 'COBURBLK', groupUnit: 'kgs', groupNos: 1, groupValue: 1, group: 'Other', unit: 'Kg', packSizeMultiplier: 1 },

  // 11. Biscuits (Subgrp Code: 55, Subgrp Name: Biscuits, Maingrp Code: 2, Maingrp Name: Products)
  { productCode: 462, productName: 'Ghee Biscuit 144g', subgrpCode: 55, subgrpName: 'Biscuits', maingrpCode: 2, maingrpName: 'Products', shortName: 'GB144', groupUnit: 'kgs', groupNos: 1, groupValue: 0.144, group: 'Ghee Biscuit', unit: 'Kg', packSizeMultiplier: 0.144 },
  { productCode: 1479, productName: 'Ghee Biscuit 180g (Tub)', subgrpCode: 55, subgrpName: 'Biscuits', maingrpCode: 2, maingrpName: 'Products', shortName: 'GB180', groupUnit: 'kgs', groupNos: 1, groupValue: 0.18, group: 'Ghee Biscuit', unit: 'Kg', packSizeMultiplier: 0.18 }
];

export async function seedProductMaster() {
  try {
    const count = await ProductMaster.countDocuments();
    if (count === 0) {
      await ProductMaster.insertMany(DEFAULT_PRODUCT_MAPPINGS);
      console.log(`[ProductMaster] Successfully seeded ${DEFAULT_PRODUCT_MAPPINGS.length} default product code mappings.`);
    } else {
      // Ensure all documents have subgroup fields updated
      const first = await ProductMaster.findOne().lean();
      if (!first || first.subgrpCode === undefined || first.groupValue === undefined) {
        await ProductMaster.deleteMany({});
        await ProductMaster.insertMany(DEFAULT_PRODUCT_MAPPINGS);
        console.log(`[ProductMaster] Re-seeded product master with updated subgroup mappings.`);
      }
    }
  } catch (err) {
    console.error('[ProductMaster] Error seeding product master:', err.message);
  }
}

export async function getProductMasterMap() {
  const buildDefaultMap = () => {
    const map = new Map();
    for (const item of DEFAULT_PRODUCT_MAPPINGS) {
      map.set(Number(item.productCode), item);
    }
    return map;
  };

  if (mongoose.connection.readyState !== 1) {
    return buildDefaultMap();
  }

  try {
    let items = await ProductMaster.find().lean();
    if (!items || items.length === 0) {
      await seedProductMaster();
      items = await ProductMaster.find().lean();
    }
    const map = new Map();
    for (const item of items) {
      map.set(Number(item.productCode), item);
    }
    return map;
  } catch (err) {
    console.error('[ProductMaster] Error getting product master map:', err.message);
    return buildDefaultMap();
  }
}
