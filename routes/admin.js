const express = require('express');
const router = express.Router();
const { Restaurant, Rider } = require('../models');

module.exports = (io) => {
  
  // 1. Pending Restaurants ki list
  router.get('/pending-restaurants', async (req, res) => {
    try {
      const restaurants = await Restaurant.find({ status: 'pending' });
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Restaurant Approve karne ka route
  router.post('/approve-restaurant/:id', async (req, res) => {
    try {
      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id, 
        { status: 'approved' },
        { new: true }
      );
      res.json({ message: "Restaurant Approved ✅", restaurant });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Restaurant Reject karne ka route
  router.post('/reject-restaurant/:id', async (req, res) => {
    try {
      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id, 
        { status: 'rejected' },
        { new: true }
      );
      res.json({ message: "Restaurant Rejected ❌", restaurant });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};