const express = require('express');
const router = express.Router();
const { RestaurantOwner } = require('../models');

router.get('/api/admin/pending-restaurants', async (req,res)=>{res.json(await RestaurantOwner.find({status:"Pending"}))});
router.put('/api/admin/approve-restaurant/:id', async (req,res)=>{await RestaurantOwner.findByIdAndUpdate(req.params.id,{status:"Approved"}); res.json({success:true})});
router.get('/api/restaurants/approved', async (req,res)=>{
  try{
    const restaurants = await RestaurantOwner.find({status: "Approved"}).select('-password -email');
    res.json({success: true, restaurants})
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
});

module.exports = router;