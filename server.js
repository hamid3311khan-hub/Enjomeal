const express = require('express'); 
const mongoose = require('mongoose'); 
const multer = require('multer'); 
const http = require('http');
const { Server } = require("socket.io");
const Razorpay = require('razorpay'); // upar le aaya
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json()); 
app.use(express.static('public')); // . ki jagah public kar de
app.use('/uploads',express.static('uploads'));
const upload = multer({dest:'uploads/'});

mongoose.connect('mongodb://127.0.0.1:27017/eat4bite');

const razorpay = new Razorpay({key_id: 'rzp_test_XXXX', key_secret: 'XXXX'}); // key yaha

const Restaurant = mongoose.model('Restaurant',{restaurantName:String,phone:String,address:String,password:String,image:String,status:String});
const Rider = mongoose.model('Rider',{name:String,phone:String,email:String,password:String,vehicle:String,dlProof:String,aadharImg:String,status:String,riderLat:Number,riderLng:Number});
const Order = mongoose.model('Order',{trackId:String,restaurantId:String,restaurantName:String,items:Array,address:String,phone:String,customerName:String,grand_total:Number,status:String,riderId:String,riderName:String,shopLat:Number,shopLng:Number,custLat:Number,custLng:Number,riderLat:Number,riderLng:Number});
const MenuItem = mongoose.model('MenuItem',{restaurantId:String,name:String,price:Number}); // DB menu

io.on('connection', (socket)=>{ socket.on('joinOrderRoom', (trackId)=>{ socket.join(trackId) }) });

app.post('/api/restaurant/register',upload.single('image'),async(req,res)=>{const r=new Restaurant({...req.body,image:req.file?`/uploads/${req.file.filename}`:'',status:'Pending'});await r.save();res.json({success:true})});
app.post('/api/restaurant/login',async(req,res)=>{const r=await Restaurant.findOne(req.body);res.json({success:!!r,restaurant:r})});
app.get('/api/restaurants',async(req,res)=>{res.json(await Restaurant.find({status:'Approved'}))});
app.get('/api/admin/restaurants',async(req,res)=>{res.json(await Restaurant.find())});
app.post('/api/admin/restaurant/approve',async(req,res)=>{await Restaurant.findByIdAndUpdate(req.body.restaurantId,{status:'Approved'});res.json({success:true})});
app.post('/api/admin/restaurant/reject',async(req,res)=>{await Restaurant.findByIdAndUpdate(req.body.restaurantId,{status:'Rejected'});res.json({success:true})});

app.post('/api/rider/register',upload.fields([{name:'dlProof'},{name:'aadharImg'}]),async(req,res)=>{const r=new Rider({...req.body,dlProof:`/uploads/${req.files.dlProof[0].filename}`,aadharImg:`/uploads/${req.files.aadharImg[0].filename}`,status:'pending'});await r.save();res.json({success:true})});
app.post('/api/rider/login',async(req,res)=>{const r=await Rider.findOne({...req.body,status:'Approved'});res.json({success:!!r,rider:r})});
app.get('/api/admin/riders',async(req,res)=>{res.json(await Rider.find())});
app.post('/api/admin/rider/approve',async(req,res)=>{await Rider.findByIdAndUpdate(req.body.riderId,{status:'Approved'});res.json({success:true})});
app.post('/api/admin/rider/reject',async(req,res)=>{await Rider.findByIdAndUpdate(req.body.riderId,{status:'Rejected'});res.json({success:true})});

// MENU - Sirf DB wala rakha, hardcoded hata diya
app.get('/api/menu/:id', async(req,res)=>{const restaurant = await Restaurant.findById(req.params.id); const items = await MenuItem.find({restaurantId:req.params.id}); res.json({...restaurant._doc, items})});
app.post('/api/menu/add',async(req,res)=>{const m=new MenuItem(req.body); await m.save(); res.json({success:true})});
app.delete('/api/menu/delete/:id',async(req,res)=>{await MenuItem.findByIdAndDelete(req.params.id); res.json({success:true})});

app.post('/api/order/create-razorpay', async(req,res)=>{const options={amount:req.body.amount*100,currency:"INR"}; const order=await razorpay.orders.create(options); res.json(order)});

app.post('/api/order/place',async(req,res)=>{const trackId='EB'+Date.now();const o=new Order({...req.body,trackId,status:'pending',shopLat:23.6357,shopLng:85.1920,custLat:23.6357,custLng:85.1920});await o.save();res.json({success:true,trackId})});
app.get('/api/track/:id',async(req,res)=>{res.json(await Order.findOne({trackId:req.params.id}))});
app.get('/api/orders/phone/:phone',async(req,res)=>{res.json(await Order.find({phone:req.params.phone}).sort({_id:-1}))});
app.get('/api/orders/restaurant/:id',async(req,res)=>{res.json(await Order.find({restaurantId:req.params.id,status:{$ne:'delivered'}}))});
app.get('/api/orders/available',async(req,res)=>{res.json(await Order.find({status:'ready',riderId:null}))});

app.post('/api/order/status',async(req,res)=>{const order = await Order.findByIdAndUpdate(req.body.orderId,{status:req.body.status},{new:true});io.to(order.trackId).emit('orderStatusUpdate', {trackId: order.trackId, status: order.status});res.json({success:true})});
app.post('/api/rider/accept-order',async(req,res)=>{const order = await Order.findByIdAndUpdate(req.body.orderId,{riderId:req.body.riderId,riderName:req.body.riderName,status:'outfordelivery'},{new:true});io.to(order.trackId).emit('orderStatusUpdate', {trackId: order.trackId, status: 'outfordelivery'});res.json({success:true})});

// RIDER LOCATION - Sirf riderId wala rakha. Auto GPS ke liye
app.post('/api/rider/update-location',async(req,res)=>{
  const {riderId, lat, lng} = req.body; 
  await Rider.findByIdAndUpdate(riderId, {riderLat: lat, riderLng: lng}); 
  const orders = await Order.find({riderId, status:'outfordelivery'}); 
  orders.forEach(o=>io.to(o.trackId).emit('riderLocationUpdate', {trackId: o.trackId, lat, lng})); 
  res.json({success:true})
});

server.listen(3000,()=>console.log("Eat4Bite v2.0 Running on http://localhost:3000"));