const express = require('express');
const router = express.Router();
const { Customer } = require('../models'); 
const bcrypt = require('bcrypt');

module.exports = (io) => {
  router.post('/register', async (req, res) => {
    try {
      const { name, phone, password, address } = req.body;
      const exist = await Customer.findOne({ phone });
      if (exist) return res.status(400).json({ error: "Phone already registered" });
      const hashedPass = await bcrypt.hash(password, 10);
      const customer = new Customer({ name, phone, password: hashedPass, address });
      await customer.save();
      res.json({ message: "Registered Successfully ✅", customer });
    } catch (e) { res.status(500).json({ error: e.message }) }
  });

  router.post('/login', async (req, res) => {
    try {
      const { phone, password } = req.body;
      const customer = await Customer.findOne({ phone });
      if (!customer) return res.status(400).json({ error: "User not found" });
      const match = await bcrypt.compare(password, customer.password);
      if (!match) return res.status(400).json({ error: "Wrong password" });
      res.json({ message: "Login Success ✅", customer });
    } catch (e) { res.status(500).json({ error: e.message }) }
  });

  router.get('/profile/:id', async (req,res)=>{
    const customer = await Customer.findById(req.params.id).select('-password');
    res.json(customer);
  })
  
  return router;
};