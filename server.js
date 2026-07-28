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
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('✅ MongoDB Connected v3.9.0 - 42 API 18 PAGES'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ===== MODELS =====
const MenuItem = mongoose.model('MenuItem', {name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String, default: 'default-shop'}});
const RestaurantOwner = mongoose.model('RestaurantOwner', {restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String, mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String, password: String, status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"}, registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null}, image: {type: String, default: null}, upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"}, trial_end_date: {type: Date}, payout_due: {type: Number, default: 0}, createdAt: {type: Date, default: Date.now}});
const Rider = mongoose.model('Rider', {name:String, fatherName:String, aadhar:String, pan:String,mobile:{type:String, unique:true}, aadharImg: String, panImg: String, photoImg: String,lat:Number, lng:Number, lastUpdate:Date, status:{type:String, default:"Pending"},restaurantId: {type: String}, cash_balance: {type: Number, default: 0},cashLimit: {type: Number, default: 1000}});
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_5: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 30},grand_total: {type: Number, default: 0}, total:Number, paymentMode:String, cashCollected: {type: Number, default: 0},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number,shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, riderName: String, restaurantId: {type: String, default: 'default-shop'}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);
const Offer = mongoose.model('Offer', {code:String, discount:Number, type:{type:String, default:"PERCENT"}, restaurantId:String, createdAt:{type:Date, default:Date.now}});
const Banner = mongoose.model('Banner', {text: String, image: String, color: String, updatedAt: {type: Date, default: Date.now}});

async function sendWhatsApp(to, message) {console.log(`📲 WHATSAPP TO ${to}: ${message}`);}

io.on('connection', (socket) => {
  socket.on('riderLocation', async (data) => {
    await Rider.findOneAndUpdate({mobile: data.mobile}, {lat: data.lat, lng: data.lng, lastUpdate: new Date()});
    await Order.updateMany({riderId: data.mobile, status: "Out for Delivery"}, {riderLat: data.lat, riderLng: data.lng});
    io.emit('locationUpdate', {riderId: data.mobile, lat: data.lat, lng: data.lng});
  });
});

function calculateBill(item_total) {
  const commission_5 = Math.round(item_total * 0.05); const platform_fee = 10; const delivery_fee = 30;
  const grand_total = item_total + commission_5 + platform_fee + delivery_fee;
  return {item_total, commission_5, platform_fee, delivery_fee, grand_total, cash_to_restaurant: item_total};
}

// ===== MENU API - 5 =====
app.post('/api/menu', upload.single('image'), async (req,res)=>{ try{ let imageUrl = ''; if(req.file){ const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`); imageUrl = result.secure_url; } await new MenuItem({...req.body, image: imageUrl}).save(); res.json({success:true, msg:"Item Added"}); }catch(e){ res.json({success:false, msg:e.message}) }});
app.put('/api/menu/:id', upload.single('image'), async (req,res)=>{ try{ let updateData = {...req.body}; if(req.file){ const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`); updateData.image = result.secure_url; } await MenuItem.findByIdAndUpdate(req.params.id, updateData); res.json({success:true, msg:"Item Updated"}); }catch(e){ res.json({success:false, msg:e.message}) }});
app.put('/api/menu/:id/stock', async (req,res)=>{ try{ const item = await MenuItem.findById(req.params.id); item.inStock =!item.inStock; await item.save(); res.json({success:true}); } catch(e){ res.json({success:false, msg:e.message}) }});
app.delete('/api/menu/:id', async (req,res)=>{ try{ await MenuItem.findByIdAndDelete(req.params.id); res.json({success:true, msg:"Item Deleted"}); } catch(e){ res.json({success:false, msg:e.message}) }});
app.get('/api/menu', async (req,res)=> { const shopId = req.query.shop || 'default-shop'; res.json(await MenuItem.find({restaurantId: shopId})); });

// ===== ADMIN APIs - 13 =====
app.get('/api/admin/pending-restaurants', async (req,res)=>{ try{ res.json(await RestaurantOwner.find({status: "Pending"})) } catch(e){ res.status(500).json([]) }});
app.get('/api/admin/pending-riders', async (req,res)=>{ try{ res.json(await Rider.find({status: "Pending"})) } catch(e){ res.status(500).json([]) }});
app.put('/api/admin/approve-restaurant/:id', async (req,res)=>{ try{ const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 30); await RestaurantOwner.findByIdAndUpdate(req.params.id, {status:"Approved", trial_end_date: trialEnd}); res.json({success:true, msg:"Restaurant Approved"}) } catch(e){ res.status(500).json({success:false}) }});
app.put('/api/admin/reject-restaurant/:id', async (req,res)=>{ try{ await RestaurantOwner.findByIdAndUpdate(req.params.id, {status:"Rejected"}); res.json({success:true, msg:"Restaurant Rejected"}) } catch(e){ res.status(500).json({success:false, msg: e.message}) }});
app.get('/api/admin/all-restaurants', async (req,res)=>{ try{ const restaurants = await RestaurantOwner.find({}).sort({createdAt: -1}); res.json(restaurants) } catch(e){ res.status(500).json([]) }});
app.put('/api/admin/approve-rider/:id', async (req,res)=>{ try{ await Rider.findByIdAndUpdate(req.params.id, {status:"Approved"}); res.json({success:true, msg:"Rider Approved"}) } catch(e){ res.status(500).json({success:false}) }});
app.get('/api/admin/restaurants', async (req,res)=>{ try{ const restaurants = await RestaurantOwner.find({status: "Approved"}); const formatted = restaurants.map(r => ({_id: r.restaurantId, name: r.restaurantName, address: r.address, mobile: r.mobile, email: r.email, status: r.status, plan_status: r.plan_status, image: r.image, payment_proof: r.payment_proof})); res.json(formatted) } catch(e){ res.status(500).json([]) }});
app.get('/api/restaurants', async (req,res)=>{ try{ const restaurants = await RestaurantOwner.find({status: "Approved"}); const formatted = restaurants.map(r => ({_id: r.restaurantId, name: r.restaurantName, address: r.address, image: r.image || `https://via.placeholder.com/400x180/ff6600/ffffff?text=${encodeURIComponent(r.restaurantName)}`, mobile: r.mobile, email: r.email})); res.json(formatted) } catch(e){ res.status(500).json([]) }});
app.get('/api/admin/approved-riders', async (req,res)=>{ try{ const riders = await Rider.find({status: "Approved"}).select('name mobile'); res.json(riders) } catch(e){ res.json([]) } });
app.post('/api/admin/assign-rider', async (req,res)=>{ try{ const {orderId, riderId} = req.body; const order = await Order.findOne({trackId: orderId}); if(!order) return res.json({success:false, msg:"Order nahi mila"}); const rider = await Rider.findOne({mobile: riderId}); if(!rider) return res.json({success:false, msg:"Rider nahi mila"}); await Order.findOneAndUpdate({trackId: orderId}, { riderId: riderId, riderName: rider.name, status: 'Out for Delivery' }); io.emit('newOrderForRider', {riderId}); res.json({success:true, msg:"Rider Assigned!"}); }catch(e){ res.json({success:false, msg:e.message}) }});
app.get('/api/admin/graph', async (req,res)=>{ try{ let data = []; for(let i=6; i>=0; i--){ let d = new Date(); d.setDate(d.getDate()-i); let start = new Date(d); start.setHours(0,0,0,0); let end = new Date(d); end.setHours(23,59,59,999); const orders = await Order.find({createdAt: {$gte: start, $lte: end}}); const revenue = orders.reduce((a,b)=>a+Number(b.grand_total || b.total || 0),0); data.push({date: d.toLocaleDateString('en-IN', {day:'2-digit', month:'short'}), revenue: revenue, orders: orders.length}); } res.json(data) }catch(e){ res.json([]) }});
app.get('/api/admin/rider-cash', async (req,res)=>{ try{ const riders = await Rider.find({status: "Approved"}); res.json(riders.map(r=>({name:r.name, mobile:r.mobile, pending_cash:r.cash_balance}))) }catch(e){ res.json([]) }});
app.post('/api/admin/rider-deposit', async (req,res)=>{ try{ await Rider.updateOne({mobile: req.body.mobile}, {$set: {cash_balance: 0}}); res.json({success:true}) }catch(e){ res.json({success:false}) }});
// ===== BANNER API - 3 =====
app.get('/api/admin/promo', async (req,res)=>{ try{ res.json(await Banner.findOne().sort({updatedAt:-1}) || {}) }catch(e){ res.json({}) }});
app.post('/api/admin/promo', upload.single('bannerImage'), async (req,res)=>{ try{ const existing = await Banner.findOne({}); let imageUrl = existing?.image || ''; if(req.file){ const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {folder: 'eat4bite-banners'}); imageUrl = result.secure_url; } await Banner.findOneAndUpdate({}, {text: req.body.text, image: imageUrl, color: req.body.color, updatedAt: new Date()}, {upsert: true}); res.json({success:true}) }catch(e){ res.json({success:false, msg:e.message}) }});
app.delete('/api/admin/promo', async (req,res)=>{ try{ await Banner.deleteMany({}); res.json({success:true}) }catch(e){ res.json({success:false}) }});

app.post('/api/broadcast', async (req,res)=>{ try{ const owners = await RestaurantOwner.find({status:"Approved"}); owners.forEach(o=> sendWhatsApp(o.mobile, `📢 ADMIN NOTICE: ${req.body.message}`)); res.json({success:true, count: owners.length}) }catch(e){ res.json({success:false}) }});
app.get('/api/report', async (req,res)=>{ try{ const {start, end, shop} = req.query; let query = {createdAt: {$gte: new Date(start), $lte: new Date(end)}}; if(shop!== 'all') query.restaurantId = shop; const orders = await Order.find(query); res.json({totalOrders: orders.length, totalRevenue: orders.reduce((a,b)=>a+Number(b.grand_total || b.total || 0),0)}) }catch(e){ res.json({totalOrders:0, totalRevenue:0}) }});

// ===== RIDER APIs - 7 NEW =====
app.post('/api/rider-register', uploadRider.fields([{name: 'aadharImg'}, {name: 'panImg'}, {name: 'photoImg'}]), async (req,res)=>{ try{ const {restaurantId, name, fatherName, aadhar, pan, mobile} = req.body; if(await Rider.findOne({mobile})) return res.json({success:false, msg:"Mobile pehle se registered hai"}); const upload = async (file) => { if(!file) return ""; const result = await cloudinary.uploader.upload(`data:${file[0].mimetype};base64,${file[0].buffer.toString('base64')}`, {folder: 'eat4bite_riders'}); return result.secure_url; } const aadharUrl = await upload(req.files['aadharImg']); const panUrl = await upload(req.files['panImg']); const photoUrl = await upload(req.files['photoImg']); await new Rider({restaurantId, name, fatherName, aadhar, pan, mobile, aadharImg: aadharUrl, panImg: panUrl, photoImg: photoUrl}).save(); res.json({success:true, msg:"Registered! Admin approval ka wait kare"}) }catch(e){ res.json({success:false, msg:e.message}) }});
app.post('/api/rider-login', async (req,res)=>{ try{ const rider = await Rider.findOne({mobile: req.body.mobile}); if(!rider) return res.json({success:false, msg:"Rider nahi mila"}); if(rider.status === "Pending") return res.json({success:false, msg:"Approval pending hai"}); res.json({success:true, rider}) }catch(e){ res.json({success:false, msg:"Server Error"}) }});
app.put('/api/rider-status/:id', async (req,res)=>{ try{ await Rider.findByIdAndUpdate(req.params.id, {status: req.body.status}); res.json({success:true}) }catch(e){ res.json({success:false}) }});
app.post('/api/riderLocation', async (req,res)=>{ try{ await Rider.findOneAndUpdate({mobile: req.body.mobile}, {lat: req.body.lat, lng: req.body.lng, lastUpdate: new Date()}); res.json({success:true}) }catch(e){ res.json({success:false}) }});
app.get('/api/rider-orders/:mobile', async (req,res)=>{ try{ res.json(await Order.find({riderId: req.params.mobile, status: {$ne: "Delivered"}}).sort({createdAt:-1})) }catch(e){ res.json([]) }});
app.get('/api/rider/ledger', async (req,res)=>{ try{ const rider = await Rider.findOne({mobile: req.query.riderId}); const today = new Date(); today.setHours(0,0,0,0); const todayOrders = await Order.find({riderId: req.query.riderId, createdAt: {$gte: today}, status: "Delivered"}); const today_collected = todayOrders.reduce((a,b)=>a+Number(b.cashCollected || 0),0); const progress = Math.round((rider.cash_balance / rider.cashLimit) * 100); res.json({pending_cash: rider.cash_balance, today_orders: todayOrders.length, today_collected: today_collected, progress: progress > 100? 100 : progress}) }catch(e){ res.json({}) }});
app.post('/api/order-delivered', async (req,res)=>{ try{ const {orderId, cashCollected} = req.body; const order = await Order.findById(orderId); await Order.findByIdAndUpdate(orderId, {status: "Delivered", cashCollected: cashCollected}); await Rider.updateOne({mobile: order.riderId}, {$inc: {cash_balance: cashCollected}}); io.emit('orderStatusUpdate', {orderId: orderId, status: "Delivered"}); res.json({success:true}) }catch(e){ res.json({success:false}) }});

// ===== RESTAURANT API - 7 =====
app.post('/api/restaurant-register', upload.fields([{ name: 'restaurantImage', maxCount: 1 }, { name: 'paymentProof', maxCount: 1 }]), async (req,res)=>{ try{ const {restaurantName, ownerName, mobile, email, address, password, amount} = req.body; let plan = req.body.plan; if(Array.isArray(plan)) plan = plan[0]; const existing = await RestaurantOwner.findOne({$or: [{mobile}, {email}]}); if(existing) return res.json({success:false, msg:"Mobile ya Email pehle se hai"}); let restaurantImageUrl = ""; let paymentProofUrl = ""; if(req.files['restaurantImage']){ const result = await cloudinary.uploader.upload(`data:${req.files['restaurantImage'][0].mimetype};base64,${req.files['restaurantImage'][0].buffer.toString('base64')}`, {folder: 'eat4bite_restaurants'}); restaurantImageUrl = result.secure_url; } if(req.files['paymentProof']){ const result = await cloudinary.uploader.upload(`data:${req.files['paymentProof'][0].mimetype};base64,${req.files['paymentProof'][0].buffer.toString('base64')}`, {folder: 'eat4bite_proofs'}); paymentProofUrl = result.secure_url; } const restaurantId = "shop_" + Date.now(); const regAmount = Number(amount) || 200; const planType = regAmount === 2000? "Annual" : "Trial"; const trialDays = regAmount === 2000? 365 : 7; const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + trialDays); await new RestaurantOwner({ restaurantId, restaurantName, ownerName, mobile, email, address, password, status: "Pending", image: restaurantImageUrl, payment_proof: paymentProofUrl, trial_end_date: trialEnd, plan_status: planType, registration_fee_paid: regAmount, upi_id: "tanbalkhi2014-3@okhdfcbank" }).save(); res.json({ success:true, msg:"Registration ho gayi. Approval ke baad login karna", upi_id: "tanbalkhi2014-3@okhdfcbank" }) }catch(e){ console.log(e); res.json({success:false, msg:e.message}) }});
app.post('/api/restaurant-login', async (req,res)=>{ try{ const {mobile, password} = req.body; const restaurant = await RestaurantOwner.findOne({mobile}); if(!restaurant) return res.status(400).json({success:false, msg:"Restaurant nahi mila"}); if(restaurant.password!== password) return res.status(400).json({success:false, msg:"Password galat"}); if(restaurant.status!== "Approved") return res.status(400).json({success:false, msg:"Approval pending hai"}); res.json({success:true, shop: restaurant}) }catch(e){ res.status(500).json({success:false, msg:"Server Error"}) }});
app.get('/api/restaurant/ledger', async (req,res)=>{ try{ const shop = req.query.shop; const today = new Date(); today.setHours(0,0,0,0); const orders = await Order.find({restaurantId: shop, createdAt: {$gte: today}}); const revenue = orders.reduce((a,b)=>a+Number(b.item_total),0); const cod = orders.filter(o=>o.paymentMode=='COD').reduce((a,b)=>a+Number(b.item_total),0); const online = revenue - cod; const payout_due = Math.round(cod * 0.95); res.json({ orders: orders.length, revenue, cod, online, earning: Math.round(cod * 0.95), payout_due }) }catch(e){ res.status(500).json({})}});
app.post('/api/restaurant/payout', async (req,res)=>{ try{ const {restaurantId} = req.body; await RestaurantOwner.updateOne({restaurantId}, {$set: {payout_due: 0}}); res.json({success:true, msg:"Payout Marked"}) }catch(e){ res.json({success:false}) }});
app.put('/api/orders/:id/status', async (req,res)=>{ try{ await Order.findByIdAndUpdate(req.params.id, {status: req.body.status}); res.json({success:true}) }catch(e){ res.json({success:false}) }});
app.get('/api/riders', async (req,res)=>{ try{ res.json(await Rider.find({}).select('name mobile restaurantId cash_balance')) }catch(e){ res.json([]) }});
app.post('/api/restaurant/cash-confirm', async (req,res)=>{ try{ const {riderId, depositedAmount} = req.body; await Rider.updateOne({mobile: riderId}, {$inc: {cash_balance: -depositedAmount}}); res.json({success:true, msg:"Cash Settled"}) }catch(e){ res.json({success:false}) }});
app.post('/api/restaurant/offer', async (req,res)=>{ try{ await new Offer({...req.body}).save(); res.json({success:true, msg:"Offer Created"}) }catch(e){ res.json({success:false}) }});

// ===== ORDER API - 3 =====
app.post('/api/orders', async (req,res)=>{const trackId = 'EB' + Date.now();const item_total = req.body.items.reduce((a,b)=>a+(b.price*b.qty), 0);const bill = calculateBill(item_total);const shop = await RestaurantOwner.findOne({restaurantId: req.body.restaurantId});const upi_id = shop? shop.upi_id : "tanbalkhi2014-3@okhdfcbank";const upi_link = `upi://pay?pa=${upi_id}&pn=${shop.restaurantName}&am=${bill.grand_total}&cu=INR&tn=Order${trackId}`;const newOrder = await new Order({...req.body, trackId,...bill, total: bill.grand_total, custLat: req.body.custLat || null, custLng: req.body.custLng || null,paymentMode: req.body.payment || req.body.paymentMode}).save();if(shop && shop.mobile) sendWhatsApp(shop.mobile, `🔔 New Order ${trackId}\nTotal: ₹${bill.grand_total}`);io.emit('newOrder', newOrder);res.json({success:true, trackId, bill, upi_link, upi_id})});
app.get('/api/orders', async (req,res)=>{ try{ const shop = req.query.shop; if(shop) return res.json(await Order.find({restaurantId: shop}).sort({createdAt:-1})); res.json(await Order.find().sort({createdAt:-1})) } catch(e){ res.status(500).json([]) }});
app.get('/api/orders/track/:id', async (req,res)=>{ try{ const order = await Order.findOne({trackId: req.params.id}); if(!order) return res.json(null); res.json(order) } catch(e){ res.status(500).json(null) } });
// ===== 18 PAGE ROUTES MATCHED WITH YOUR PUBLIC FOLDER =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/restaurants', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurants.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));
app.get('/track', (req, res) => res.sendFile(path.join(__dirname, 'public', 'track.html')));
app.get('/rider', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rider.html')));
app.get('/rider-register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rider-register.html')));
app.get('/approve-restaurants', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-owners.html')));
app.get('/logout', (req, res) => res.redirect('/'));
app.get('/restaurant-register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-register.html')));
app.get('/restaurant-login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-login.html')));
app.get('/restaurant-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-dashboard.html')));
app.get('/restaurant-profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restaurant-profile.html')));

// YE 5 NAYE ADD KIYE
app.get('/myorder', (req, res) => res.sendFile(path.join(__dirname, 'public', 'myorder.html')));
app.get('/order-details', (req, res) => res.sendFile(path.join(__dirname, 'public', 'order-details.html')));
app.get('/payment', (req, res) => res.sendFile(path.join(__dirname, 'public', 'payment.html')));
app.get('/bill-template', (req, res) => res.sendFile(path.join(__dirname, 'public', 'bill-template.html')));
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ===== INVOICE API =====
app.get('/invoice', async (req,res)=>{ const { id } = req.query; const order = await Order.findOne({trackId:id}); if(!order) return res.status(404).send("Order not found"); const doc = new PDFDocument({margin: 40}); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename=Eat4Bite-${id}.pdf`); doc.pipe(res); doc.fontSize(22).text('EAT4BITE™', {align: 'center'}); doc.fontSize(10).text(`Order ID: ${order.trackId}`, {align: 'center'}); doc.moveDown(); doc.text('-------------------------------------------'); order.items.forEach(i=>{ doc.text(`${i.name} x ${i.qty} ₹${i.price*i.qty}`); }); doc.text('-------------------------------------------'); doc.text(`Sub Total: ₹${order.item_total}`); doc.text(`Grand Total: ₹${order.grand_total}`); doc.end(); });

server.listen(PORT, ()=> console.log(`🚀 Server v3.9.0 FIXED 42 API + 18 PAGES on ${PORT}`));