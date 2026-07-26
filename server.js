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
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2; 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: {origin: "*"} });
const PORT = process.env.PORT || 10000;

// CLOUDINARY CONFIG
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
.then(()=>console.log('✅ MongoDB Connected v3.6.4'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ===== MODELS =====
const MenuItem = mongoose.model('MenuItem', {name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String, default: 'default-shop'}});
const RestaurantOwner = mongoose.model('RestaurantOwner', {restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String,mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String,password: String, status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"},registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null},image_base64: {type: String, default: null},upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"},trial_end_date: {type: Date}, payout_due: {type: Number, default: 0},paymentStatus: {type: String, default: "Paid"}, lastPaymentDate: {type: Date, default: Date.now},nextDueDate: {type: Date}, createdAt: {type: Date, default: Date.now}});
const Rider = mongoose.model('Rider', {name:String, fatherName:String, aadhar:String, pan:String,mobile:{type:String, unique:true}, aadharImg: String, panImg: String, photoImg: String,lat:Number, lng:Number, lastUpdate:Date, status:{type:String, default:"Pending"},restaurantId: {type: String}, cash_balance: {type: Number, default: 0},cashLimit: {type: Number, default: 1000},weekly_orders: {type: Number, default: 0}, weekly_bonus: {type: Number, default: 0}});
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_5: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 30},total:Number, cash_to_restaurant: {type: Number, default: 0},paymentMode:String, cashCollected: {type: Number, default: 0},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number, pointsEarned:Number,coupon:String, discount:Number, shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, restaurantId: {type: String, default: 'default-shop'},cash_deposited: {type: Boolean, default: false}, cash_deposit_proof: {type: String, default: null},is_peak: {type: Boolean, default: false}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);
const Offer = mongoose.model('Offer', {code:String, discount:Number, type:{type:String, default:"PERCENT"}, restaurantId:String, createdAt:{type:Date, default:Date.now}});

async function sendWhatsApp(to, message) {console.log(`📲 WHATSAPP TO ${to}: ${message}`);}

// ===== SOCKET =====
io.on('connection', (socket) => {
  socket.on('riderLocation', async (data) => {
    await Rider.findOneAndUpdate({mobile: data.mobile}, {lat: data.lat, lng: data.lng, lastUpdate: new Date()});
    await Order.updateMany({riderId: data.mobile, status: "Out for Delivery"}, {riderLat: data.lat, riderLng: data.lng});
    io.emit('locationUpdate', {riderId: data.mobile, lat: data.lat, lng: data.lng});
  });
});

function calculateBill(item_total) {
  const commission_5 = Math.round(item_total * 0.05);
  const platform_fee = 10; 
  const delivery_fee = 30;
  const grand_total = item_total + commission_5 + platform_fee + delivery_fee;
  const hour = new Date().getHours();
  const is_peak = (hour >= 12 && hour <= 15) || (hour >= 19 && hour <= 22);
  return {item_total, commission_5, platform_fee, delivery_fee, grand_total, cash_to_restaurant: item_total, is_peak};
}

// ===== API ROUTES =====
app.put('/api/order/assign', async (req,res)=>{
  const rider = await Rider.findOne({mobile: req.body.riderId});
  if(!rider){ return res.json({success:false, msg:"Rider not found"}); }
  if(rider.cash_balance >= rider.cashLimit){ return res.json({success:false, msg:`⚠️ Cash Limit Reached: ₹${rider.cash_balance}. Please deposit to restaurant first.`}); }
  const busyOrder = await Order.findOne({ riderId: req.body.riderId, status: {$ne: 'Delivered'} });
  if(busyOrder){ return res.json({success:false, msg:"This rider is currently busy."}); }
  await Order.findByIdAndUpdate(req.body.orderId, { riderId: req.body.riderId, status: 'Out for Delivery' });
  res.json({success:true});
});

app.post('/api/order/delivered', async (req,res)=>{const {orderId, cashCollected} = req.body;const order = await Order.findById(orderId);if(!order) return res.json({success:false});await Order.findByIdAndUpdate(orderId, {status: 'Delivered', cashCollected: Number(cashCollected) || 0});if(order.paymentMode === 'COD'){await Rider.findOneAndUpdate({mobile: order.riderId}, {$inc: {cash_balance: Number(cashCollected), weekly_orders: 1}});} else {await Rider.findOneAndUpdate({mobile: order.riderId}, {$inc: {weekly_orders: 1}});}io.emit('newCash', {riderId: order.riderId});res.json({success:true, msg:"Order Marked Delivered"})});

app.post('/api/coupon/validate', async (req,res)=>{const {code} = req.body;const offer = await Offer.findOne({code: code.toUpperCase()});if(!offer) return res.json({success:false, msg:"Invalid Coupon"});res.json({success:true, discount: offer.discount, type: offer.type});});

app.post('/api/restaurant/register', async (req,res)=>{try{const {restaurantId, restaurantName, ownerName, mobile, email, address, password, image_base64, upi_id} = req.body;const exists = await RestaurantOwner.findOne({$or: [{mobile}, {email}, {restaurantId}]});if(exists) return res.json({success:false, msg: "Mobile/Email/ID already exists"});const hashedPassword = await bcrypt.hash(password, 10);let trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 30);await new RestaurantOwner({...req.body, password: hashedPassword, image_base64, upi_id, trial_end_date: trialEnd}).save();res.json({success:true, msg: "Registered. Approval pending."})}catch(e){ res.json({success:false, msg:e.message}) }});

app.post('/api/restaurant/login', async (req,res)=>{ 
  const {mobile, password} = req.body;
  const shop = await RestaurantOwner.findOne({mobile});
  if(!shop) return res.json({success:false, msg:"Mobile not registered"});
  if(shop.status !== "Approved") return res.json({success:false, msg:"Approval pending"});
  const valid = await bcrypt.compare(password, shop.password);
  if(!valid) return res.json({success:false, msg:"Wrong password"});
  res.json({success:true, shop})
});

// FIX: MENU ADD WITH IMAGE UPLOAD TO CLOUDINARY
app.post('/api/menu/add', upload.single('image'), async (req,res)=>{
  try{
    let imageUrl = '';
    if(req.file){
      const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`);
      imageUrl = result.secure_url;
    }
    await new MenuItem({...req.body, image: imageUrl}).save();
    res.json({success:true, msg:"Item Added"})
  }catch(e){ res.json({success:false, msg:e.message}) }
})

app.put('/api/menu/toggle/:id', async (req,res)=>{
  try{
    const item = await MenuItem.findById(req.params.id);
    item.inStock = !item.inStock;
    await item.save();
    res.json({success:true})
  }catch(e){ res.json({success:false, msg:e.message}) }
})

app.post('/api/orders', async (req,res)=>{const trackId = 'EB' + Date.now();const item_total = req.body.items.reduce((a,b)=>a+(b.price*b.qty), 0);const bill = calculateBill(item_total);const shop = await RestaurantOwner.findOne({restaurantId: req.body.restaurantId});const upi_id = shop ? shop.upi_id : "tanbalkhi2014-3@okhdfcbank";const upi_link = `upi://pay?pa=${upi_id}&pn=${shop.restaurantName}&am=${bill.grand_total}&cu=INR&tn=Order${trackId}`;const newOrder = await new Order({...req.body, trackId,...bill, total: bill.grand_total, custLat: req.body.custLat || null, custLng: req.body.custLng || null,paymentMode: req.body.payment || req.body.paymentMode}).save();if(shop && shop.mobile) sendWhatsApp(shop.mobile, `🔔 New Order ${trackId}\nTotal: ₹${bill.grand_total}\nPayment: ${req.body.paymentMode}\nAddress: ${req.body.address}`);io.emit('newOrder', newOrder);res.json({success:true, trackId, bill, upi_link, upi_id})});

app.get('/api/admin/graph', async (req,res)=>{const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0); return d; }).reverse();let data = [];for(let d of last7Days){const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);const orders = await Order.find({createdAt: {$gte: d, $lt: nextDay}});const revenue = orders.reduce((a,b)=>a+Number(b.item_total), 0);data.push({date: d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}), revenue, orders: orders.length})};res.json(data)});

// ===== ADMIN APIs =====
app.get('/api/admin/pending-restaurants', async (req,res)=>{ res.json(await RestaurantOwner.find({status: "Pending"})) });
app.get('/api/admin/pending-riders', async (req,res)=>{ res.json(await Rider.find({status: "Pending"})) });
app.put('/api/admin/approve-restaurant/:id', async (req,res)=>{ await RestaurantOwner.findByIdAndUpdate(req.params.id, {status:"Approved"}); res.json({success:true, msg:"Restaurant Approved"}) });
app.put('/api/admin/approve-rider/:id', async (req,res)=>{ await Rider.findByIdAndUpdate(req.params.id, {status:"Approved"}); res.json({success:true, msg:"Rider Approved"}) });
app.get('/api/admin/restaurants-all', async (req,res)=>{ res.json(await RestaurantOwner.find({}).sort({createdAt: -1})) });
app.get('/api/admin/restaurants', async (req,res)=>{ res.json(await RestaurantOwner.find({status: "Pending"})) });

// ADMIN SALES REPORT
app.get('/api/report', async (req,res)=>{
  const {start, end, shop} = req.query;
  let filter = {createdAt: {$gte: new Date(start), $lte: new Date(end+'T23:59:59')}};
  if(shop !== 'all') filter.restaurantId = shop;
  const orders = await Order.find(filter);
  const totalRevenue = orders.reduce((a,b)=>a+Number(b.item_total),0);
  if(shop === 'all'){
    const shops = await RestaurantOwner.find({status:'Approved'});
    const shopData = [];
    for(let s of shops){
      const shopOrders = orders.filter(o=>o.restaurantId === s.restaurantId);
      shopData.push({name: s.restaurantName, orders: shopOrders.length, revenue: shopOrders.reduce((a,b)=>a+Number(b.item_total),0)});
    }
    return res.json({shops: shopData, totalOrders: orders.length, totalRevenue});
  }
  res.json({totalOrders: orders.length, totalRevenue});
})

// ADMIN BROADCAST
app.post('/api/broadcast', async (req,res)=>{
  const {message, type} = req.body;
  let mobiles = [];
  if(type === 'all_restaurants'){
    const owners = await RestaurantOwner.find({status:'Approved'});
    mobiles = owners.map(o=>o.mobile);
  }
  console.log("📢 BROADCAST TO:", mobiles, "MSG:", message);
  res.json({count: mobiles.length, msg:"Broadcast Sent"});
})

// ADMIN RIDER CASH LIST
app.get('/api/admin/rider-cash', async (req,res)=>{
  const riders = await Rider.find({status: {$in: ["Online", "Approved"]}});
  const data = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for(let r of riders){
    const todayOrders = await Order.find({riderId: r.mobile, createdAt: {$gte: today}, status:'Delivered'});
    const today_collected = todayOrders.reduce((a,b)=>a+Number(b.cashCollected || 0),0);
    data.push({name: r.name, mobile: r.mobile, pending_cash: r.cash_balance || 0, today_collected: today_collected});
  }
  res.json(data);
})

// ADMIN MARK DEPOSIT
app.post('/api/admin/rider-deposit', async (req,res)=>{
  const {mobile} = req.body;
  await Rider.updateOne({mobile}, {$set: {cash_balance: 0}});
  res.json({success: true, msg:"Deposit Marked"});
})

// RESTAURANT CONFIRM DEPOSIT
app.post('/api/restaurant/cash-confirm', async (req,res)=>{
  const {riderId, depositedAmount} = req.body;
  await Rider.updateOne({mobile: riderId}, {$set: {cash_balance: 0}});
  res.json({msg: `₹${depositedAmount} Deposit Confirm ho gaya`});
})

// MENU
app.get('/api/menu', async (req,res)=> { const shopId = req.query.shop || 'default-shop'; res.json(await MenuItem.find({restaurantId: shopId})); });

app.get('/api/restaurants', async (req,res)=>{ const shops = await RestaurantOwner.find({status: "Approved"}); res.json(shops.map(s => ({id: s.restaurantId, name: s.restaurantName, address: s.address, image: s.image_base64, upi_id: s.upi_id}))) });
app.get('/api/orders', async (req,res)=>{ const shop = req.query.shop; if(shop) return res.json(await Order.find({restaurantId: shop}).sort({createdAt:-1})); res.json(await Order.find().sort({createdAt:-1})) });
app.post('/api/coupon', async (req,res)=>{ await new Offer(req.body).save(); res.json({success:true}) });

app.get('/api/rider/ledger', async (req,res)=>{const rider = await Rider.findOne({mobile: req.query.riderId});if(!rider) return res.json({success:false});const today = new Date(); today.setHours(0,0,0,0);const orders = await Order.find({riderId: req.query.riderId, createdAt: {$gte: today}});const collected = orders.reduce((a,b)=>a+Number(b.cashCollected), 0);res.json({ pending_cash: rider.cash_balance, limit: rider.cashLimit, today_collected: collected, today_orders: orders.length, progress: Math.round((rider.cash_balance / rider.cashLimit) * 100) })});
app.get('/api/rider/orders/:mobile', async (req,res)=>{ res.json(await Order.find({riderId: req.params.mobile, status: {$ne: 'Delivered'}}).sort({createdAt:-1})); });
app.post('/api/rider/login', async (req,res)=>{ let rider = await Rider.findOne({mobile: req.body.mobile}); if(!rider) return res.json({success:false, msg:"Mobile not registered"}); if(rider.status === "Pending") return res.json({success:false, msg:"Approval pending"}); rider = await Rider.findOneAndUpdate({mobile: req.body.mobile}, {status: "Online"}, {new:true}); res.json({success:true, rider}); });

// RIDER REGISTER WITH PHOTO UPLOAD
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
    await new Rider({
      name, fatherName, aadhar, pan, mobile, restaurantId,
      aadharImg: aadharUrl.secure_url, panImg: panUrl.secure_url, photoImg: photoUrl.secure_url,
      status: "Pending"
    }).save();
    res.json({success:true, msg:"Registered. Approval pending."})
  }catch(e){ res.json({success:false, msg:e.message}) }
});

app.post('/api/riderLocation', async (req,res)=>{ const {mobile, lat, lng} = req.body; await Rider.findOneAndUpdate({mobile}, {lat, lng, lastUpdate: new Date()}); res.json({success: true}); });
app.put('/api/rider/:id/status', async (req,res)=>{ await Rider.findByIdAndUpdate(req.params.id, {status: req.body.status}); res.json({success: true}); });

app.get('/api/orders/track/:id', async (req,res)=>{ res.json(await Order.findOne({trackId:req.params.id})) });

app.get('/invoice', async (req,res)=>{ const { id } = req.query; const order = await Order.findOne({trackId:id}); if(!order) return res.status(404).send("Order not found"); const doc = new PDFDocument({margin: 40}); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename=Eat4Bite-${id}.pdf`); doc.pipe(res); doc.fontSize(22).text('EAT4BITE™', {align: 'center'}); doc.fontSize(10).text(`Order ID: ${order.trackId} | Date: ${new Date(order.createdAt).toLocaleDateString()}`, {align: 'center'}); doc.moveDown(); doc.text('-------------------------------------------'); order.items.forEach(i=>{ doc.text(`${i.name} x ${i.qty} ₹${i.price*i.qty}`); }); doc.text('-------------------------------------------'); doc.text(`Sub Total: ₹${order.item_total}`); doc.text(`GST 5%: ₹${order.commission_5}`); doc.text(`Delivery Fee: ₹${order.delivery_fee}`); doc.text(`Platform Fee: ₹${order.platform_fee}`); doc.text('-------------------------------------------'); doc.fontSize(14).text(`Grand Total: ₹${order.total}`); doc.end(); });

// ===== PAGE ROUTES =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/rider', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rider.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));
app.get('/track', (req, res) => res.sendFile(path.join(__dirname, 'public', 'track.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin-owners', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-owners.html')));
app.get('/restaurants', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurants.html')));
app.get('/restaurant-register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-register.html')));
app.get('/restaurant-login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-login.html')));
app.get('/rider-register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rider-register.html')));
app.get('/restaurant-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-dashboard.html')));

server.listen(PORT, ()=> console.log(`🚀 Server v3.6.4 on ${PORT}`));