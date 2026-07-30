const express = require('express');
const router = express.Router();
const { MenuItem, Order } = require('../models');

function calculateBill(item_total) {
  const commission_10 = Math.round(item_total * 0.10);
  const platform_fee = 10;
  const delivery_fee = 40;
  const grand_total = item_total + commission_10 + platform_fee + delivery_fee;
  return {item_total, commission_10, platform_fee, delivery_fee, grand_total, cash_to_restaurant: item_total - commission_10};
}

router.get('/api/menu', async (req,res)=>{
  const {restaurantId} = req.query;
  let filter = {inStock: true};
  if(restaurantId) filter.restaurantId = restaurantId;
  res.json(await MenuItem.find(filter))
});

router.post('/api/orders', async (req,res)=>{
  try{
    const io = req.app.get('io');
    const bill=calculateBill(req.body.item_total);
    const trackId = 'EB' + Date.now();
    const order=new Order({...req.body, trackId,...bill});
    await order.save();
    io.emit('newOrder', order);
    res.json(order);
  }catch(e){res.status(500).json({error:e.message})}
});

router.get('/api/orders', async (req,res)=>{
  const {restaurantId, status, riderId} = req.query;
  let filter = {};
  if(restaurantId) filter.restaurantId = restaurantId;
  if(status) filter.status = status;
  if(riderId) filter.riderId = riderId;
  res.json(await Order.find(filter).sort({createdAt:-1}))
});

module.exports = router;