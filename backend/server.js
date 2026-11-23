import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import connectDB from './db.js';
import DailyOperations, { AlertItem } from './model.js';
import { parseMBSReport, parseWayanadExcel } from './excelParser.js';
import { ProductMaster, getProductMasterMap, seedProductMaster, DEFAULT_PRODUCT_MAPPINGS, calculateSkuGroupValue } from './productMaster.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// Connect to MongoDB and seed Product Master
connectDB();
seedProductMaster();

// Plain empty structure returned for dates with no data in the database
const createEmptyData = (dateStr) => {
  return {
    date: dateStr,
    status: 'No Data',
    collectionData: { wyd: 0, mvd: 0 },
    milkCollectionDetails: {
      wyd: 0,
      mdy: 0,
      outsidePurchases: [],
      stockOuts: [],
      totalCollection: 0
    },
    milkReceived: { dairy: 0, mvd: 0, total: 0, unit: 'WYD' },
    milkSale: { total: 0, categories: [] },
    curdSale: { total: 0, categories: [] },
    purchase: { unitName: '', quantity: 0 },
    milkClosingStock: 0,
    gheeNetSale: 0,
    pedaNetSale: 0,
    paladaNetSale: 0,
    sambaramNetSale: 0,
    butterNetSale: 0,
    uhtMilkNetSale: 0,
    totalCollection: 0,
    receivedAtDockWyd: 0,
    receivedAtDockMdy: 0,
    products: [],
    mbsProductGroups: {
      milk: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'L', products: [] },
      curd: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'L', products: [] },
      ghee: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0, unit: 'L', products: [] },
      butter: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 },
      paneer: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 },
      peda: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 },
      palada: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 },
      gheeBiscuit: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 },
      condensedMilk: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 },
      other: { totalOB: 0, totalNetProd: 0, totalInvQty: 0, totalCB: 0 }
    },
    excelFileName: '',
    uploadedBy: '',
    createdBy: '',
    numberOfUpdates: 0,
    alerts: ['No report submitted for selected date']
  };
};

const getYesterdayClosingStock = async (dateStr) => {
  try {
    const dateObj = new Date(dateStr);
    dateObj.setDate(dateObj.getDate() - 1);
    const yesterdayDateStr = dateObj.toISOString().split('T')[0];

    const yesterdayDoc = await DailyOperations.findOne({ date: yesterdayDateStr });
    if (yesterdayDoc) {
      return yesterdayDoc.milkClosingStock || 0;
    } else {
      if (dateStr === '2026-04-28') return 250500;
      return 0;
    }
  } catch (error) {
    console.error('Error in getYesterdayClosingStock:', error);
    return 0;
  }
};

// GET operations data for a specific date
app.get('/api/operations', async (req, res) => {
  try {
    const dateStr = req.query.date; // Expecting YYYY-MM-DD
    if (!dateStr) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    let data = await DailyOperations.findOne({ date: dateStr });
    if (!data) {
      data = createEmptyData(dateStr);
    }

    const responseData = data.toObject ? data.toObject() : { ...data };
    responseData.yesterdayClosingStock = await getYesterdayClosingStock(dateStr);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// PRODUCT MASTER API ENDPOINTS
// ==========================================

// GET product master mappings
app.get('/api/product-master', async (req, res) => {
  try {
    const items = await ProductMaster.find().sort({ subgrpCode: 1, productCode: 1 });
    if (items.length === 0) {
      await seedProductMaster();
      const seeded = await ProductMaster.find().sort({ subgrpCode: 1, productCode: 1 });
      return res.json(seeded);
    }
    res.json(items);
  } catch (error) {
    console.error('Error fetching product master:', error);
    res.status(500).json({ error: 'Failed to fetch product master mappings' });
  }
});

// POST add or update product master item
app.post('/api/product-master', async (req, res) => {
  try {
    const { 
      productCode, productName, subgrpCode, subgrpName, 
      maingrpCode, maingrpName, shortName, groupUnit, groupNos, groupValue,
      group, unit, packSizeMultiplier, autoCalculateSku 
    } = req.body;

    if (!productCode || !productName) {
      return res.status(400).json({ error: 'productCode and productName are required' });
    }

    const codeNum = Number(productCode);
    const subCode = Number(subgrpCode) || 1;
    const sName = (subgrpName || 'Milk Packets').trim();
    const mainCode = Number(maingrpCode) || (subCode <= 3 || subCode === 51 ? 1 : 2);
    const mName = (maingrpName || (mainCode === 1 ? 'Milk Packets' : 'Products')).trim();
    const sShort = (shortName || '').trim();
    const gUnit = (groupUnit || 'ltr').trim().toLowerCase();
    const gNos = Number(groupNos) || 1;

    let finalGroupValue = Number(groupValue);
    if (isNaN(finalGroupValue) || autoCalculateSku) {
      finalGroupValue = calculateSkuGroupValue({
        subgrpCode: subCode,
        subgrpName: sName,
        productCode: codeNum,
        baseValue: Number(packSizeMultiplier) || Number(groupValue) || 1.0,
        groupUnit: gUnit
      });
    }

    // Determine dashboard group key
    let dashGroup = group;
    if (!dashGroup) {
      if (subCode === 1) dashGroup = 'Milk';
      else if (subCode === 2 || subCode === 3 || subCode === 51) dashGroup = 'Curd';
      else if (subCode === 5) dashGroup = 'Ghee';
      else if (subCode === 6) dashGroup = 'Butter';
      else if (subCode === 33) dashGroup = 'Paneer';
      else if (subCode === 4) dashGroup = 'Peda';
      else if (subCode === 7) dashGroup = 'Palada';
      else if (subCode === 55) dashGroup = 'Ghee Biscuit';
      else dashGroup = 'Other';
    }

    const updated = await ProductMaster.findOneAndUpdate(
      { productCode: codeNum },
      { 
        $set: { 
          productCode: codeNum, 
          productName: productName.trim(), 
          subgrpCode: subCode,
          subgrpName: sName,
          maingrpCode: mainCode,
          maingrpName: mName,
          shortName: sShort,
          groupUnit: gUnit,
          groupNos: gNos,
          groupValue: finalGroupValue,
          group: dashGroup, 
          unit: unit || (gUnit === 'kgs' ? 'Kg' : 'L'), 
          packSizeMultiplier: finalGroupValue 
        } 
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, item: updated });
  } catch (error) {
    console.error('Error saving product master item:', error);
    res.status(500).json({ error: 'Failed to save product master item' });
  }
});

// DELETE product master item
app.delete('/api/product-master/:code', async (req, res) => {
  try {
    const codeNum = Number(req.params.code);
    await ProductMaster.deleteOne({ productCode: codeNum });
    const items = await ProductMaster.find().sort({ subgrpCode: 1, productCode: 1 });
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error deleting product master item:', error);
    res.status(500).json({ error: 'Failed to delete product master item' });
  }
});

// POST reset product master to defaults
app.post('/api/product-master/reset', async (req, res) => {
  try {
    await ProductMaster.deleteMany({});
    await ProductMaster.insertMany(DEFAULT_PRODUCT_MAPPINGS);
    const items = await ProductMaster.find().sort({ subgrpCode: 1, productCode: 1 });
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error resetting product master:', error);
    res.status(500).json({ error: 'Failed to reset product master' });
  }
});

// ==========================================
// EXCEL UPLOAD & MBS REPORT PARSER API
// ==========================================
app.post('/api/parse-excel', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    const ext = (file.originalname || '').toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      return res.status(400).json({ error: 'Only .xlsx or .xls files are supported' });
    }

    console.log(`[parse-excel] Received: "${file.originalname}" (${(file.size / 1024).toFixed(1)} KB)`);
    const extractedDate = req.body.date || new Date().toISOString().split('T')[0];

    const masterMap = await getProductMasterMap();
    const { productGroups, unmappedProducts } = parseMBSReport(file.buffer, masterMap);

    const elapsed = Date.now() - startTime;
    console.log(`[parse-excel] Parsed MBS report in ${elapsed}ms`);

    // Build response data object with consolidated product groups
    const extractedData = {
      date: extractedDate,
      mbsProductGroups: productGroups,
      milkSale: { total: productGroups.milk.totalInvQty, categories: [] },
      curdSale: { total: productGroups.curd.totalInvQty, categories: [] },
      gheeNetSale: productGroups.ghee.totalInvQty,
      butterNetSale: productGroups.butter.totalInvQty,
      paneerNetSale: productGroups.paneer.totalInvQty,
      pedaNetSale: productGroups.peda.totalInvQty,
      paladaNetSale: productGroups.palada.totalInvQty,
      gheeBiscuitNetSale: productGroups.gheeBiscuit.totalInvQty,
      condensedMilkNetSale: productGroups.condensedMilk.totalInvQty,
      excelFileName: file.originalname,
      uploadedAt: new Date(),
      uploadedBy: 'Admin',
      unmappedProducts
    };

    res.json({
      success: true,
      extractedDate,
      data: extractedData
    });
  } catch (err) {
    console.error('[parse-excel] Unhandled error:', err);
    res.status(500).json({ error: 'Failed to parse Excel file' });
  }
});

// Save or Update Operations Data (Data Entry & Dashboard Updates)
app.post('/api/operations', async (req, res) => {
  try {
    const { date, status } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required for saving data' });
    }

    const payload = req.body;

    // Calculate Milk Collection total if milkCollectionDetails is passed
    if (payload.milkCollectionDetails) {
      const wyd = Number(payload.milkCollectionDetails.wyd) || 0;
      const mdy = Number(payload.milkCollectionDetails.mdy) || 0;
      const outsideSum = Array.isArray(payload.milkCollectionDetails.outsidePurchases)
        ? payload.milkCollectionDetails.outsidePurchases.reduce((s, p) => s + (Number(p.quantity) || 0), 0)
        : 0;
      const stockOutSum = Array.isArray(payload.milkCollectionDetails.stockOuts)
        ? payload.milkCollectionDetails.stockOuts.reduce((s, p) => s + (Number(p.quantity) || 0), 0)
        : 0;
      // Total collection = WYD + MDY ONLY per requirements (stock transfers never deducted)
      payload.milkCollectionDetails.totalCollection = Number((wyd + mdy).toFixed(2));
      payload.totalCollection = payload.milkCollectionDetails.totalCollection;
    }

    // Preserve custom user alerts array
    if (!payload.alerts || !Array.isArray(payload.alerts)) {
      payload.alerts = [
        'All Operations Normal',
        payload.milkCollectionDetails && payload.milkCollectionDetails.totalCollection > 0
          ? `Total Milk Collection: ${Number(payload.milkCollectionDetails.totalCollection).toLocaleString()} L`
          : 'No Milk Collection Today',
        'Butter Stock is Normal',
        'Auto Refresh : Every 30 Seconds'
      ];
    }

    const existing = await DailyOperations.findOne({ date });

    if (existing) {
      payload.numberOfUpdates = (existing.numberOfUpdates || 0) + 1;
      payload.createdBy = existing.createdBy || 'Admin';
      payload.createdDate = existing.createdDate || existing.createdAt;
      payload.updatedBy = 'Admin';
      payload.updatedDate = new Date();

      if (status === 'Submitted') {
        payload.status = existing.status === 'Draft' ? 'Submitted' : 'Updated';
      } else {
        payload.status = status;
      }
    } else {
      payload.numberOfUpdates = 0;
      payload.createdBy = 'Admin';
      payload.createdDate = new Date();
      payload.status = status || 'Submitted';
    }

    const updatedData = await DailyOperations.findOneAndUpdate(
      { date },
      { $set: payload },
      { new: true, upsert: true }
    );

    console.log(`Report updated for date ${date} with status ${updatedData.status}`);

    const responseData = updatedData.toObject();
    responseData.yesterdayClosingStock = await getYesterdayClosingStock(date);

    res.json(responseData);
  } catch (error) {
    console.error('Error saving operations data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// ALERTS & UPDATES COLLECTION API ENDPOINTS
// ==========================================
const seedDefaultAlerts = async () => {
  try {
    const count = await AlertItem.countDocuments();
    if (count === 0) {
      const defaults = [
        'All Operations Normal',
        'Purchase Today: 15,320 Kg from MANDYA',
        'Butter Stock is Normal',
        'Auto Refresh : Every 30 Seconds'
      ];
      await AlertItem.insertMany(defaults.map(text => ({ text, active: true })));
      console.log('Default alerts seeded into MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding default alerts:', err);
  }
};
seedDefaultAlerts();

app.get('/api/alerts', async (req, res) => {
  try {
    let alerts = await AlertItem.find().sort({ createdAt: 1 });
    if (alerts.length === 0) {
      await seedDefaultAlerts();
      alerts = await AlertItem.find().sort({ createdAt: 1 });
    }
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/alerts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Alert text is required' });
    }
    const newAlert = await AlertItem.create({ text: text.trim(), active: true });
    const allAlerts = await AlertItem.find().sort({ createdAt: 1 });
    res.json({ success: true, added: newAlert, alerts: allAlerts });
  } catch (error) {
    console.error('Error adding alert:', error);
    res.status(500).json({ error: 'Failed to add alert' });
  }
});

app.put('/api/alerts/sync', async (req, res) => {
  try {
    const { alerts } = req.body;
    if (Array.isArray(alerts)) {
      await AlertItem.deleteMany({});
      const newItems = alerts
        .filter(t => typeof t === 'string' ? t.trim().length > 0 : (t && t.text))
        .map(t => typeof t === 'string' ? { text: t.trim(), active: true } : { text: t.text.trim(), active: t.active !== false });
      if (newItems.length > 0) {
        await AlertItem.insertMany(newItems);
      }
    }
    const updated = await AlertItem.find().sort({ createdAt: 1 });
    res.json({ success: true, alerts: updated });
  } catch (error) {
    console.error('Error syncing alerts:', error);
    res.status(500).json({ error: 'Failed to sync alerts' });
  }
});

app.put('/api/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, active } = req.body;
    const updateData = {};
    if (text !== undefined) updateData.text = text.trim();
    if (active !== undefined) updateData.active = active;

    const updated = await AlertItem.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    const allAlerts = await AlertItem.find().sort({ createdAt: 1 });
    res.json({ success: true, updated, alerts: allAlerts });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await AlertItem.findByIdAndDelete(id);
    const allAlerts = await AlertItem.find().sort({ createdAt: 1 });
    res.json({ success: true, alerts: allAlerts });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Root & Health endpoints so visiting http://localhost:5050 shows a clear message or redirects to frontend
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Milma Daily Operations API</title></head>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; background: #0f172a; color: #f8fafc;">
        <h2>Milma Daily Operations Backend API</h2>
        <p>This port (5050) is the backend API service.</p>
        <p>To view the full interactive dashboard, open:</p>
        <a href="http://localhost:5173" style="color: #38bdf8; font-size: 1.25rem; font-weight: bold; text-decoration: underline;">👉 Open Frontend Application (http://localhost:5173)</a>
      </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (Listening on 0.0.0.0)`);
});
