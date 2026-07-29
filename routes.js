const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

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
const Rider = mongoose.model('Rider', new mongoose.Schema({name:String, fatherName:String, aadhar:String, pan:String,mobile:{type:String, unique:true}, aadharImg: String, panImg: String, photoImg: String,lat:Number, lng:Number, lastUpdate:Date, status:{type:String, default:"Pending"},restaurantId: {type: String}, cash_balance: {type: Number, default: 0},cashLimit: {type: Number, default: 1000}}));
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_5: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 30},grand_total: {type: Number, default: 0}, total:Number, paymentMode:String, cashCollected: {type: Number, default: 0},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number,shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, riderName: String, restaurantId: {type: String, default: 'default-shop'}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);
const Offer = mongoose.model('Offer', new mongoose.Schema({code:String, discount:Number, type:{type:String, default:"PERCENT"}, restaurantId:String, createdAt:{type:Date, default:Date.now}}));
const Banner = mongoose.model('Banner', new mongoose.Schema({text: String, image: String, color: String, updatedAt: {type: Date, default: Date.now}}));

// ===== API ROUTES - MENU =====
router.post('/api/menu', upload.single('image'), async (req,res)=>{try{let imageUrl=null; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite"}); imageUrl=result.secure_url;} const {name,price,category,desc,veg,offer,restaurantId}=req.body; const item=new MenuItem({name,price,category,desc,image:imageUrl,veg:veg==="true",offer,restaurantId}); await item.save(); res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
router.put('/api/menu/:id', upload.single('image'), async (req,res)=>{try{let updateData={...req.body}; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite"}); updateData.image=result.secure_url;} updateData.veg=req.body.veg==="true"; await MenuItem.findByIdAndUpdate(req.params.id,updateData); res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
router.delete('/api/menu/:id', async (req,res)=>{await MenuItem.findByIdAndDelete(req.params.id); res.json({success:true})});
router.get('/api/menu', async (req,res)=>{const shopId=req.query.shop||'default-shop'; res.json(await MenuItem.find({restaurantId:shopId}))});
router.put('/api/menu/:id/stock', async (req,res)=>{const {inStock}=req.body; await MenuItem.findByIdAndUpdate(req.params.id,{inStock}); res.json({success:true})});

// ===== API ROUTES - RESTAURANT =====
router.post('/api/restaurant-register', upload.single('image'), async (req,res)=>{try{let imageUrl=null; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite_restaurants"}); imageUrl=result.secure_url;} const {restaurantId,restaurantName,ownerName,mobile,email,address,password,upi_id}=req.body; const trialEnd=new Date(); trialEnd.setDate(trialEnd.getDate()+7); const restaurant=new RestaurantOwner({restaurantId,restaurantName,ownerName,mobile,email,address,password,upi_id,image:imageUrl,trial_end_date:trialEnd}); await restaurant.save(); res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
router.post('/api/restaurant-login', async (req,res)=>{const {restaurantId,password}=req.body; const restaurant=await RestaurantOwner.findOne({restaurantId,password}); if(!restaurant)return res.status(401).json({error:"Invalid"}); if(restaurant.status!=="Approved")return res.status(403).json({error:`Status: ${restaurant.status}`}); res.json({success:true,restaurant});});
router.get('/api/restaurant/ledger', async (req,res)=>{const {restaurantId}=req.query; const restaurant=await RestaurantOwner.findOne({restaurantId}); const orders=await Order.find({restaurantId,status:"Delivered"}); const totalSales=orders.reduce((sum,o)=>sum+o.item_total,0); const totalCommission=orders.reduce((sum,o)=>sum+o.commission_5,0); res.json({restaurant,payout_due:restaurant.payout_due,totalSales,totalCommission});});
router.post('/api/restaurant/payout', async (req,res)=>{const {restaurantId,amount}=req.body; await RestaurantOwner.findOneAndUpdate({restaurantId},{$inc:{payout_due:-amount}}); res.json({success:true});});
router.post('/api/restaurant/cash-confirm', async (req,res)=>{const {orderId}=req.body; const order=await Order.findById(orderId); await RestaurantOwner.findOneAndUpdate({restaurantId:order.restaurantId},{$inc:{payout_due:order.item_total}}); order.cashCollected=order.grand_total; await order.save(); res.json({success:true});});
router.post('/api/restaurant/offer', async (req,res)=>{const offer=new Offer(req.body); await offer.save(); res.json({success:true})});
router.get('/api/restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Approved"}))});

// ===== API ROUTES - RIDER =====
router.post('/api/rider-register', uploadRider.fields([{name:'aadhar'},{name:'pan'},{name:'photo'}]), async (req,res)=>{try{const files=req.files; const aadharUrl=(await cloudinary.uploader.upload(`data:image/jpeg;base64,${files.aadhar[0].buffer.toString('base64')}`,{folder:"quickbite_riders"})).secure_url; const panUrl=(await cloudinary.uploader.upload(`data:image/jpeg;base64,${files.pan[0].buffer.toString('base64')}`,{folder:"quickbite_riders"})).secure_url; const photoUrl=(await cloudinary.uploader.upload(`data:image/jpeg;base64,${files.photo[0].buffer.toString('base64')}`,{folder:"quickbite_riders"})).secure_url; const rider=new Rider({...req.body,aadharImg:aadharUrl,panImg:panUrl,photoImg:photoUrl}); await rider.save(); res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
router.post('/api/rider-login', async (req,res)=>{const {mobile}=req.body; const rider=await Rider.findOne({mobile}); if(!rider||rider.status!=="Approved")return res.status(401).json({error:"Not Approved"}); res.json({success:true,rider});});
router.get('/api/riders', async (req,res)=>{res.json(await Rider.find())});
router.get('/api/rider-orders/:mobile', async (req,res)=>{res.json(await Order.find({riderId:req.params.mobile}))});
router.get('/api/rider/ledger', async (req,res)=>{const {mobile}=req.query; const rider=await Rider.findOne({mobile}); res.json({cash_balance:rider.cash_balance,cashLimit:rider.cashLimit});});

// ===== API ROUTES - ORDER =====
router.post('/api/orders', async (req,res)=>{try{const bill=calculateBill(req.body.item_total); const order=new Order({...req.body,...bill}); await order.save(); sendWhatsApp(order.phone,`Order ${order.trackId} received. Total: ₹${order.grand_total}`); res.json(order);}catch(e){res.status(500).json({error:e.message})}});
router.get('/api/orders', async (req,res)=>{const {restaurantId}=req.query; res.json(await Order.find({restaurantId}).sort({createdAt:-1}))});
router.put('/api/orders/:id/status', async (req,res)=>{const {status,riderId,riderName}=req.body; const update={status}; if(riderId){update.riderId=riderId; update.riderName=riderName;} await Order.findByIdAndUpdate(req.params.id,update); res.json({success:true})});
router.post('/api/order-delivered', async (req,res)=>{const {orderId}=req.body; const order=await Order.findById(orderId); if(order.paymentMode==="Cash"){await Rider.findOneAndUpdate({mobile:order.riderId},{$inc:{cash_balance:order.grand_total}});} order.status="Delivered"; await order.save(); res.json({success:true});});
router.get('/api/report', async (req,res)=>{const {restaurantId,startDate,endDate}=req.query; res.json(await Order.find({restaurantId,status:"Delivered",createdAt:{$gte:new Date(startDate),$lte:new Date(endDate)}}))});

// ===== API ROUTES - ADMIN =====
router.get('/api/admin/pending-restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Pending"}))});
router.get('/api/admin/pending-riders', async (req,res)=>{res.json(await Rider.find({status:"Pending"}))});
router.put('/api/admin/approve-restaurant/:id', async (req,res)=>{await RestaurantOwner.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});
router.put('/api/admin/reject-restaurant/:id', async (req,res)=>{await RestaurantOwner.findByIdAndUpdate(req.params.id,{status:"Rejected"}); res.json({success:true})});
router.get('/api/admin/all-restaurants', async (req,res)=>{res.json(await RestaurantOwner.find())});
router.put('/api/admin/approve-rider/:id', async (req,res)=>{await Rider.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});
router.get('/api/admin/restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Approved"}))});
router.get('/api/admin/approved-riders', async (req,res)=>{res.json(await Rider.find({status:"Approved"}))});
router.post('/api/admin/assign-rider', async (req,res)=>{const {orderId,riderId}=req.body; const rider=await Rider.findOne({mobile:riderId}); await Order.findByIdAndUpdate(orderId,{riderId,status:"Out for Delivery",riderName:rider.name}); res.json({success:true})});
router.get('/api/admin/graph', async (req,res)=>{const orders=await Order.find({status:"Delivered"}); res.json(orders)});
router.get('/api/admin/rider-cash', async (req,res)=>{res.json(await Rider.find())});
router.post('/api/admin/rider-deposit', async (req,res)=>{const {riderId,amount}=req.body; await Rider.findOneAndUpdate({mobile:riderId},{$inc:{cash_balance:-amount}}); res.json({success:true})});

// ===== API ROUTES - BANNER/COUPON =====
router.get('/api/admin/promo', async (req,res)=>{res.json(await Banner.findOne().sort({updatedAt:-1}))});
router.post('/api/admin/promo', upload.single('image'), async (req,res)=>{try{let imageUrl=null; if(req.file){const result=await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,{folder:"quickbite_banners"}); imageUrl=result.secure_url;} await Banner.findOneAndUpdate({},{text:req.body.text,image:imageUrl,color:req.body.color},{upsert:true}); res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
router.delete('/api/admin/promo', async (req,res)=>{await Banner.deleteMany(); res.json({success:true})});
router.get('/api/coupon/validate', async (req,res)=>{res.json({valid:true,discount:10})});
router.post('/api/coupon/validate', async (req,res)=>{res.json({valid:true,discount:10})});
router.post('/api/broadcast', async (req,res)=>{res.json({success:true})});

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
router.get('/invoice/:id', async (req,res)=>{const order=await Order.findById(req.params.id); const doc=new PDFDocument(); res.setHeader('Content-disposition',`attachment; filename=invoice-${order.trackId}.pdf`); res.setHeader('Content-type','application/pdf'); doc.pipe(res); doc.fontSize(20).text('QuickBite Invoice',100,100); doc.text(`Order: ${order.trackId}`,100,130); doc.text(`Total: ₹${order.grand_total}`,100,150); doc.end();});

// ===== SOCKET IO =====
module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('riderLocation', async (data) => {
      await Rider.findOneAndUpdate({mobile: data.mobile}, {lat: data.lat, lng: data.lng, lastUpdate: new Date()});
      await Order.updateMany({riderId: data.mobile, status: "Out for Delivery"}, {riderLat: data.lat, riderLng: data.lng});
      io.emit('locationUpdate', {riderId: data.mobile, lat: data.lat, lng: data.lng});
    });
  });
  return router;
}