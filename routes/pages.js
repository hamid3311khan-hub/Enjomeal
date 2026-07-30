const express = require('express');
const router = express.Router();
const path = require('path');

module.exports = (io) => {  // <-- ye line add ki
  router.get('/customer-register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/customer-register.html'));
  });

  router.get('/', (req, res) => {
    res.send('QuickBite API Running ✅');
  });

  return router; // <-- ye bhi important
}