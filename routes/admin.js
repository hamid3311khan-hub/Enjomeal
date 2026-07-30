const express = require('express');
const router = express.Router();
const { Restaurant, Rider } = require('../models');

module.exports = (io) => {
  router.get('/pending-restaurants', async (req, res) => {
    const restaurants = await Restaurant.find({ status: 'pending' });
    res.json(restaurants);
  });
  return router;
};