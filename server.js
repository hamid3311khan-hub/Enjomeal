const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // 1. cors add kiya

const app = express();
const server = http.createServer(app);

// 2. Socket.io me CORS allow kiya
const io = new Server(server, {
  cors: {
    origin: "*", // production me apni frontend URL daal dena
    methods: ["GET", "POST"]
  }
});

app.use(cors()); // 3. Express ke liye CORS
app.use(express.json());
app.use(express.static('public'));

// DB Connect
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log(err));

// Socket.io ko routes me bhejne ke liye
app.set('io', io);

// Routes
app.use('/', require('./routes/index')(io));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));