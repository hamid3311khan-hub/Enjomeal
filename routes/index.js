const express = require('express');
const router = express.Router();

module.exports = (io) => {
  router.use('/admin', require('./admin')(io));
  router.use('/customer', require('./customer')(io));
  router.use('/restaurant', require('./restaurant')(io));
  router.use('/rider', require('./rider')(io));
  router.use('/pages', require('./pages')(io));
  
  router.get('/', (req,res) => res.send("EatBuddha API Running ✅"))
  return router;
}