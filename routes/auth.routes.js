const express = require('express');
const router = express.Router();

// Temp route
router.post('/login', (req, res) => {
  res.json({ success: true, message: "Login API working" });
});

module.exports = router;
