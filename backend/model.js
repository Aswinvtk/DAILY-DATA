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
    total: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'WYD' }
  },
  milkSale: {
    total: { type: Number, required: true, default: 0 },
    categories: [CategoryValueSchema] // HTM 525, HTM 500, HTM 200, Toned Milk, Super Rich, Cow Milk, UHT
  },
  curdSale: {
    total: { type: Number, required: true, default: 0 },
    categories: [CategoryValueSchema] // Cup Curd, Set Curd, Kattimoru, Special Curd, Others
  },
  purchase: {
    unitName: { type: String, default: '' },
    quantity: { type: Number, default: 0 }
  },
  milkClosingStock: { type: Number, default: 0 },
  products: [ProductStockSchema], // CREAM & SMP will have single "Total" variant or empty variants list, others will have variants
  
  // Alerts & Updates
  alerts: [{ type: String }],

  // PDF Information
  pdfName: { type: String, default: '' },
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
