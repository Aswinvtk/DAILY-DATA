import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import DailyOperations from './model.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Helper to generate realistic data for a date based on mockup/specification values
const generateMockData = (dateStr) => {
  const isSpecDate = dateStr === '2026-04-28';
  const multiplier = isSpecDate ? 1 : (0.9 + Math.random() * 0.2); // +/- 10% variation for non-spec dates

  const round = (val) => Math.round(val);

  // Raw mock values matching version 2 specifications
  const rawData = {
    date: dateStr,
    status: 'Submitted',
    collectionData: {
      wyd: round(125050 * multiplier),
      mvd: round(61456 * multiplier)
    },
    milkReceived: {
      total: round(187291 * multiplier),
      unit: 'WYD'
    },
    milkSale: {
      total: 0, // Calculated below
      categories: [
        { name: 'HTM 525', value: round(35000 * multiplier) },
        { name: 'HTM 500', value: round(40000 * multiplier) },
        { name: 'HTM 200', value: round(15000 * multiplier) },
        { name: 'Toned Milk', value: round(20000 * multiplier) },
        { name: 'Super Rich', value: round(12000 * multiplier) },
        { name: 'Cow Milk', value: round(10000 * multiplier) },
        { name: 'UHT', value: round(6885 * multiplier) }
      ]
    },
    curdSale: {
      total: 0, // Calculated below
      categories: [
        { name: 'Cup Curd', value: round(10250 * multiplier) },
        { name: 'Set Curd', value: round(5000 * multiplier) },
        { name: 'Kattimoru', value: round(3175 * multiplier) },
        { name: 'Special Curd', value: round(2500 * multiplier) },
        { name: 'Others', value: round(1445 * multiplier) }
      ]
    },
    purchase: {
      unitName: isSpecDate || Math.random() > 0.3 ? 'MANDYA' : '',
      quantity: isSpecDate ? 15320 : (Math.random() > 0.3 ? round(12000 + Math.random() * 5000) : 0)
    },
    milkClosingStock: round(259893 * multiplier),
    products: [
      {
        productName: 'CREAM',
        totalStock: round(9000 * multiplier),
        variants: [] // Single value product stock, variants empty
      },
      {
        productName: 'SMP',
        totalStock: round(4237 * multiplier),
        variants: [] // Single value product stock, variants empty
      },
      {
        productName: 'BUTTER',
        totalStock: 0, // Computed below
        variants: [
          { name: '100 g', value: round(1200 * multiplier) },
          { name: '200 g', value: round(1000 * multiplier) },
          { name: '500 g', value: round(700 * multiplier) },
          { name: 'Bulk', value: round(350 * multiplier) }
        ]
      },
      {
        productName: 'PANEER',
        totalStock: 0, // Computed below
        variants: [
          { name: '500 g', value: round(600 * multiplier) },
          { name: '1 Kg', value: round(500 * multiplier) },
          { name: 'Bulk', value: round(700 * multiplier) }
        ]
      },
      {
        productName: 'GHEE',
        totalStock: 0, // Computed below
        variants: [
          { name: '100 ml', value: round(400 * multiplier) },
          { name: '200 ml', value: round(500 * multiplier) },
          { name: '500 ml', value: round(350 * multiplier) },
          { name: '1 L', value: round(300 * multiplier) },
          { name: '5 L', value: round(200 * multiplier) },
          { name: '15 Kg', value: round(400 * multiplier) }
        ]
      }
    ],
    pdfName: isSpecDate ? 'Daily_Report_28_04_2026.pdf' : `Daily_Report_${dateStr.replace(/-/g, '_')}.pdf`,
    uploadedBy: 'Admin',
    uploadedAt: new Date(),
    createdBy: 'Admin',
    createdDate: new Date(),
    numberOfUpdates: 0
  };

  // Compute totals
  rawData.milkSale.total = rawData.milkSale.categories.reduce((sum, cat) => sum + cat.value, 0);
  rawData.curdSale.total = rawData.curdSale.categories.reduce((sum, cat) => sum + cat.value, 0);
  
  rawData.products.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.totalStock = p.variants.reduce((sum, v) => sum + v.value, 0);
    }
  });

  // Dynamic alerts
  rawData.alerts = [
    'All Operations Normal',
    rawData.purchase.quantity > 0 
      ? `Purchase Today: ${rawData.purchase.quantity.toLocaleString()} Kg from ${rawData.purchase.unitName}` 
      : 'No Purchase Today',
    'Butter Stock is Normal',
    'Auto Refresh : Every 30 Seconds'
  ];

  return rawData;
};

// Seed initial spec date data on start
const seedInitialData = async () => {
  try {
    const specDate = '2026-04-28';
    // Clean up old model shape to avoid mismatch errors
    await DailyOperations.deleteOne({ date: specDate });
    
    console.log(`Seeding initial spec data for ${specDate}...`);
    const specData = generateMockData(specDate);
    // Overwrite some values specifically for spec
    specData.curdSale.total = 22370;
    specData.curdSale.categories = [
      { name: 'Cup Curd', value: 10250 },
      { name: 'Set Curd', value: 5000 },
      { name: 'Kattimoru', value: 3175 },
      { name: 'Special Curd', value: 2500 },
      { name: 'Others', value: 1445 }
    ];
    
    await DailyOperations.create(specData);
    console.log('Seeding completed.');
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
};
seedInitialData();

// Get operations data for a specific date
app.get('/api/operations', async (req, res) => {
  try {
    const dateStr = req.query.date; // Expecting YYYY-MM-DD
    if (!dateStr) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    let data = await DailyOperations.findOne({ date: dateStr });
    if (!data) {
      // Return generated mockup template but status = Draft (so users can fill it)
      const mock = generateMockData(dateStr);
      mock.status = 'Draft';
      mock.pdfName = '';
      mock.numberOfUpdates = 0;
      data = mock; // Don't auto-save to DB yet as Draft unless submitted/saved manually
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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

    // Determine alerts
    payload.alerts = [
      'All Operations Normal',
      payload.purchase && payload.purchase.quantity > 0 
        ? `Purchase Today: ${Number(payload.purchase.quantity).toLocaleString()} Kg from ${payload.purchase.unitName}` 
        : 'No Purchase Today',
      'Butter Stock is Normal',
      'Auto Refresh : Every 30 Seconds'
    ];

    // Find if record exists
    const existing = await DailyOperations.findOne({ date });
    
    if (existing) {
      // Re-upload or manual updates
      payload.numberOfUpdates = (existing.numberOfUpdates || 0) + 1;
      payload.createdBy = existing.createdBy || 'Admin';
      payload.createdDate = existing.createdDate || existing.createdAt;
      payload.updatedBy = 'Admin';
      payload.updatedDate = new Date();
      
      // If PDF is newly uploaded or changed, update metadata
      if (pdfName) {
        payload.pdfName = pdfName;
        payload.uploadedBy = 'Admin';
        payload.uploadedAt = new Date();
      } else {
        payload.pdfName = existing.pdfName;
        payload.uploadedBy = existing.uploadedBy;
        payload.uploadedAt = existing.uploadedAt;
      }
      
      // Update status: if it was draft and user clicks submit, change to Submitted.
      // If it was already submitted and user edits, change to Updated.
      if (status === 'Submitted') {
        payload.status = existing.status === 'Draft' ? 'Submitted' : 'Updated';
      } else {
        payload.status = status; // Keep 'Draft' if saved as draft
      }
    } else {
      // Create new record
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
    res.json(updatedData);
  } catch (error) {
    console.error('Error saving operations data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
