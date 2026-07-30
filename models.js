const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: String, price: Number, category: String, desc: String,
  image: String, veg: Boolean, inStock: {type:Boolean, default:true},
  offer: Number, restaurantId: {type: String}
}, {timestamps: true});

const RestaurantOwnerSchema = new mongoose.Schema({
  restaurantId: {type: String, unique: true}, restaurantName: String,
  ownerName: String, mobile: {type: String, unique: true},
  email: {type: String, unique: true}, address: String, password: String,
  status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"},
  registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null},
  image: {type: String, default: null}, upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"},
  trial_end_date: {type: Date}, payout_due: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
});

const RiderSchema = new mongoose.Schema({
  name:String, mobile:{type:String, unique:true}, email:String, password:String,
  address:String, vehicleNo:String, aadharImg: String, dlProof: String,
  status:{type:String, default:"Pending"}, lat:Number, lng:Number, lastUpdate:Date,
  restaurantId: {type: String}, cash_balance: {type: Number, default: 0}, cashLimit: {type: Number, default: 1000}
});

const OrderSchema = new mongoose.Schema({
  trackId: String, name:String, phone:String, address:String, items:[],
  item_total: {type: Number, default: 0}, commission_10: {type: Number, default: 0},
  platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 40},
  grand_total: {type: Number, default: 0}, total:Number, paymentMode:String,
  cashCollected: {type: Number, default: 0}, status:{type:String, default:'Pending'},
  riderLat:Number, riderLng:Number, shopLat: {type:Number, default: 25.5941},
  shopLng: {type:Number, default: 85.1376}, custLat: Number, custLng: Number,
  riderId: String, riderName: String, restaurantId: {type: String}
}, {timestamps: true});

module.exports = {
  MenuItem: mongoose.model('MenuItem', MenuItemSchema),
  RestaurantOwner: mongoose.model('RestaurantOwner', RestaurantOwnerSchema),
  Rider: mongoose.model('Rider', RiderSchema),
  Order: mongoose.model('Order', OrderSchema)
};