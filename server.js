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

cloudinary.config({cloud_name: process.env.CLOUDINARY_CLOUD_NAME,api_key: process.env.CLOUDINARY_API_KEY,api_secret: process.env.CLOUDINARY_API_SECRET});

const upload = multer({ storage: multer.memoryStorage() });
const uploadRider = multer({ storage: multer.memoryStorage() });
if (!fs.existsSync('./uploads')){ fs.mkdirSync('./uploads'); }

app.use(cors({origin: "*"}));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URL).then(()=>console.log('✅ MongoDB Connected v3.9.4 FINAL')).catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// MODELS
const MenuItem = mongoose.model('MenuItem', {name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String, default: 'default-shop'}});
const RestaurantOwner = mongoose.model('RestaurantOwner', {restaurantId: {type: String, unique: true},restaurantName: String, ownerName: String, mobile: {type: String, unique: true},email: {type: String, unique: true}, address: String, password: String,status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"},registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null},image: {type: String, default: null}, upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"},trial_end_date: {type: Date}, payout_due: {type: Number, default: 0}, createdAt: {type: Date, default: Date.now}});
const Rider = mongoose.model('Rider', {name:String, fatherName:String, aadhar:String, pan:String, mobile:{type:String, unique:true},aadharImg: String, panImg: String, photoImg: String, lat:Number, lng:Number, lastUpdate:Date,status:{type:String, default:"Pending"}, restaurantId: {type: String},cash_balance: {type: Number, default: 0}, cashLimit: {type: Number, default: 1000}});
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_5: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 30},grand_total: {type: Number, default: 0}, total:Number, paymentMode:String, cashCollected: {type: Number, default: 0},payout_status: {type: String, default: "Pending"},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number,shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, riderName: String, restaurantId: {type: String, default: 'default-shop'}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);
const Offer = mongoose.model('Offer', {code:String, discount:Number, type:{type:String, default:"PERCENT"}, restaurantId:String, createdAt:{type:Date, default:Date.now}});
const Banner = mongoose.model('Banner', {text: String, image: String, color: String, updatedAt: {type: Date, default: Date.now}});

async function sendWhatsApp(to, message) {console.log(`📲 WHATSAPP TO ${to}: ${message}`);}

io.on('connection', (socket) => {socket.on('riderLocation', async (data) => {await Rider.findOneAndUpdate({mobile: data.mobile}, {lat: data.lat, lng: data.lng, lastUpdate: new Date()});await Order.updateMany({riderId: data.mobile, status: "Out for Delivery"}, {riderLat: data.lat, riderLng: data.lng});io.emit('locationUpdate', {riderId: data.mobile, lat: data.lat, lng: data.lng});});

function calculateBill(item_total) {const commission_5 = Math.round(item_total * 0.05);const platform_fee = 10; const delivery_fee = 30;const grand_total = item_total + commission_5 + platform_fee + delivery_fee;return {item_total, commission_5, platform_fee, delivery_fee, grand_total, cash_to_restaurant: item_total};}

// ROUTES IMPORT
const apiRoutes = require('./routes');
app.use('/api', apiRoutes(io, {Order, Rider, RestaurantOwner, MenuItem, Offer, Banner, upload, uploadRider, cloudinary, sendWhatsApp, calculateBill}));

// PAGES
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
app.get('/invoice', async (req,res)=>{ const { id } = req.query; const order = await Order.findOne({trackId:id}); if(!order) return res.status(404).send("Order not found"); const doc = new PDFDocument({margin: 40}); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename=Eat4Bite-${id}.pdf`); doc.pipe(res); doc.fontSize(22).text('EAT4BITE™', {align: 'center'}); doc.fontSize(10).text(`Order ID: ${order.trackId}`, {align: 'center'}); doc.moveDown(); doc.text('-------------------------------------------'); order.items.forEach(i=>{ doc.text(`${i.name} x ${i.qty} ₹${i.price*i.qty}`); }); doc.text('-------------------------------------------'); doc.text(`Sub Total: ₹${order.item_total}`); doc.text(`Grand Total: ₹${order.grand_total}`); doc.end(); });

server.listen(PORT, ()=> console.log(`🚀 Server v3.9.4 FINAL on ${PORT}`));