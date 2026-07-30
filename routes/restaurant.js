const express = require('express');
const router = express.Router();
const { Restaurant, MenuItem } = require('../models');

module.exports = (io) => {
  router.post('/register', async (req, res) => {
    try {
      const restaurant = new Restaurant(req.body);
      await restaurant.save();
      res.json({ success: true, restaurantId: restaurant._id });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  return router;
};