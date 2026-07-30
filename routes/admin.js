const express = require('express');
const router = express.Router();
const { Restaurant, Rider } = require('../models');

module.exports = (io) => {
  router.get('/pending-restaurants', async (req, res) => {
    const restaurants = await Restaurant.find({ status: 'pending' });
    res.json(restaurants);
  });

  router.post('/approve-restaurant/:id', async (req, res) => {
    await Restaurant.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.json({ message: "Restaurant Approved ✅" });
  });

  router.post('/reject-restaurant/:id', async (req, res) => {
    await Restaurant.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.json({ message: "Restaurant Rejected ❌" });
  });
  
  return router;
};