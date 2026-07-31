const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  address: String,
  items: Array,
  total: Number,
  payment: { type: String, default: 'COD' },
  status: { type: String, default: 'Pending' },
  restaurantShare: Number, // 90%
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
