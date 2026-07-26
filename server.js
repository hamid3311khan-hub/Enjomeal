require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const PDFDocument = require('pdfkit');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: {origin: "*"} });
const PORT = process.env.PORT || 10000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });
if (!fs.existsSync('./uploads')){ fs.mkdirSync('./uploads'); }

app.use(cors({origin: "*"}));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('✅ MongoDB Connected v3.5.5 Eat4Bite'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ===== MODELS =====
const MenuItem = mongoose.model('MenuItem', {name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String, default: 'default-shop'}});

const RestaurantOwner = mongoose.model('RestaurantOwner', {
  restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String,
  mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String,
  password: String, status: {type: String, default: "Pending"}, plan: {type: String, default: "Trial"},
  registration_fee_paid: {type: Number, default: 200}, image: {type: String, default: null},
  upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"}, trial_end_date: {type: Date}, 
  plan_expiry: {type: Date}, paymentStatus: {type: String, default: "Pending"}, 
  lastPaymentDate: {type: Date, default: Date.now}, createdAt: {type: Date, default: Date.now}
});

const Rider = mongoose.model('Rider', {name:String, mobile:{type:String, unique:true}, status:{type:String, default:"Pending"}, cash_balance: {type: Number, default: 0},cashLimit: {type: Number, default: 1000}});
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: Number, commission_5: Number,platform_fee: Number, delivery_fee: Number,total:Number, paymentMode:String, status:{type:String, default:'Pending'}, riderId: String, restaurantId: String}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);

// ===== REGISTER =====
app.post('/api/restaurant/register', async (req,res)=>{
  try{
    let {restaurantName, ownerName, mobile, email, address, password, image_base64, plan} = req.body;
    let amount = plan === "Annual" ? 2000 : 200;
    let restaurantId = restaurantName.toLowerCase().replace(/ /g,'-') + '-' + Date.now();
    const exists = await RestaurantOwner.findOne({$or: [{mobile}, {email}]});
    if(exists) return res.json({success:false, msg: "Mobile/Email already exists"});
    const hashedPassword = await bcrypt.hash(password, 10);
    await new RestaurantOwner({restaurantId, restaurantName, ownerName, mobile, email, address, password: hashedPassword, image: image_base64, plan: plan, paymentStatus: "Pending", registration_fee_paid: amount}).save();
    res.json({success:true, upi_id: "tanbalkhi2014-3@okhdfcbank", amount: amount})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

// ===== LOGIN =====
app.post('/api/restaurant/login', async (req,res)=>{ 
  const {email, password} = req.body;
  const shop = await RestaurantOwner.findOne({email});
  if(!shop) return res.json({success:false, msg:"Email not registered"});
  if(shop.status !== "Approved") return res.json({success:false, msg:"Approval pending"});
  if(shop.paymentStatus !== "Paid") return res.json({success:false, msg:"Pay fee first"});
  const valid = await bcrypt.compare(password, shop.password);
  if(!valid) return res.json({success:false, msg:"Wrong password"});
  const {password: pass, ...shopData} = shop.toObject();
  res.json({success:true, shop: shopData})
});

// ===== ADMIN =====
app.get('/api/restaurant/requests', async (req,res)=>{ res.json(await RestaurantOwner.find({}).sort({createdAt: -1})); });

app.put('/api/restaurant/approve/:id', async (req,res)=>{
  const shop = await RestaurantOwner.findById(req.params.id);
  let updateData = {status:"Approved", paymentStatus: "Paid", lastPaymentDate: new Date()};
  if(shop.plan === "Trial"){ updateData.trial_end_date = new Date(Date.now() + 30*24*60*60*1000); } 
  else { updateData.plan_expiry = new Date(Date.now() + 365*24*60*60*1000); }
  await RestaurantOwner.findByIdAndUpdate(req.params.id, updateData);
  res.json({success:true, msg:`Approved. ${shop.plan} Started`})
});

// ===== OTHER APIs =====
app.get('/api/restaurants', async (req,res)=>{ const shops = await RestaurantOwner.find({status: "Approved"}); res.json(shops.map(s => ({restaurantId: s.restaurantId, restaurantName: s.restaurantName}))) });
app.get('/api/orders', async (req,res)=>{ res.json(await Order.find().sort({createdAt:-1})) });

// ===== PAGE ROUTES - YAHI LINE THIK KI HAI =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/restaurant-register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-register.html')));
app.get('/restaurant-login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-login.html')));
app.get('/restaurant-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-dashboard.html'))); // ✅ PURA LIKHA HAI

server.listen(PORT, ()=> console.log(`🚀 Server v3.5.5 Eat4Bite on ${PORT}`));