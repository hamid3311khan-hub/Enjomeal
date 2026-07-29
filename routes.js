const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function sendWhatsApp(to, message) {console.log(`📲 WHATSAPP TO ${to}: ${message}`);}

function calculateBill(item_total) {
  const commission_10 = Math.round(item_total * 0.10);
  const platform_fee = 10;
  const delivery_fee = 40;
  const grand_total = item_total + commission_10 + platform_fee + delivery_fee;
  return {item_total, commission_10, platform_fee, delivery_fee, grand_total, cash_to_restaurant: item_total - commission_10};
}

// ===== MODELS =====
const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String}}, {timestamps: true}));
const RestaurantOwner = mongoose.model('RestaurantOwner', new mongoose.Schema({restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String, mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String, password: String, status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"}, registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null}, image: {type: String, default: null}, upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"}, trial_end_date: {type: Date}, payout_due: {type: Number, default: 0}, createdAt: {type: Date, default: Date.now}}));
const Rider = mongoose.model('Rider', new mongoose.Schema({name:String, mobile:{type:String, unique:true}, email:String, password:String, address:String, vehicleNo:String, aadharImg: String, dlProof: String, status:{type:String, default:"Pending"}, lat:Number, lng:Number, lastUpdate:Date, restaurantId: {type: String}, cash_balance: {type: Number, default: 0}, cashLimit: {type: Number, default: 1000}}));
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_10: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 40},grand_total: {type: Number, default: 0}, total:Number, paymentMode:String, cashCollected: {type: Number, default: 0},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number,shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, riderName: String, restaurantId: {type: String}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);

// ===== CUSTOMER + ADMIN APIs =====
router.get('/api/menu', async (req,res)=>{ const {restaurantId} = req.query; let filter = {inStock: true}; if(restaurantId) filter.restaurantId = restaurantId; res.json(await MenuItem.find(filter)) });
router.post('/api/orders', async (req,res)=>{ try{ const io = req.app.get('io'); const bill=calculateBill(req.body.item_total); const trackId = 'EB' + Date.now(); const order=new Order({...req.body, trackId, ...bill}); await order.save(); sendWhatsApp(order.phone,`Order ${order.trackId} received. Total: ₹${order.grand_total}`); io.emit('newOrder', order); res.json(order); }catch(e){res.status(500).json({error:e.message})} });
router.get('/api/orders', async (req,res)=>{ const {restaurantId, status, riderId} = req.query; let filter = {}; if(restaurantId) filter.restaurantId = restaurantId; if(status) filter.status = status; if(riderId) filter.riderId = riderId; res.json(await Order.find(filter).sort({createdAt:-1})) });

// ===== AUTH APIs =====
router.post('/api/restaurant/login', async (req,res)=>{
  try{
    const {mobile, password} = req.body;
    const restaurant = await RestaurantOwner.findOne({mobile});
    if(!restaurant) return res.status(400).json({success: false, error: "Restaurant not found"});
    if(restaurant.status !== 'Approved') return res.status(400).json({success: false, error: "Admin se approval pending hai"});
    const match = await bcrypt.compare(password, restaurant.password);
    if(!match) return res.status(400).json({success: false, error: "Invalid password"});
    res.json({success:true, restaurantId: restaurant.restaurantId, name: restaurant.restaurantName});
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
});

router.post('/api/restaurant/register', upload.single('image'), async (req,res)=>{ 
  try{ 
    const {restaurantName, ownerName, mobile, email, address, password} = req.body; 
    const exist = await RestaurantOwner.findOne({mobile});
    if(exist) return res.json({success: false, error: "Mobile pehle se registered hai"});
    const restaurantId = 'RES' + Date.now(); 
    let imageUrl = null; 
    if(req.file){ 
      const result = await new Promise((resolve) => { cloudinary.uploader.upload_stream({folder:"restaurants"}, (err, result) => resolve(result)).end(req.file.buffer); }); 
      imageUrl = result.secure_url; 
    } 
    const hashedPassword = await bcrypt.hash(password, 10); 
    const trial_end_date = new Date(); trial_end_date.setDate(trial_end_date.getDate() + 30); 
    const newRestaurant = new RestaurantOwner({ restaurantId, restaurantName, ownerName, mobile, email, address, password: hashedPassword, image: imageUrl, trial_end_date }); 
    await newRestaurant.save(); 
    res.json({success:true, message: "Register ho gaya. Approval ka wait karein"}); 
  }catch(e){ res.status(500).json({success: false, error: e.message}) } 
});

// ===== RESTAURANT DASHBOARD APIs - NAYE =====
router.post('/api/restaurant/menu', upload.single('image'), async (req,res)=>{
  try{
    const {name, price, description, category, restaurantId} = req.body;
    let imageUrl = '';
    if(req.file){
      const result = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream({folder:"menu-items"}, (err, result) => resolve(result)).end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }
    const item = new MenuItem({name, price: Number(price), desc: description, category, restaurantId, image: imageUrl, veg: category === 'Veg'});
    await item.save();
    res.json({success: true, item})
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
})

router.get('/api/restaurant/menu/:restaurantId', async (req,res)=>{
  const items = await MenuItem.find({restaurantId: req.params.restaurantId}).sort({createdAt: -1});
  res.json({success: true, items})
})

router.delete('/api/restaurant/menu/:id', async (req,res)=>{
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({success: true})
})

router.get('/api/restaurant/orders/:restaurantId', async (req,res)=>{
  const orders = await Order.find({restaurantId: req.params.restaurantId}).sort({createdAt: -1});
  res.json({success: true, orders})
})

router.get('/api/restaurant/payout/:restaurantId', async (req,res)=>{
  const restaurant = await RestaurantOwner.findOne({restaurantId: req.params.restaurantId});
  res.json({success: true, payout_due: restaurant?.payout_due || 0})
})

// ===== ADMIN APIs =====
router.get('/api/admin/pending-restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Pending"}))});
router.put('/api/admin/approve-restaurant/:id', async (req,res)=>{await RestaurantOwner.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});

// ===== PAGE ROUTES =====
router.get('/', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));
router.get('/admin', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'admin.html')));
router.get('/restaurant-dashboard', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-dashboard.html')));
router.get('/restaurant-register', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-register.html')));
router.get('/restaurant-login', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-login.html')));

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinOrderRoom', (trackId) => { socket.join(trackId); });
  });
  return router;
}