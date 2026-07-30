require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const http = require('http');
const multer = require('multer');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: {origin: "*"} });
const PORT = process.env.PORT || 10000;

// ========== 1. UPLOAD SETUP ==========
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
app.set('upload', upload);

// ========== 2. MIDDLEWARE ==========
app.use(cors({origin: "*"}));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));
app.set('io', io);

// ========== 3. MODELS ==========
const customerSchema = new mongoose.Schema({ 
  name: {type: String, required: true}, 
  phone: {type: String, unique: true, required: true}, 
  password: {type: String, required: true}, 
  address: String 
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({ 
  name: {type: String, required: true}, 
  phone: {type: String, unique: true, required: true}, 
  password: {type: String, required: true}, 
  address: String,
  image: String, 
  status: {type: String, default: 'pending'} 
}, { timestamps: true });

const riderSchema = new mongoose.Schema({ 
  name: {type: String, required: true}, 
  phone: {type: String, unique: true, required: true}, 
  password: {type: String, required: true}, 
  vehicle: String,
  status: {type: String, default: 'pending'} 
}, { timestamps: true });

const orderSchema = new mongoose.Schema({ 
  customerId: mongoose.Schema.Types.ObjectId, 
  restaurantId: mongoose.Schema.Types.ObjectId,
  riderId: mongoose.Schema.Types.ObjectId,
  items: Array, 
  grand_total: Number, 
  trackId: {type: String, unique: true}, 
  status: {type: String, default: 'pending'} 
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
  restaurantId: mongoose.Schema.Types.ObjectId,
  name: String,
  price: Number,
  image: String,
  inStock: {type: Boolean, default: true}
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Rider = mongoose.model('Rider', riderSchema);
const Order = mongoose.model('Order', orderSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// ========== 4. DB CONNECT ==========
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('✅ MongoDB Connected v5.0 - FULL'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ========== 5. ROOT + API TEST ROUTE ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api', (req, res) => {
  res.json({ success: true, message: "Eat4Bite API is working ✅" });
});

// ========== 6. API ROUTES ==========

// --- RESTAURANT ---
app.post('/api/restaurant/register', upload.single('image'), async (req,res)=>{
  try{
    const {name, phone, password, address} = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const restaurant = new Restaurant({name, phone, password, address, image});
    await restaurant.save();
    res.json({success: true, message: "Registration Success. Wait for approval"});
  }catch(e){
    res.status(500).json({success: false, message: e.message});
  }
});

app.post('/api/restaurant/login', async (req,res)=>{
  const {phone, password} = req.body;
  const restaurant = await Restaurant.findOne({phone, password});
  if(!restaurant) return res.status(400).json({success: false, message: "Invalid"});
  if(restaurant.status !== 'approved') return res.status(400).json({success: false, message: "Not approved yet"});
  res.json({success: true, restaurant});
});

app.get('/api/restaurant/approved', async (req,res)=>{
  const restaurants = await Restaurant.find({status: 'approved'});
  res.json(restaurants);
});

// --- CUSTOMER ---
app.post('/api/customer/register', async (req,res)=>{
  try{
    const customer = new Customer(req.body);
    await customer.save();
    res.json({success: true, message: "Customer Registered"});
  }catch(e){
    res.status(500).json({success: false, message: e.message});
  }
});

app.post('/api/customer/login', async (req,res)=>{
  const {phone, password} = req.body;
  const customer = await Customer.findOne({phone, password});
  if(!customer) return res.status(400).json({success: false, message: "Invalid"});
  res.json({success: true, customer});
});

// --- RIDER ---
app.post('/api/rider/register', async (req,res)=>{
  try{
    const rider = new Rider(req.body);
    await rider.save();
    res.json({success: true, message: "Rider Registered. Wait for approval"});
  }catch(e){
    res.status(500).json({success: false, message: e.message});
  }
});

// --- ORDER ---
app.post('/api/order/place', async (req,res)=>{
  try{
    const trackId = 'E4B' + Date.now();
    const order = new Order({...req.body, trackId});
    await order.save();
    io.emit('new_order', order); // socket
    res.json({success: true, message: "Order Placed", trackId});
  }catch(e){
    res.status(500).json({success: false, message: e.message});
  }
});


// APPROVE KARNE KA API
app.post('/api/admin/approve-restaurant/:id', async (req,res)=>{
  await Restaurant.findByIdAndUpdate(req.params.id, {status: 'approved'});
  res.json({success: true});
});
app.post('/api/admin/approve-rider/:id', async (req,res)=>{
  await Rider.findByIdAndUpdate(req.params.id, {status: 'approved'});
  res.json({success: true});
});

// ========== 7. 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ADMIN PANEL APIS
app.get('/api/admin/pending-restaurants', async (req,res)=>{
  try{
    const restaurants = await Restaurant.find({status: 'pending'});
    res.json(restaurants);
  }catch(e){ res.status(500).json({error: e.message}) }
});

app.get('/api/admin/pending-riders', async (req,res)=>{
  try{
    const riders = await Rider.find({status: 'pending'});
    res.json(riders);
  }catch(e){ res.status(500).json({error: e.message}) }
});

app.get('/api/admin/approved-restaurants', async (req,res)=>{
  try{
    const restaurants = await Restaurant.find({status: 'approved'});
    res.json(restaurants);
  }catch(e){ res.status(500).json({error: e.message}) }
});


// ========== 8. SERVER START ==========
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));