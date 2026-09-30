import mongoose from 'mongoose';

const CategoryValueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true, default: 0 }
});

const VariantValueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true, default: 0 }
});

const ProductStockSchema = new mongoose.Schema({
  productName: { type: String, required: true }, // CREAM, SMP, BUTTER, PANEER, GHEE
  totalStock: { type: Number, required: true, default: 0 },
  variants: [VariantValueSchema] // Used for Butter, Paneer, Ghee
});

const DailyOperationsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  status: { type: String, enum: ['Draft', 'Submitted', 'Updated'], default: 'Submitted' },
  collectionData: {
    wyd: { type: Number, required: true, default: 0 },
    mvd: { type: Number, required: true, default: 0 }
  },
  milkReceived: {
    dairy: { type: Number, default: 0 },
    mvd: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'WYD' }
  },
  milkSale: {
    total: { type: Number, required: true, default: 0 },
    categories: [CategoryValueSchema] // HTM 515, HTM 490/500, HTM 200, Toned Milk, Super Rich/STD, Milma Smart, Cow Milk, UHT, HTM 450/HTM 1 Ltr, Full Cream Milk
  },
  curdSale: {
    total: { type: Number, required: true, default: 0 },
    categories: [CategoryValueSchema] // Curd 5Kg, Special Curd 450g, Kattimoru, Kattithairu 400g, Set Curd 200g, TM Curd / Set Curd 400g, Kantharimoru, Curd 525g, DTM Curd 500g / Set Curd 1Kg, Probiotic Set Curd
  },
  purchase: {
    unitName: { type: String, default: '' },
    quantity: { type: Number, default: 0 }
  },
  milkClosingStock: { type: Number, default: 0 },

  // Net Sales extracted from Excel
  gheeNetSale:     { type: Number, default: 0 },
  pedaNetSale:     { type: Number, default: 0 },
  paladaNetSale:   { type: Number, default: 0 },
  sambaramNetSale: { type: Number, default: 0 },
  butterNetSale:   { type: Number, default: 0 },
  uhtMilkNetSale:  { type: Number, default: 0 },

  // Manual Milk Collection (all optional — user can leave blank)
  totalCollection:   { type: Number, default: 0 },
  receivedAtDockWyd: { type: Number, default: 0 },
  receivedAtDockMdy: { type: Number, default: 0 },
  products: [ProductStockSchema], // CREAM & SMP will have single "Total" variant or empty variants list, others will have variants
  
  // Alerts & Updates
  alerts: [{ type: String }],

  // New MBS Product Report Consolidated Dashboard Groups & Manual Milk Collection
  milkCollectionDetails: {
    wyd: { type: Number, default: 0 },
    mdy: { type: Number, default: 0 },
    outsidePurchases: [{
      sourceUnit: { type: String, default: '' },
      quantity: { type: Number, default: 0 }
    }],
    stockOuts: [{
      destinationUnit: { type: String, default: '' },
      quantity: { type: Number, default: 0 }
    }],
    totalCollection: { type: Number, default: 0 }
  },

  // Calculated Product Groups from MBS Excel
  mbsProductGroups: {
    milk: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'L' },
      products: [{
        code: Number,
        name: String,
        packSize: Number,
        obPack: Number,
        obConverted: Number,
        prodNetPack: Number,
        prodNetConverted: Number,
        invQtyPack: Number,
        invQtyConverted: Number,
        cbPack: Number,
        cbConverted: Number
      }]
    },
    curd: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' },
      products: [{
        code: Number,
        name: String,
        packSize: Number,
        obPack: Number,
        obConverted: Number,
        prodNetPack: Number,
        prodNetConverted: Number,
        invQtyPack: Number,
        invQtyConverted: Number,
        cbPack: Number,
        cbConverted: Number
      }]
    },
    ghee: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'L' },
      products: [{
        code: Number,
        name: String,
        packSize: Number,
        obPack: Number,
        obConverted: Number,
        prodNetPack: Number,
        prodNetConverted: Number,
        invQtyPack: Number,
        invQtyConverted: Number,
        cbPack: Number,
        cbConverted: Number
      }]
    },
    butter: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' }
    },
    paneer: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' }
    },
    peda: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' }
    },
    palada: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' }
    },
    gheeBiscuit: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' }
    },
    condensedMilk: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' }
    },
    other: {
      totalOB: { type: Number, default: 0 },
      totalNetProd: { type: Number, default: 0 },
      totalInvQty: { type: Number, default: 0 },
      totalCB: { type: Number, default: 0 },
      unit: { type: String, default: 'Kg' }
    }
  },

  // Source File Information (Excel)
  excelFileName: { type: String, default: '' },
  uploadedBy: { type: String, default: 'Admin' },
  uploadedAt: { type: Date },

  // Audit Information
  createdBy: { type: String, default: 'Admin' },
  createdDate: { type: Date, default: Date.now },
  updatedBy: { type: String, default: '' },
  updatedDate: { type: Date },
  numberOfUpdates: { type: Number, default: 0 }
}, {
  timestamps: true
});

const AlertSchema = new mongoose.Schema({
  text: { type: String, required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const AlertItem = mongoose.model('AlertItem', AlertSchema);
const DailyOperations = mongoose.model('DailyOperations', DailyOperationsSchema);
export default DailyOperations;
