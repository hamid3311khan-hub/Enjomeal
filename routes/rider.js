const express = require('express');
const router = express.Router();
const { Rider, Order } = require('../models');

module.exports = (io) => {
  // Rider signup/login yaha add karna
  router.post('/update-location', async (req,res)=>{
    // rider live location update
    io.emit('riderLocation', req.body)
    res.json({status: "ok"})
  })

  router.post('/accept-order/:id', async (req,res)=>{
    const order = await Order.findByIdAndUpdate(req.params.id, {status: 'accepted', riderId: req.body.riderId}, {new: true});
    io.emit('orderAccepted', order);
    res.json(order);
  })

  return router;
};