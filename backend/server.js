import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import connectDB from './db.js';
import DailyOperations, { AlertItem } from './model.js';
import { parseWayanadExcel } from './excelParser.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// Connect to MongoDB
connectDB();

// Plain empty structure returned for dates with no data in the database
const createEmptyData = (dateStr) => {
  return {
    date: dateStr,
    status: 'No Data',
    collectionData: { wyd: 0 },
    milkReceived: { dairy: 0, mvd: 0, total: 0, unit: 'WYD' },
    milkSale: {
      total: 0,
      categories: []
    },
    curdSale: {
      total: 0,
      categories: []
    },
    purchase: { unitName: '', quantity: 0 },
    milkClosingStock: 0,
    // Net sales from Excel
    gheeNetSale: 0,
    pedaNetSale: 0,
    paladaNetSale: 0,
    sambaramNetSale: 0,
    butterNetSale: 0,
    uhtMilkNetSale: 0,
    // Manual milk collection (optional)
    totalCollection: 0,
    receivedAtDockWyd: 0,
    receivedAtDockMdy: 0,
    products: [
      { productName: 'CREAM', totalStock: 0, variants: [] },
      { productName: 'SMP', totalStock: 0, variants: [] },
      {
        productName: 'BUTTER',
        totalStock: 0,
        variants: [
          { name: '100 g', value: 0 },
          { name: '200 g', value: 0 },
          { name: '500 g', value: 0 },
          { name: 'Bulk', value: 0 },
          { name: 'Cooking Butter Bulk', value: 0 }
        ]
      },
      {
        productName: 'PANEER',
        totalStock: 0,
        variants: [
          { name: '500 g', value: 0 },
          { name: '1 Kg', value: 0 },
          { name: 'Bulk', value: 0 }
        ]
      },
      {
        productName: 'GHEE',
        totalStock: 0,
        variants: [
          { name: '100 ml', value: 0 },
          { name: '200 ml', value: 0 },
          { name: '500 ml', value: 0 },
          { name: '1 L', value: 0 },
          { name: '2 L', value: 0 },
          { name: '5 L', value: 0 },
          { name: '15 Kg', value: 0 },
          { name: 'Bulk', value: 0 },
          { name: '50ml PP Jar', value: 0 }
        ]
      }
    ],
    excelFileName: '',
    uploadedBy: '',
    createdBy: '',
    numberOfUpdates: 0,
    alerts: ['No report submitted for selected date']
  };
};

const getYesterdayClosingStock = async (dateStr, todayStock) => {
  try {
    const dateObj = new Date(dateStr);
    dateObj.setDate(dateObj.getDate() - 1);
    const yesterdayDateStr = dateObj.toISOString().split('T')[0];

    const yesterdayDoc = await DailyOperations.findOne({ date: yesterdayDateStr });
    if (yesterdayDoc) {
      return yesterdayDoc.milkClosingStock || 0;
    } else {
      if (dateStr === '2026-04-28') {
        return 250500;
      }
      return 0;
    }
  } catch (error) {
    console.error('Error in getYesterdayClosingStock:', error);
    return 0;
  }
};

// Get operations data for a specific date
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
    responseData.yesterdayClosingStock = await getYesterdayClosingStock(dateStr, responseData.milkClosingStock || 0);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Excel Upload & Data Extraction for Wayanad Daily Sales
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
    console.log(`[parse-excel] Date: ${req.body.date || '(none)'}`);

    const extractedDate = req.body.date || new Date().toISOString().split('T')[0];

    let parsed;
    try {
      parsed = parseWayanadExcel(file.buffer);
    } catch (e) {
      console.error('[parse-excel] Parse error:', e.message);
      parsed = { extractedFields: [] };
    }

    const elapsed = Date.now() - startTime;
    console.log(`[parse-excel] Done in ${elapsed}ms`);

    // Build response data using milkSale.total from milkNetSale, etc.
    const extractedData = {
      date: extractedDate,
      milkSale: { total: parsed.milkNetSale || 0, categories: [] },
      curdSale: { total: parsed.curdNetSale || 0, categories: [] },
      purchase: { unitName: parsed.purchaseUnitName || '', quantity: parsed.purchaseTotal || 0 },
      gheeNetSale:     parsed.gheeNetSale || 0,
      pedaNetSale:     parsed.pedaNetSale || 0,
      paladaNetSale:   parsed.paladaNetSale || 0,
      sambaramNetSale: parsed.sambaramNetSale || 0,
      butterNetSale:   parsed.butterNetSale || 0,
      uhtMilkNetSale:  parsed.uhtMilkNetSale || 0,
      excelFileName: file.originalname,
      uploadedAt: new Date(),
      uploadedBy: 'Admin',
      extractedFields: parsed.extractedFields || []
    };

    res.json({
      success: true,
      extractedDate,
      extractedFields: parsed.extractedFields || [],
      data: extractedData
    });
  } catch (err) {
    console.error('[parse-excel] Unhandled error:', err);
    res.status(500).json({ error: 'Failed to parse Excel file' });
  }
});


// Save or Update data (used by Data Entry Panel)
app.post('/api/operations', async (req, res) => {
  try {
    const { date, status } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required for saving data' });
    }

    const payload = req.body;

    // Recompute totals for safety only if categories are populated
    if (payload.milkSale && Array.isArray(payload.milkSale.categories) && payload.milkSale.categories.length > 0) {
      const catSum = payload.milkSale.categories.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
      if (catSum > 0) {
        payload.milkSale.total = catSum;
      }
    }
    if (payload.curdSale && Array.isArray(payload.curdSale.categories) && payload.curdSale.categories.length > 0) {
      const catSum = payload.curdSale.categories.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
      if (catSum > 0) {
        payload.curdSale.total = catSum;
      }
    }
    if (payload.products) {
      payload.products.forEach(p => {
        if (p.variants && p.variants.length > 0) {
          p.totalStock = p.variants.reduce((sum, v) => sum + (Number(v.value) || 0), 0);
        } else {
          p.totalStock = Number(p.totalStock) || 0;
        }
      });
    }

    // Preserve custom user alerts array (even if empty []), only set defaults if undefined/null
    if (!payload.alerts || !Array.isArray(payload.alerts)) {
      payload.alerts = [
        'All Operations Normal',
        payload.purchase && payload.purchase.quantity > 0
          ? `Purchase Today: ${Number(payload.purchase.quantity).toLocaleString()} Kg from ${payload.purchase.unitName}`
          : 'No Purchase Today',
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
    responseData.yesterdayClosingStock = await getYesterdayClosingStock(date, responseData.milkClosingStock || 0);

    res.json(responseData);
  } catch (error) {
    console.error('Error saving operations data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// ALERTS & UPDATES COLLECTION API ENDPOINTS
// ==========================================

// Helper to seed default alerts if collection is empty
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

// GET all active alerts & updates
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

// POST add a new alert
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

// PUT update full list of alerts / sync alerts
app.put('/api/alerts/sync', async (req, res) => {
  try {
    const { alerts } = req.body; // Expecting array of text strings or alert objects
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

// PUT update a specific alert by ID
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

// DELETE remove an alert by ID
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (Listening on 0.0.0.0)`);
});
