const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const upload = multer({ storage: multer.memoryStorage() });
const uploadRider = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function sendWhatsApp(to, message) {console.log(`📲 WHATSAPP TO ${to}: ${message}`);}

// FIX: 10% COMMISSION + 40 DELIVERY
function calculateBill(item_total) {
  const commission_10 = Math.round(item_total * 0.10); // 10%
  const platform_fee = 10;
  const delivery_fee = 40; // 40
  const grand_total = item_total + commission_10 + platform_fee + delivery_fee;
  return {item_total, commission_10, platform_fee, delivery_fee, grand_total, cash_to_restaurant: item_total - commission_10};
}

// ===== MODELS =====
const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String, default: 'default-shop'}}, {timestamps: true}));
const RestaurantOwner = mongoose.model('RestaurantOwner', new mongoose.Schema({restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String, mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String, password: String, status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"}, registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null}, image: {type: String, default: null}, upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"}, trial_end_date: {type: Date}, payout_due: {type: Number, default: 0}, createdAt: {type: Date, default: Date.now}}));
const Rider = mongoose.model('Rider', new mongoose.Schema({name:String, mobile:{type:String, unique:true}, email:String, password:String, address:String, vehicleNo:String, aadharImg: String, dlProof: String, status:{type:String, default:"Pending"}, lat:Number, lng:Number, lastUpdate:Date, restaurantId: {type: String}, cash_balance: {type: Number, default: 0}, cashLimit: {type: Number, default: 1000}}));
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_10: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 40},grand_total: {type: Number, default: 0}, total:Number, paymentMode:String, cashCollected: {type: Number, default: 0},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number,shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, riderName: String, restaurantId: {type: String, default: 'default-shop'}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);
const Offer = mongoose.model('Offer', new mongoose.Schema({code:String, discount:Number, type:{type:String, default:"PERCENT"}, restaurantId:String, createdAt:{type:Date, default:Date.now}}));
const Banner = mongoose.model('Banner', new mongoose.Schema({text: String, image: String, color: String, updatedAt: {type: Date, default: Date.now}}));

// ===== API ROUTES - MENU =====
router.get('/api/menu', async (req,res)=>{
  const {restaurantId} = req.query;
  let filter = {inStock: true};
  if(restaurantId) filter.restaurantId = restaurantId;
  res.json(await MenuItem.find(filter))
});

router.post('/api/menu', async (req,res)=>{
  const item = new MenuItem(req.body);
  await item.save();
  res.json(item);
});

// ===== API ROUTES - ORDER =====
router.post('/api/orders', async (req,res)=>{
  try{
    const io = req.app.get('io');
    const bill=calculateBill(req.body.item_total); 
    const trackId = 'EB' + Date.now();
    const order=new Order({...req.body, trackId, ...bill}); 
    await order.save(); 
    sendWhatsApp(order.phone,`Order ${order.trackId} received. Total: ₹${order.grand_total}`); 
    
    io.emit('newOrder', order); // restaurant ko
    io.emit('assignOrder', order); // rider ko
    
    res.json(order);
  }catch(e){res.status(500).json({error:e.message})}
});

router.get('/api/orders', async (req,res)=>{
  const {restaurantId, status, riderId} = req.query; 
  let filter = {};
  if(restaurantId) filter.restaurantId = restaurantId;
  if(status) filter.status = status;
  if(riderId) filter.riderId = riderId;
  res.json(await Order.find(filter).sort({createdAt:-1}))
});

router.get('/api/orders/track/:id', async (req,res)=>{res.json(await Order.findOne({trackId:req.params.id}))});
router.put('/api/orders/:id/status', async (req,res)=>{const {status,riderId,riderName}=req.body; const update={status}; if(riderId){update.riderId=riderId; update.riderName=riderName;} await Order.findByIdAndUpdate(req.params.id,update); res.json({success:true})});
router.post('/api/order-delivered', async (req,res)=>{const {orderId}=req.body; const order=await Order.findById(orderId); if(order.paymentMode==="Cash"){await Rider.findOneAndUpdate({mobile:order.riderId},{$inc:{cash_balance:order.grand_total}});} order.status="Delivered"; await order.save(); res.json({success:true});});

// ===== API ROUTES - RIDER =====
router.post('/api/rider/accept-order', async (req,res)=>{ 
    const {orderId, riderId, riderName} = req.body;
    await Order.findByIdAndUpdate(orderId, {status:"Out for Delivery", riderId, riderName});
    res.json({success:true})
});

// ===== API ROUTES - ADMIN =====
router.get('/api/admin/pending-restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Pending"}))});
router.put('/api/admin/approve-restaurant/:id', async (req,res)=>{await RestaurantOwner.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});
router.get('/api/admin/pending-riders', async (req,res)=>{res.json(await Rider.find({status:"Pending"}))});
router.put('/api/admin/approve-rider/:id', async (req,res)=>{await Rider.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});

// FIXED: YE WALA ROUTE
router.get('/api/admin-restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Approved"}))});

// FIXED: REJECT ROUTE
router.post('/api/admin/reject-restaurant', async (req,res)=>{
  await RestaurantOwner.findByIdAndUpdate(req.body.restaurantId, {status: 'rejected'});
  res.json({msg: 'Rejected'});
});

router.post('/api/admin/pay-payout', async (req,res)=>{
  const {restaurantId, amount} = req.body;
  await RestaurantOwner.findOneAndUpdate({restaurantId}, {$inc: {payout_due: -amount}});
  res.json({success:true})
});

router.get('/api/restaurant-profile', async (req,res)=>{
  const {restaurantId} = req.query;
  res.json(await RestaurantOwner.findOne({restaurantId}))
});

router.get('/api/rider-profile', async (req,res)=>{
  const {mobile} = req.query;
  res.json(await Rider.findOne({mobile}))
});

// ===== PAGE ROUTES =====
router.get('/', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html'))); // FIXED
router.get('/admin', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'admin.html')));
router.get('/restaurant-dashboard', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-dashboard.html')));
router.get('/rider', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'rider.html')));
router.get('/track', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'track.html')));

// ===== SOCKET IO =====
module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinOrderRoom', (trackId) => {
      socket.join(trackId); 
    });

    socket.on('riderLocation', async (data) => { 
      await Rider.findOneAndUpdate({mobile: data.riderId}, {lat: data.lat, lng: data.lng, lastUpdate: new Date()});
      await Order.updateMany({riderId: data.riderId, status: "Out for Delivery"}, {riderLat: data.lat, riderLng: data.lng});
      const orders = await Order.find({riderId: data.riderId, status: "Out for Delivery"});
      orders.forEach(o => io.to(o.trackId).emit('riderLocationUpdate', {...data, trackId: o.trackId}));
    });
  });
  return router;
}