const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req,res)=> res.sendFile(path.join(__dirname, '../public', 'index.html')));
router.get('/admin', (req,res)=> res.sendFile(path.join(__dirname, '../public', 'admin.html')));
router.get('/restaurant-dashboard', (req,res)=> res.sendFile(path.join(__dirname, '../public', 'restaurant-dashboard.html')));
router.get('/restaurant-register', (req,res)=> res.sendFile(path.join(__dirname, '../public', 'restaurant-register.html')));
router.get('/restaurant-login', (req,res)=> res.sendFile(path.join(__dirname, '../public', 'restaurant-login.html')));
router.get('/rider-register', (req,res)=> res.sendFile(path.join(__dirname, '../public', 'rider-register.html')));
router.get('/rider-login', (req,res)=> res.sendFile(path.join(__dirname, '../public', 'rider-login.html')));

module.exports = router;