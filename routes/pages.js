const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/customer-register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/customer-register.html'));
});

module.exports = router;