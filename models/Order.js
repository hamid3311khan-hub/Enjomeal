const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  
  items: [{
    name: String,
    price: Number,
    qty: Number,
    image: String
  }],
  
  totalAmount: Number,
  
  // === PAYMENT SECTION - COD + QR ===
  paymentMethod: { type: String, enum: ['COD', 'UPI'], default: 'COD' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paymentProof: { type: String }, // UPI screenshot ka Cloudinary URL
  
  // === ORDER STATUS ===
  status: { type: String, enum: ['pending','accepted','cooking','ready','picked','delivered','cancelled'], default: 'pending' },
  address: String,
  phone: String,
  
  // === EARNINGS SPLIT ===
  restaurantEarning: Number, // 90%
  platformFee: Number,       // 10%
  riderFee: { type: Number, default: 50 }
  
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
