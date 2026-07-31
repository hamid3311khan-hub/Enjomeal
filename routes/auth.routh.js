const express = require('express');
const router = express.Router();

// Phone OTP login baad me add karenge
router.post('/login', (req, res) => {
  res.json({ message: "Login API coming soon" });
});

module.exports = router;
