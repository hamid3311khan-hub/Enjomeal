const express = require('express');
const router = express.Router();
const { Rider } = require('../models');

module.exports = (io) => {
  router.post('/register', async (req, res) => {
    try {
      const rider = new Rider(req.body);
      await rider.save();
      res.json({ success: true, riderId: rider._id });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  return router;
};