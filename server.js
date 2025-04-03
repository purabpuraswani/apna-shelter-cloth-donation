
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Define Donation Schema and Model
const donationSchema = new mongoose.Schema({
  donor: { type: String, required: true },
  contact: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  items: { type: String, required: true },
  location: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'rejected'],
    default: 'pending',
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

const Donation = mongoose.model('Donation', donationSchema);

// API Routes
app.get('/api/donations', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status === 'active') {
      query = { status: { $in: ['pending', 'confirmed'] } };
    } else if (status) {
      query = { status };
    }
    
    const donations = await Donation.find(query).sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/donations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const donation = await Donation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/donations/report', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    
    // Generate CSV string
    let csv = 'ID,Donor,Contact,Date,Time,Items,Location,Status,Notes\n';
    
    donations.forEach(donation => {
      csv += `${donation._id},${donation.donor},${donation.contact},${donation.date},${donation.time},"${donation.items}","${donation.location}",${donation.status},"${donation.notes}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=donations-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
