const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { Restaurant } = require('../models');

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // public folder me save hoga
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

module.exports = (io) => {

  // GET all approved restaurants
  router.get('/approved', async (req, res) => {
    try {
      const restaurants = await Restaurant.find({});
      res.json(restaurants);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Register
  router.post('/register', upload.single('image'), async (req, res) => {
    try {
      const { name, phone, password, address } = req.body;
      
      // Check if phone already exists
      const exists = await Restaurant.findOne({ phone });
      if(exists) return res.status(400).json({ error: "Phone already registered" });

      const hash = await bcrypt.hash(password, 10);
      const image = req.file ? `/uploads/${req.file.filename}` : '';

      const newRes = await Restaurant.create({ 
        name, 
        phone, 
        password: hash, 
        address, 
        image 
      });

      res.json({ message: "Restaurant Registered ✅", restaurantId: newRes._id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Login
  router.post('/login', async (req, res) => {
    try {
      const { phone, password } = req.body;
      const restaurant = await Restaurant.findOne({ phone });
      if(!restaurant) return res.status(400).json({ error: "User not found" });
      
      const match = await bcrypt.compare(password, restaurant.password);
      if(!match) return res.status(400).json({ error: "Invalid password" });
      
      res.json({ message: "Login Success ✅", restaurantId: restaurant._id, name: restaurant.name });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}