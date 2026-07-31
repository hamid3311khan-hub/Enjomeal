const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// Place Order
router.post('/place', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get All Orders - Admin
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
