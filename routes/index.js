const express = require('express');
const router = express.Router();

module.exports = (io) => {
  const customerRoutes = require('./customer')(io);
  const restaurantRoutes = require('./restaurant')(io);
  const riderRoutes = require('./rider')(io);
  const adminRoutes = require('./admin')(io);
  const pageRoutes = require('./pages')(io); // <-- (io) add kiya

  router.use('/', pageRoutes);
  router.use('/api/customer', customerRoutes);
  router.use('/api/restaurant', restaurantRoutes);
  router.use('/api/rider', riderRoutes);
  router.use('/api/admin', adminRoutes);
  
  return router;
};