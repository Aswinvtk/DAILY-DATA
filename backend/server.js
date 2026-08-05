import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createRequire } from 'module';
import connectDB from './db.js';
import DailyOperations, { AlertItem } from './model.js';
import { parseMrcmpuPdf } from './pdfParser.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// Connect to MongoDB
connectDB();

// Exact WYD (Wayanad Dairy) report figures matching official MRCMPU PDF report format
const getExactWYDData = (dateStr) => {
  return {
    date: dateStr,
    status: 'Submitted',
    collectionData: {
      wyd: 182292
    },
    milkReceived: {
      dairy: 124146,
      mvd: 59291,
      total: 183437,
      unit: 'WYD'
    },
    milkSale: {
      total: 126633,
      categories: [
        { name: 'HTM 515', value: 109192 },
        { name: 'HTM 490/500', value: 5164 },
        { name: 'HTM 200', value: 0 },
        { name: 'Toned Milk', value: 0 },
        { name: 'Super Rich/STD', value: 9487 },
        { name: 'Milma Smart', value: 243 },
        { name: 'Cow Milk', value: 501 },
        { name: 'UHT', value: 829 },
        { name: 'HTM 450/HTM 1 Ltr', value: 1217 },
        { name: 'Full Cream Milk', value: 0 }
      ]
    },
    curdSale: {
      total: 15759,
      categories: [
        { name: 'Curd 5Kg', value: 15 },
        { name: 'Special Curd 450g', value: 216 },
        { name: 'Kattimoru', value: 1037 },
        { name: 'Kattithairu 400g', value: 0 },
        { name: 'Set Curd 200g', value: 2 },
        { name: 'TM Curd / Set Curd 400g', value: 5 },
        { name: 'Kantharimoru', value: 0 },
        { name: 'Curd 525g', value: 14450 },
        { name: 'DTM Curd 500g / Set Curd 1Kg', value: 12 },
        { name: 'Probiotic Set Curd', value: 22 }
      ]
    },
    purchase: {
      unitName: '',
      quantity: 0
    },
    milkClosingStock: 136150,
    products: [
      {
        productName: 'CREAM',
        totalStock: 4300,
        variants: []
      },
      {
        productName: 'SMP',
        totalStock: 12038,
        variants: []
      },
      {
        productName: 'BUTTER',
        totalStock: 4184,
        variants: [
          { name: '100 g', value: 7487 },
          { name: '200 g', value: 3062 },
          { name: '500 g', value: 1203 },
          { name: 'Bulk', value: 23 },
          { name: 'Cooking Butter Bulk', value: 2200 }
        ]
      },
      {
        productName: 'PANEER',
        totalStock: 240,
        variants: [
          { name: '500 g', value: 52 },
          { name: '1 Kg', value: 214 },
          { name: 'Bulk', value: 0 }
        ]
      },
      {
        productName: 'GHEE',
        totalStock: 48474,
        variants: [
          { name: '100 ml', value: 35585 },
          { name: '200 ml', value: 43137 },
          { name: '500 ml', value: 30542 },
          { name: '1 L', value: 5142 },
          { name: '2 L', value: 71 },
          { name: '5 L', value: 141 },
          { name: '15 Kg', value: 35 },
          { name: 'Bulk', value: 16768 },
          { name: '50ml PP Jar', value: 21587 }
        ]
      }
    ],
    pdfName: `Daily_Report_${dateStr.replace(/-/g, '_')}.pdf`,
    uploadedBy: 'Admin',
    uploadedAt: new Date(),
    createdBy: 'Admin',
    createdDate: new Date(),
    numberOfUpdates: 0,
    alerts: [
      'All Operations Normal',
      'No Purchase Today',
      'Butter Stock is Normal',
      'Auto Refresh : Every 30 Seconds'
    ]
  };
};

// Plain empty structure for dates with no entered data (No dummy numbers)
const createEmptyData = (dateStr) => {
  return {
    date: dateStr,
    status: 'No Data',
    collectionData: { wyd: 0 },
    milkReceived: { dairy: 0, mvd: 0, total: 0, unit: 'WYD' },
    milkSale: {
      total: 0,
      categories: [
        { name: 'HTM 515', value: 0 },
        { name: 'HTM 490/500', value: 0 },
        { name: 'HTM 200', value: 0 },
        { name: 'Toned Milk', value: 0 },
        { name: 'Super Rich/STD', value: 0 },
        { name: 'Milma Smart', value: 0 },
        { name: 'Cow Milk', value: 0 },
        { name: 'UHT', value: 0 },
        { name: 'HTM 450/HTM 1 Ltr', value: 0 },
        { name: 'Full Cream Milk', value: 0 }
      ]
    },
    curdSale: {
      total: 0,
      categories: [
        { name: 'Curd 5Kg', value: 0 },
        { name: 'Special Curd 450g', value: 0 },
        { name: 'Kattimoru', value: 0 },
        { name: 'Kattithairu 400g', value: 0 },
        { name: 'Set Curd 200g', value: 0 },
        { name: 'TM Curd / Set Curd 400g', value: 0 },
        { name: 'Kantharimoru', value: 0 },
        { name: 'Curd 525g', value: 0 },
        { name: 'DTM Curd 500g / Set Curd 1Kg', value: 0 },
        { name: 'Probiotic Set Curd', value: 0 }
      ]
    },
    purchase: { unitName: '', quantity: 0 },
    milkClosingStock: 0,
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
    pdfName: '',
    uploadedBy: '',
    createdBy: '',
    numberOfUpdates: 0,
    alerts: ['No report submitted for selected date']
  };
};

// Seed initial spec date data on start
const seedInitialData = async () => {
  try {
    const specDate = '2026-04-28';
    const existing = await DailyOperations.findOne({ date: specDate });
    if (!existing) {
      console.log(`Seeding initial MRCMPU PDF spec data for ${specDate}...`);
      const specData = getExactWYDData(specDate);
      await DailyOperations.create(specData);
      console.log('Seeding completed successfully.');
    }
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
};
seedInitialData();

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
      if (dateStr === '2026-04-28') {
        data = getExactWYDData(dateStr);
      } else {
        data = createEmptyData(dateStr);
      }
    }

    const responseData = data.toObject ? data.toObject() : { ...data };
    responseData.yesterdayClosingStock = await getYesterdayClosingStock(dateStr, responseData.milkClosingStock || 0);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PDF Upload & Dynamic OCR Parsing for MRCMPU Daily Report (WYD Column)
app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    let extractedDate = req.body.date || new Date().toISOString().split('T')[0];
    let extractedData;
    let extractedFields = [];

    try {
      const parsed = await parseMrcmpuPdf(file.buffer, req.body.date);
      extractedDate = parsed.extractedDate || extractedDate;
      extractedData = parsed.data;
      extractedFields = extractedData.extractedFields || [];
      console.log(`PDF parsed successfully. Auto-extracted: [${extractedFields.join(', ')}]`);
    } catch (e) {
      console.error('PDF parsing error, returning empty template:', e.message);
      extractedData = createEmptyData(extractedDate);
    }

    extractedData.pdfName = file.originalname;
    extractedData.uploadedAt = new Date();
    extractedData.uploadedBy = 'Admin';

    res.json({
      success: true,
      extractedDate,
      extractedFields,  // Tell frontend which fields were auto-extracted
      data: extractedData
    });
  } catch (err) {
    console.error('PDF parsing error:', err);
    res.status(500).json({ error: 'Failed to parse PDF document' });
  }
});

// Save or Update data (used by Data Entry Panel)
app.post('/api/operations', async (req, res) => {
  try {
    const { date, status, pdfName } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required for saving data' });
    }

    const payload = req.body;

    // Recompute totals for safety
    if (payload.milkSale && payload.milkSale.categories) {
      payload.milkSale.total = payload.milkSale.categories.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    }
    if (payload.curdSale && payload.curdSale.categories) {
      payload.curdSale.total = payload.curdSale.categories.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
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

      if (pdfName) {
        payload.pdfName = pdfName;
        payload.uploadedBy = 'Admin';
        payload.uploadedAt = new Date();
      } else {
        payload.pdfName = existing.pdfName;
        payload.uploadedBy = existing.uploadedBy;
        payload.uploadedAt = existing.uploadedAt;
      }

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

      if (pdfName) {
        payload.pdfName = pdfName;
        payload.uploadedBy = 'Admin';
        payload.uploadedAt = new Date();
      }
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
