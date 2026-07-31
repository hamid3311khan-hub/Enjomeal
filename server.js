const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DB Connect
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/order', require('./routes/order.routes'));

// Customer Pages
app.get('/', (req,res)=> {
  res.sendFile(path.join(__dirname, 'public/customer/index.html'));
});

app.get('/checkout', (req,res)=> {
  res.sendFile(path.join(__dirname, 'public/customer/checkout.html'));
});

// Admin Pages
app.get('/admin', (req,res)=> {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get('/admin/admin-orders.html', (req,res)=> {
  res.sendFile(path.join(__dirname, 'public/admin/admin-orders.html'));
});

// 404
app.use((req,res)=>{
  res.status(404).send('Page Not Found');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log(`Eat4Bite v2.0 Running on ${PORT}`));
