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

// Socket.io ko har route me bhejne ke liye
app.set('io', io);

// DB CONNECT
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('✅ MongoDB Connected v5.0 - Modular'))
.catch(err => { console.log('Mongo Error:', err); process.exit(1) });

// ===== YAHI 1 LINE CHANGE HUI HAI =====
// Ab routes folder ke index.js se sab load hoga
app.use('/', require('./routes/index')(io));

// 404 agar koi page na mile
app.use((req,res)=> res.status(404).send("Page Not Found"));

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));