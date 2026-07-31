const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DB Connect
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/order', require('./routes/order.routes'));

// Pages
app.get('/', (req,res)=> res.sendFile(path.join(__dirname, 'public/customer/index.html')));
app.get('/admin', (req,res)=> res.sendFile(path.join(__dirname, 'public/admin.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));