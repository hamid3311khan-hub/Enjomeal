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
const uploadRider = multer({ storage: multer.memoryStorage() });
if (!fs.existsSync('./uploads')){ fs.mkdirSync('./uploads'); }

app.use(cors({origin: "*"}));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('✅ MongoDB Connected v3.6.2 Eat4Bite'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ===== MODELS =====
const RestaurantOwner = mongoose.model('RestaurantOwner', {
  restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String,
  mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String,
  password: String, status: {type: String, default: "Pending"}, plan: {type: String, default: "Trial"},
  registration_fee_paid: {type: Number, default: 200}, image: {type: String, default: null},
  upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"}, trial_end_date: {type: Date}, 
  plan_expiry: {type: Date}, paymentStatus: {type: String, default: "Pending"}, 
  lastPaymentDate: {type: Date, default: Date.now}, createdAt: {type: Date, default: Date.now}
});

const Rider = mongoose.model('Rider', {
  riderId: {type: String, unique: true}, restaurantId: String, riderName: String, 
  fatherName: String, aadhar: String, pan: String, mobile: {type: String, unique: true},
  aadharImg: String, panImg: String, photoImg: String, status: {type: String, default: "Pending"},
  createdAt: {type: Date, default: Date.now}
});

const Order = mongoose.model('Order', new mongoose.Schema({
  trackId: String, name:String, phone:String, address:String, items:[],
  item_total: Number, commission_5: Number,platform_fee: Number, delivery_fee: Number,total:Number, 
  paymentMode:String, status:{type:String, default:'Pending'}, 
  riderId: String, restaurantId: String, cashCollected: Number,
  custLat: Number, custLng: Number
}, {timestamps: true}));

// ===== RESTAURANT APIs =====
app.post('/api/restaurant/register', async (req,res)=>{
  try{
    let {restaurantName, ownerName, mobile, email, address, password, image_base64, plan} = req.body;
    let amount = plan === "Annual" ? 2000 : 200;
    let restaurantId = restaurantName.toLowerCase().replace(/ /g,'-') + '-' + Date.now();
    const exists = await RestaurantOwner.findOne({$or: [{mobile}, {email}]});
    if(exists && exists.plan === "Trial") return res.json({success:false, msg: "Trial already used. Please take Annual Plan ₹2000"})
    if(exists) return res.json({success:false, msg: "Mobile/Email already exists"});
    const hashedPassword = await bcrypt.hash(password, 10);
    let trial_end_date = plan === "Trial" ? new Date(Date.now() + 30*24*60*60*1000) : null;
    let plan_expiry = plan === "Annual" ? new Date(Date.now() + 365*24*60*60*1000) : null;
    await new RestaurantOwner({restaurantId, restaurantName, ownerName, mobile, email, address, password: hashedPassword, image: image_base64, plan, paymentStatus: "Pending", registration_fee_paid: amount, trial_end_date, plan_expiry}).save();
    res.json({success:true, msg:`Registered for ${plan} Plan. Pay ₹${amount} to activate`, upi_id: "tanbalkhi2014-3@okhdfcbank", amount})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

app.post('/api/restaurant/login', async (req,res)=>{ 
  try{
    const {email, password} = req.body;
    const shop = await RestaurantOwner.findOne({email});
    if(!shop) return res.json({success:false, msg:"Email not registered"});
    if(shop.status !== "Approved") return res.json({success:false, msg:"Approval pending"});
    const now = new Date();
    if(shop.plan === "Trial" && shop.trial_end_date && now > shop.trial_end_date){
      return res.json({success:false, msg:"Your 30 Day Trial Expired. Please upgrade to Annual ₹2000 to continue"})
    }
    if(shop.plan === "Annual" && shop.plan_expiry && now > shop.plan_expiry){
      return res.json({success:false, msg:"Your Annual Plan Expired. Please renew for ₹2000"})
    }
    if(shop.paymentStatus !== "Paid") return res.json({success:false, msg:"Pay registration fee first"});
    const {password: pass, ...shopData} = shop.toObject();
    res.json({success:true, shop: shopData})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

// ===== RIDER APIs =====
app.post('/api/rider/register', uploadRider.fields([
  { name: 'aadharImg', maxCount: 1 }, { name: 'panImg', maxCount: 1 }, { name: 'photoImg', maxCount: 1 }
]), async (req,res)=>{
  try{
    const {restaurantId, name, fatherName, aadhar, pan, mobile} = req.body;
    const exists = await Rider.findOne({mobile});
    if(exists) return res.json({success:false, msg: "Mobile already registered"});

    const uploadPromises = Object.values(req.files).map(file => 
      cloudinary.uploader.upload(`data:${file[0].mimetype};base64,${file[0].buffer.toString('base64')}`)
    );
    const [aadharUrl, panUrl, photoUrl] = await Promise.all(uploadPromises);

    const riderId = "RIDER" + Date.now();
    await new Rider({
      riderId, restaurantId, riderName: name, fatherName, aadhar, pan, mobile,
      aadharImg: aadharUrl.secure_url, panImg: panUrl.secure_url, photoImg: photoUrl.secure_url,
      status: "Pending"
    }).save();
    
    res.json({success:true, msg:"Registration success. Admin approval pending"})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

app.post('/api/rider/login', async (req,res)=>{
  try{
    const {mobile} = req.body;
    const rider = await Rider.findOne({mobile});
    if(!rider) return res.json({success:false, msg:"Mobile not registered"});
    if(rider.status !== "Approved") return res.json({success:false, msg:"Approval pending"});
    const {_id, ...riderData} = rider.toObject();
    res.json({success:true, rider: {_id, ...riderData, name: rider.riderName}})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

app.put('/api/rider/:id/status', async (req,res)=>{
  try{
    const {status} = req.body;
    await Rider.findByIdAndUpdate(req.params.id, {status});
    res.json({success:true})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

app.post('/api/riderLocation', async (req,res)=>{
  io.emit('riderLocationUpdate', req.body);
  res.json({success:true})
});

app.get('/api/rider/ledger', async (req,res)=>{
  try{
    const {riderId} = req.query;
    const today = new Date(); today.setHours(0,0,0,0);
    const orders = await Order.find({riderId, createdAt: {$gte: today}, status: "Delivered"});
    const today_collected = orders.reduce((sum, o)=> sum + o.total, 0);
    const pending_cash = today_collected;
    const progress = Math.min((pending_cash / 1000) * 100, 100);
    res.json({pending_cash, today_collected, today_orders: orders.length, progress: Math.round(progress)})
  }catch(e){ res.json({pending_cash:0, today_collected:0, today_orders:0, progress:0}) }
});

app.get('/api/rider/orders/:mobile', async (req,res)=>{
  try{
    const orders = await Order.find({riderId: req.params.mobile, status: {$in: ["Assigned", "Out for Delivery"]}}).sort({createdAt: -1});
    res.json(orders)
  }catch(e){ res.json([]) }
});

// ===== ADMIN APIs =====
app.get('/api/restaurant/requests', async (req,res)=>{ res.json(await RestaurantOwner.find({}).sort({createdAt: -1})); });
app.put('/api/restaurant/approve/:id', async (req,res)=>{
  try{
    const shop = await RestaurantOwner.findById(req.params.id);
    let updateData = {status:"Approved", paymentStatus: "Paid", lastPaymentDate: new Date()};
    if(shop.plan === "Trial"){ updateData.trial_end_date = new Date(Date.now() + 30*24*60*60*1000); } 
    else { updateData.plan_expiry = new Date(Date.now() + 365*24*60*60*1000); }
    await RestaurantOwner.findByIdAndUpdate(req.params.id, updateData);
    res.json({success:true, msg:`Approved. ${shop.plan} Started`})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

app.get('/api/admin/riders/pending', async (req,res)=>{ res.json(await Rider.find({status: "Pending"})) });
app.get('/api/orders', async (req,res)=>{ res.json(await Order.find().sort({createdAt:-1})) });
app.post('/api/order/delivered', async (req,res)=>{
  try{
    const {orderId, cashCollected} = req.body;
    await Order.findByIdAndUpdate(orderId, {status: "Delivered", cashCollected});
    res.json({success:true})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

// ===== PUBLIC APIs =====
app.get('/api/restaurants', async (req,res)=>{ 
  try{
    const shops = await RestaurantOwner.find({status: "Approved"}); 
    res.json(shops.map(s => ({restaurantId: s.restaurantId, restaurantName: s.restaurantName})))
  }catch(e){ res.status(500).json([]) }
});

// ===== PAGE ROUTES =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/restaurant-register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-register.html')));
app.get('/restaurant-login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-login.html')));
app.get('/restaurant-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-dashboard.html')));
app.get('/rider-register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rider-register.html')));
app.get('/rider', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rider.html')));

server.listen(PORT, ()=> console.log(`🚀 Server v3.6.2 Eat4Bite on ${PORT}`));