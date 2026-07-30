const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true }
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

const riderSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  vehicle: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({ 
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', default: null },
  items: { type: Array, required: true },
  item_total: { type: Number, required: true },
  commission_10: { type: Number, required: true },
  platform_fee: { type: Number, required: true },
  delivery_fee: { type: Number, required: true },
  grand_total: { type: Number, required: true },
  cash_to_restaurant: { type: Number, required: true },
  trackId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'accepted', 'preparing', 'picked', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({ 
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  inStock: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  Customer: mongoose.model('Customer', customerSchema),
  Restaurant: mongoose.model('Restaurant', restaurantSchema),
  Rider: mongoose.model('Rider', riderSchema),
  Order: mongoose.model('Order', orderSchema),
  MenuItem: mongoose.model('MenuItem', menuSchema)
};