const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({ 
  name: String, 
  phone: { type: String, unique: true }, // duplicate rokne ke liye
  password: String, // <-- YE ADD KIYA
  address: String 
});

const restaurantSchema = new mongoose.Schema({ 
  name: String, 
  phone: String, 
  address: String, 
  status: {type: String, default: 'pending'} 
});

const riderSchema = new mongoose.Schema({ 
  name: String, 
  phone: String, 
  vehicle: String 
});

const orderSchema = new mongoose.Schema({ 
  customerId: mongoose.Schema.Types.ObjectId, 
  restaurantId: mongoose.Schema.Types.ObjectId, 
  items: Array, 
  item_total: Number, 
  commission_10: Number, 
  platform_fee: Number, 
  delivery_fee: Number, 
  grand_total: Number, 
  cash_to_restaurant: Number, 
  trackId: String, 
  status: String 
}, {timestamps: true});

const menuItemSchema = new mongoose.Schema({ 
  restaurantId: mongoose.Schema.Types.ObjectId, 
  name: String, 
  price: Number, 
  inStock: {type: Boolean, default: true} 
});

module.exports = {
  Customer: mongoose.model('Customer', customerSchema),
  Restaurant: mongoose.model('Restaurant', restaurantSchema),
  Rider: mongoose.model('Rider', riderSchema),
  Order: mongoose.model('Order', orderSchema),
  MenuItem: mongoose.model('MenuItem', menuItemSchema)
};