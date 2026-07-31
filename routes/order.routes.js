const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// File upload setup
const upload = multer({ dest: 'uploads/' });

// 1. PLACE ORDER - COD ya UPI
router.post('/place', upload.single('screenshot'), async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, address, phone } = req.body;

    let paymentProof = null;
    let paymentStatus = 'pending';

    // Agar UPI hai to screenshot upload karo
    if(paymentMethod === 'UPI' && req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      paymentProof = result.secure_url;
      paymentStatus = 'paid'; // Customer ne proof de diya
    }

    // Order save
    const order = new Order({
      items: JSON.parse(items),
      totalAmount,
      paymentMethod,
      paymentStatus,
      paymentProof,
      address,
      phone
    });

    await order.save();
    res.json({ success: true, orderId: order._id, message: "Order placed" });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ALL ORDERS - Admin ke liye
router.get('/all', async (req, res) => {
  const orders = await Order.find().sort({createdAt: -1});
  res.json(orders);
});

module.exports = router;
