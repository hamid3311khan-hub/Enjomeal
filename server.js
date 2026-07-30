require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: {origin: "*"} });
const PORT = process.env.PORT || 10000;

// Upload folder
if (!fs.existsSync('./uploads')){ fs.mkdirSync('./uploads'); }

// Middleware
app.use(cors({origin: "*"}));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Socket ko global set kiya
app.set('io', io);

// DB CONNECT
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('✅ MongoDB Connected v4.0 - FIXED'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ROUTES ALAG FILE SE
const routes = require('./routes');
app.use('/api', routes(io));

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));