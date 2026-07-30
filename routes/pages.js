const express = require('express');
const router = express.Router();

module.exports = (io) => {
  router.get('/about', (req,res) => res.json({page: "About Us"}))
  router.get('/terms', (req,res) => res.json({page: "Terms & Conditions"}))
  return router;
};