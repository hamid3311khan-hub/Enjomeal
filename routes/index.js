const express = require('express');
const router = express.Router();

module.exports = (io) => {
  const customerRoutes = require('./customer')(io);
  const restaurantRoutes = require('./restaurant')(io);
  const riderRoutes = require('./rider')(io);
  const adminRoutes = require('./admin')(io);
  const pageRoutes = require('./pages');

  router.use('/', pageRoutes);
  router.use('/api/customer', customerRoutes);
  router.use('/api/restaurant', restaurantRoutes);
  router.use('/api/rider', riderRoutes);
  router.use('/api/admin', adminRoutes);
  
  router.get('/', (req, res) => res.send('QuickBite API Running ✅'));
  return router;
};