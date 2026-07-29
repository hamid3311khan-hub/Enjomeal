const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // FIX 2

const upload = multer({ storage: multer.memoryStorage() });
const uploadRider = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function sendWhatsApp(to, message) {console.log(`📲 WHATSAPP TO ${to}: ${message}`);}

function calculateBill(item_total) {
  const commission_5 = Math.round(item_total * 0.05);
  const platform_fee = 10;
  const delivery_fee = 30;
  const grand_total = item_total + commission_5 + platform_fee + delivery_fee;
  return {item_total, commission_5, platform_fee, delivery_fee, grand_total, cash_to_restaurant: item_total};
}

// ===== MODELS =====
const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String, default: 'default-shop'}}, {timestamps: true}));
const RestaurantOwner = mongoose.model('RestaurantOwner', new mongoose.Schema({restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String, mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String, password: String, status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"}, registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null}, image: {type: String, default: null}, upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"}, trial_end_date: {type: Date}, payout_due: {type: Number, default: 0}, createdAt: {type: Date, default: Date.now}}));
const Rider = mongoose.model('Rider', new mongoose.Schema({name:String, mobile:{type:String, unique:true}, email:String, password:String, address:String, vehicleNo:String, aadharImg: String, dlProof: String, status:{type:String, default:"Pending"}, lat:Number, lng:Number, lastUpdate:Date, restaurantId: {type: String}, cash_balance: {type: Number, default: 0}, cashLimit: {type: Number, default: 1000}})); // FIX 4
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_5: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 30},grand_total: {type: Number, default: 0}, total:Number, paymentMode:String, cashCollected: {type: Number, default: 0},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number,shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, riderName: String, restaurantId: {type: String, default: 'default-shop'}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);
const Offer = mongoose.model('Offer', new mongoose.Schema({code:String, discount:Number, type:{type:String, default:"PERCENT"}, restaurantId:String, createdAt:{type:Date, default:Date.now}}));
const Banner = mongoose.model('Banner', new mongoose.Schema({text: String, image: String, color: String, updatedAt: {type: Date, default: Date.now}}));

// ===== API ROUTES - MENU =====
router.post('/api/menu', upload.single('image'), async (req,res)=>{try{let imageUrl=null; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite"}); imageUrl=result.secure_url;} const {name,price,category,desc,veg,offer,restaurantId}=req.body; const item=new MenuItem({name,price,category,desc,image:imageUrl,veg:veg==="true",offer,restaurantId}); await item.save(); res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
router.get('/api/menu', async (req,res)=>{const shopId=req.query.shop||'default-shop'; res.json(await MenuItem.find({restaurantId:shopId}))});
router.get('/api/menu/:restaurantId', async (req,res)=>{res.json(await MenuItem.find({restaurantId:req.params.restaurantId}))}); // FIX 3
router.post('/api/menu-add', upload.single('image'), async (req,res)=>{try{let imageUrl=null; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite"}); imageUrl=result.secure_url;} const item = new MenuItem({...req.body, image:imageUrl}); await item.save(); res.json({success:true})}catch(e){res.status(500).json({error:e.message})}}); // FIX 3
router.delete('/api/menu-delete/:id', async (req,res)=>{await MenuItem.findByIdAndDelete(req.params.id); res.json({success:true})}); // FIX 3

// ===== API ROUTES - RESTAURANT =====
router.post('/api/restaurant-register', upload.single('image'), async (req,res)=>{try{let imageUrl=null; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite_restaurants"}); imageUrl=result.secure_url;} const {restaurantId,restaurantName,ownerName,mobile,email,address,password,plan_status,registration_fee_paid}=req.body; const hashedPassword = await bcrypt.hash(password, 10); // FIX 6
const trialEnd=new Date(); trialEnd.setDate(trialEnd.getDate()+30); 
const restaurant=new RestaurantOwner({restaurantId,restaurantName,ownerName,mobile,email,address,password:hashedPassword,plan_status,registration_fee_paid,image:imageUrl,trial_end_date:trialEnd}); 
await restaurant.save(); res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
router.post('/api/restaurant-login', async (req,res)=>{const {restaurantId,password}=req.body; const restaurant=await RestaurantOwner.findOne({restaurantId}); if(!restaurant)return res.status(401).json({error:"Invalid"}); const match = await bcrypt.compare(password, restaurant.password); if(!match)return res.status(401).json({error:"Invalid Password"}); // FIX 6
if(restaurant.status!=="Approved")return res.status(403).json({error:`Status: ${restaurant.status}`}); res.json({success:true,restaurant});});
router.post('/api/restaurant-update', upload.single('image'), async (req,res)=>{try{let update = {...req.body}; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite_restaurants"}); update.image = result.secure_url;} const owner = await RestaurantOwner.findOneAndUpdate({restaurantId:req.body.restaurantId}, update, {new:true}); res.json({success:true, owner})}catch(e){res.status(500).json({error:e.message})}}); // FIX 3

// ===== API ROUTES - RIDER =====
router.post('/api/rider-register', uploadRider.fields([{name:'dlProof'},{name:'aadhaarProof'}]), async (req,res)=>{try{ // FIX 4
    let dlUrl=null, aadhaarUrl=null;
    if(req.files.dlProof){const result=await cloudinary.uploader.upload(`data:image/jpeg;base64,${req.files.dlProof[0].buffer.toString('base64')}`,{folder:"quickbite_riders"}); dlUrl=result.secure_url;}
    if(req.files.aadhaarProof){const result=await cloudinary.uploader.upload(`data:image/jpeg;base64,${req.files.aadhaarProof[0].buffer.toString('base64')}`,{folder:"quickbite_riders"}); aadhaarUrl=result.secure_url;}
    const {name,mobile,email,password,address,vehicleNo} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newRider = new Rider({name,mobile,email,password:hashedPassword,address,vehicleNo,dlProof:dlUrl,aadharImg:aadhaarUrl,status:'Pending',cash_balance:0}); // FIX 4
    await newRider.save(); res.json({success:true});
}catch(e){res.status(500).json({error:e.message})}});
router.post('/api/rider-login', async (req,res)=>{const {mobile,password}=req.body; const rider=await Rider.findOne({mobile}); if(!rider) return res.json({error:'Rider not found'}); if(rider.status!=="Approved")return res.json({error:"Not Approved"}); const match = await bcrypt.compare(password, rider.password); if(!match) return res.json({error:'Invalid Password'}); res.json({success:true,rider});}); // FIX 6
router.post('/api/rider/accept-order', async (req,res)=>{ // NEW
    const {orderId, riderId, riderName} = req.body;
    await Order.findByIdAndUpdate(orderId, {status:"Out for Delivery", riderId, riderName});
    res.json({success:true})
});
router.post('/api/rider/deposit-cash', async (req,res)=>{const {riderId,amount}=req.body; await Rider.findOneAndUpdate({mobile:riderId},{$inc:{cash_balance:-amount}}); res.json({success:true, msg:"Deposit Request Sent"})});

// ===== API ROUTES - ORDER =====
router.post('/api/orders', async (req,res)=>{try{const bill=calculateBill(req.body.item_total); const order=new Order({...req.body,...bill}); await order.save(); sendWhatsApp(order.phone,`Order ${order.trackId} received. Total: ₹${order.grand_total}`); res.json(order);}catch(e){res.status(500).json({error:e.message})}});
router.get('/api/orders', async (req,res)=>{const {restaurantId}=req.query; res.json(await Order.find({restaurantId}).sort({createdAt:-1}))});
router.get('/api/orders/track/:id', async (req,res)=>{res.json(await Order.findOne({trackId:req.params.id}))}); // FIX 5 NEW
router.get('/api/orders/history/:phone', async (req,res)=>{res.json(await Order.find({phone:req.params.phone}).sort({createdAt:-1}))}); // FIX 5 NEW
router.put('/api/orders/:id/status', async (req,res)=>{const {status,riderId,riderName}=req.body; const update={status}; if(riderId){update.riderId=riderId; update.riderName=riderName;} await Order.findByIdAndUpdate(req.params.id,update); res.json({success:true})});
router.post('/api/order-delivered', async (req,res)=>{const {orderId}=req.body; const order=await Order.findById(orderId); if(order.paymentMode==="Cash"){await Rider.findOneAndUpdate({mobile:order.riderId},{$inc:{cash_balance:order.grand_total}});} order.status="Delivered"; await order.save(); res.json({success:true});});
const io = req.app.get('io');
io.emit('newOrder', order); // sab restaurant ko broadcast

// ===== API ROUTES - ADMIN =====
router.get('/api/admin/pending-restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Pending"}))});
router.put('/api/admin/approve-restaurant/:id', async (req,res)=>{await RestaurantOwner.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});
router.get('/api/admin/pending-riders', async (req,res)=>{res.json(await Rider.find({status:"Pending"}))});
router.put('/api/admin/approve-rider/:id', async (req,res)=>{await Rider.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});
router.get('/api/admin/restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Approved"}))});

// ===== PAGE ROUTES =====
router.get('/', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'home.html')));
router.get('/restaurants', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurants.html')));
router.get('/cart', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'cart.html')));
router.get('/track', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'track.html')));
router.get('/myorder', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'myorder.html')));
router.get('/order-details', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'order-details.html')));
router.get('/payment', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'payment.html')));
router.get('/rider', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'rider.html')));
router.get('/rider-register', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'rider-register.html')));
router.get('/restaurant-login', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-login.html')));
router.get('/restaurant-register', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-register.html')));
router.get('/restaurant-dashboard', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-dashboard.html')));
router.get('/restaurant-profile', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'restaurant-profile.html')));
router.get('/admin', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'admin.html')));
router.get('/admin-restaurants', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'admin-restaurants.html')));

// ===== INVOICE PDF =====
router.get('/invoice/:id', async (req,res)=>{const order=await Order.findOne({trackId:req.params.id}); if(!order) return res.status(404).send("Order not found"); // FIX 7
const doc=new PDFDocument(); res.setHeader('Content-disposition',`attachment; filename=invoice-${order.trackId}.pdf`); res.setHeader('Content-type','application/pdf'); doc.pipe(res); doc.fontSize(20).text('Eat4Bite Invoice',100,100); doc.text(`Order: ${order.trackId}`,100,130); doc.text(`Total: ₹${order.grand_total}`,100,150); doc.end();});

// ===== SOCKET IO =====
module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('riderLocation', async (data) => { // FIX 8
      await Rider.findOneAndUpdate({mobile: data.riderId}, {lat: data.lat, lng: data.lng, lastUpdate: new Date()});
      await Order.updateMany({riderId: data.riderId, status: "Out for Delivery"}, {riderLat: data.lat, riderLng: data.lng});
      io.emit('locationUpdate', {riderId: data.riderId, lat: data.lat, lng: data.lng});
    });
  });
  return router;
}
router.post('/api/admin/pay-payout', async (req,res)=>{
  const {restaurantId, amount} = req.body;
  await RestaurantOwner.findOneAndUpdate(
    {restaurantId}, 
    {$inc: {payout_due: -amount}} // paise kam kar do
  );
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