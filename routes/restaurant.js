const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Restaurant } = require('../models');

module.exports = (io) => {
  router.get('/approved', async (req, res) => {
    const restaurants = await Restaurant.find({}); 
    res.json(restaurants);
  });

  router.post('/register', async (req, res) => {
    const { name, phone, password, address, image } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await Restaurant.create({ name, phone, password: hash, address, image });
    res.json({ message: "Restaurant Registered ✅" });
  });

  router.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    const restaurant = await Restaurant.findOne({ phone });
    if(!restaurant) return res.status(400).json({ error: "User not found" });
    const match = await bcrypt.compare(password, restaurant.password);
    if(!match) return res.status(400).json({ error: "Invalid password" });
    res.json({ message: "Login Success ✅", restaurantId: restaurant._id, name: restaurant.name });
  });

  return router;
}