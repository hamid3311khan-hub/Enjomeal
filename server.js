require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: {origin: "*"} });
const PORT = process.env.PORT || 10000;

if (!fs.existsSync('./uploads')){ fs.mkdirSync('./uploads'); }

app.use(cors({origin: "*"}));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('✅ MongoDB Connected v4.0'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// MODELS
const MenuItem = mongoose.model('MenuItem', {name: String, price: Number, category: String, desc: String,image: String, veg: Boolean, inStock: {type:Boolean, default:true}, offer: Number,restaurantId: {type: String, default: 'default-shop'}});
const RestaurantOwner = mongoose.model('RestaurantOwner', {restaurantId: {type: String, unique: true}, restaurantName: String, ownerName: String,mobile: {type: String, unique: true}, email: {type: String, unique: true}, address: String,password: String, status: {type: String, default: "Pending"}, plan_status: {type: String, default: "Trial"},registration_fee_paid: {type: Number, default: 200}, payment_proof: {type: String, default: null},image_base64: {type: String, default: null},upi_id: {type: String, default: "tanbalkhi2014-3@okhdfcbank"},trial_end_date: {type: Date}, payout_due: {type: Number, default: 0},paymentStatus: {type: String, default: "Paid"}, lastPaymentDate: {type: Date, default: Date.now},nextDueDate: {type: Date}, createdAt: {type: Date, default: Date.now}});
const Rider = mongoose.model('Rider', {name:String, fatherName:String, aadhar:String, pan:String,mobile:{type:String, unique:true}, aadharImg: String, panImg: String, photoImg: String,lat:Number, lng:Number, lastUpdate:Date, status:{type:String, default:"Pending"},restaurantId: {type: String}, cash_balance: {type: Number, default: 0},cashLimit: {type: Number, default: 1000},weekly_orders: {type: Number, default: 0}, weekly_bonus: {type: Number, default: 0}});
const OrderSchema = new mongoose.Schema({trackId: String, name:String, phone:String, address:String, items:[],item_total: {type: Number, default: 0}, commission_5: {type: Number, default: 0},platform_fee: {type: Number, default: 10}, delivery_fee: {type: Number, default: 30},total:Number, cash_to_restaurant: {type: Number, default: 0},paymentMode:String, cashCollected: {type: Number, default: 0},status:{type:String, default:'Pending'},riderLat:Number, riderLng:Number, pointsEarned:Number,coupon:String, discount:Number, shopLat: {type:Number, default: 25.5941}, shopLng: {type:Number, default: 85.1376},custLat: Number, custLng: Number, riderId: String, restaurantId: {type: String, default: 'default-shop'},cash_deposited: {type: Boolean, default: false}, cash_deposit_proof: {type: String, default: null},is_peak: {type: Boolean, default: false}}, {timestamps: true});
const Order = mongoose.model('Order', OrderSchema);
const Offer = mongoose.model('Offer', {code:String, discount:Number, type:{type:String, default:"PERCENT"}, restaurantId:String, createdAt:{type:Date, default:Date.now}});

// SOCKET
io.on('connection', (socket) => {
    socket.on('riderLocation', async (data) => {
        await Rider.findOneAndUpdate({mobile: data.mobile}, {lat: data.lat, lng: data.lng, lastUpdate: new Date()});
        await Order.updateMany({riderId: data.mobile, status: "Out for Delivery"}, {riderLat: data.lat, riderLng: data.lng});
        io.emit('locationUpdate', {riderId: data.mobile, lat: data.lat, lng: data.lng});
    });
});

// ROUTES IMPORT
const routes = require('./routes');
app.use('/api', routes(app, io, {MenuItem, RestaurantOwner, Rider, Order, Offer}));

server.listen(PORT, ()=> console.log(`🚀 Server v4.0 on ${PORT}`));