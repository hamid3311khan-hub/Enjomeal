require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// ===== FIREBASE ADD KIYA =====
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eat4bite-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db = admin.database();
// ==============================

const app = express();
const server = http.createServer(app);
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
.then(()=>console.log('✅ MongoDB Connected v3.9.0 - Firebase Added'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) }); // FIX: process.exit

// ... beech ka sab code same rahega ...

// ===== PAGE ROUTES =====
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

// ===== INVOICE FIX KIYA =====
app.get('/invoice', async (req,res)=>{ 
  const { id } = req.query; 
  const order = await Order.findOne({trackId:id}); 
  if(!order) return res.status(404).send("Order not found"); 
  const doc = new PDFDocument({margin: 40}); 
  res.setHeader('Content-Type', 'application/pdf'); 
  res.setHeader('Content-Disposition', `attachment; filename=Eat4Bite-${id}.pdf`); 
  doc.pipe(res); 
  doc.fontSize(22).text('EAT4BITE', {align: 'center'}); // ™ hata diya
  doc.fontSize(10).text(`Order ID: ${order.trackId}`, {align: 'center'}); 
  doc.moveDown(); 
  doc.text('-------------------------------------------'); // line complete ki
  order.items.forEach(i=>{ doc.text(`${i.name} x ${i.qty} ₹${i.price*i.qty}`); }); 
  doc.text('-------------------------------------------'); 
  doc.text(`Sub Total: ₹${order.item_total}`); 
  doc.text(`Grand Total: ₹${order.grand_total}`); 
  doc.end(); 
});

server.listen(PORT, ()=> console.log(`🚀 Server v3.9.0 Firebase on ${PORT}`));