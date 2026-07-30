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
const customerSchema = new mongoose.Schema({name: String, phone: {type: String, unique: true}, password: String, address: String}, { timestamps: true });
const restaurantSchema = new mongoose.Schema({name: String, phone: {type: String, unique: true}, password: String, address: String, image: String, status: {type: String, default: 'Pending'}, ownerName: String, trial_end_date: Date}, { timestamps: true });
const riderSchema = new mongoose.Schema({name: String, phone: {type: String, unique: true}, password: String, vehicle: String, status: {type: String, default: 'Pending'}}, { timestamps: true });
const orderSchema = new mongoose.Schema({customerId: mongoose.Schema.Types.ObjectId, restaurantId: mongoose.Schema.Types.ObjectId, riderId: mongoose.Schema.Types.ObjectId, name: String, phone: String, address: String, items: Array, item_total: Number, grand_total: Number, commission_10: Number, platform_fee: Number, delivery_fee: Number, paymentMode: {type: String, default: 'COD'}, custLat: Number, custLng: Number, riderLat: Number, riderLng: Number, riderName: String, trackId: {type: String, unique: true}, status: {type: String, default: 'Pending'}}, { timestamps: true });
const menuItemSchema = new mongoose.Schema({restaurantId: mongoose.Schema.Types.ObjectId, name: String, price: Number, image: String, desc: String, category: String, inStock: {type: Boolean, default: true}}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Rider = mongoose.model('Rider', riderSchema);
const Order = mongoose.model('Order', orderSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// ========== 4. DB CONNECT ==========
mongoose.connect(process.env.MONGO_URL).then(()=>console.log('✅ MongoDB Connected v8.4')).catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ========== 5. BASIC ROUTES ==========
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/api', (req, res) => res.json({ success: true, message: "Eat4Bite API v8.4" }));

// ========== 6. RESTAURANT APIS ==========
app.post('/api/restaurant/register', upload.single('image'), async (req,res)=>{
  try{
    const {name, phone, password, address, ownerName} = req.body;
    const image = req.file? `/uploads/${req.file.filename}` : '';
    await new Restaurant({name, phone, password, address, ownerName, image}).save();
    res.json({success: true, message: "Registration Success. Wait for approval"});
  }catch(e){ res.status(500).json({success: false, message: e.message}); }
});

app.post('/api/restaurant/login', async (req,res)=>{
  const {phone, password} = req.body;
  const r = await Restaurant.findOne({phone, password});
  if(!r) return res.status(400).json({success: false, message: "Invalid"});
  if(r.status!== 'Approved') return res.status(400).json({success: false, message: "Not approved yet"});
  res.json({success: true, restaurant: r});
});

app.get('/api/restaurant/approved', async (req,res)=>{
  res.json(await Restaurant.find({status: 'Approved'}));
});

// ========== 7. MENU APIS ==========
app.get('/api/restaurant/menu/:restaurantId', async (req,res)=>{
  try{
    res.json({success: true, items: await MenuItem.find({restaurantId: req.params.restaurantId, inStock: true})});
  }catch(e){ res.status(500).json({success: false}); }
});

app.post('/api/restaurant/menu', upload.single('image'), async (req,res)=>{
  try{
    const {restaurantId, name, price, desc, category} = req.body;
    const image = req.file? `/uploads/${req.file.filename}` : '';
    await new MenuItem({restaurantId, name, price, image, desc, category}).save();
    res.json({success: true});
  }catch(e){ res.status(500).json({success: false}); }
});

app.delete('/api/restaurant/menu/:id', async (req,res)=>{
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({success: true});
});

// ========== 8. CUSTOMER & RIDER APIS ==========
app.post('/api/customer/register', async (req,res)=>{
  try{ await new Customer(req.body).save(); res.json({success: true}); }catch(e){ res.status(500).json({success: false}); }
});

app.post('/api/customer/login', async (req,res)=>{
  const c = await Customer.findOne(req.body);
  if(!c) return res.status(400).json({success: false, message: "Invalid"});
  res.json({success: true, customer: c});
});

app.post('/api/rider/register', async (req,res)=>{
  try{ await new Rider(req.body).save(); res.json({success: true}); }catch(e){ res.status(500).json({success: false}); }
});

// ========== 9. ORDER APIS ==========
app.post('/api/order/place', async (req,res)=>{
  try{
    const trackId = 'E4B' + Date.now();
    const order = await new Order({...req.body, trackId}).save();
    io.emit('new_order', order);
    res.json({success: true, trackId});
  }catch(e){ res.status(500).json({success: false}); }
});

app.get('/api/track/:trackId', async (req,res)=>{
  const o = await Order.findOne({trackId: req.params.trackId});
  if(!o) return res.status(404).json({error: "Order not found"});
  res.json(o);
});

// ========== 10. RESTAURANT ORDERS + PAYOUT ==========
app.get('/api/restaurant/orders/:id', async (req,res)=>{
  res.json({orders: await Order.find({restaurantId: req.params.id}).sort({createdAt: -1})});
});

app.get('/api/restaurant/payout/:id', async (req,res)=>{
  try {
    const total = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(req.params.id), status: 'Delivered' } },
      { $group: { _id: null, sum: { $sum: "$grand_total" } // <-- Yaha bracket fix kiya
    ]);
    res.json({payout_due: total[0]?.sum || 0});
  } catch(e) {
    res.status(500).json({error: e.message})
  }
});

// ========== 11. ADMIN APIS ==========
app.get('/api/admin/all-restaurants', async (req,res)=>{ res.json(await Restaurant.find({})); });
app.get('/api/admin/pending-restaurants', async (req,res)=>{ res.json(await Restaurant.find({status: 'Pending'})); });
app.get('/api/admin/pending-riders', async (req,res)=>{ res.json(await Rider.find({status: 'Pending'})); });

app.put('/api/admin/approve-restaurant/:id', async (req,res)=>{
  const d=new Date(); d.setDate(d.getDate()+30);
  await Restaurant.findByIdAndUpdate(req.params.id, {status: 'Approved', trial_end_date: d});
  res.json({success: true});
});

app.put('/api/admin/reject-restaurant/:id', async (req,res)=>{
  await Restaurant.findByIdAndUpdate(req.params.id, {status: 'Rejected'});
  res.json({success: true});
});

app.post('/api/admin/approve-rider/:id', async (req,res)=>{
  await Rider.findByIdAndUpdate(req.params.id, {status: 'Approved'});
  res.json({success: true});
});

// ========== 12. RIDER APIS ==========
app.get('/api/rider/orders', async (req,res)=>{
  const orders = await Order.find({status: 'Accepted', riderId: null}).sort({createdAt: -1});
  res.json({orders});
});

app.put('/api/rider/update-location/:orderId', async (req,res)=>{
  const {riderLat, riderLng} = req.body;
  await Order.findByIdAndUpdate(req.params.orderId, {riderLat, riderLng});
  io.emit('location_update', {orderId: req.params.orderId, riderLat, riderLng});
  res.json({success: true});
}); // <-- Yaha bracket fix kiya

// ========== 13. 404 + SERVER ==========
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));