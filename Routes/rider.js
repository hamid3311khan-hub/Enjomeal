const express = require('express');
const router = express.Router();
const { Rider } = require('../models');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post('/api/rider/register', upload.fields([{name: 'aadharImg'}, {name: 'dlProof'}]), async (req,res)=>{
  try{
    const {name, mobile, email, password, address, vehicleNo} = req.body;
    const exist = await Rider.findOne({mobile});
    if(exist) return res.json({success: false, error: "Mobile pehle se registered hai"});
    let aadharUrl = null, dlUrl = null;
    if(req.files['aadharImg']){
      const result = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream({folder:"riders"}, (err, result) => resolve(result)).end(req.files['aadharImg'][0].buffer);
      });
      aadharUrl = result.secure_url;
    }
    if(req.files['dlProof']){
      const result = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream({folder:"riders"}, (err, result) => resolve(result)).end(req.files['dlProof'][0].buffer);
      });
      dlUrl = result.secure_url;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newRider = new Rider({ name, mobile, email, password: hashedPassword, address, vehicleNo, aadharImg: aadharUrl, dlProof: dlUrl });
    await newRider.save();
    res.json({success:true, message: "Register ho gaya. Approval ka wait karein"});
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
});

router.post('/api/rider/login', async (req,res)=>{
  try{
    const {mobile, password} = req.body;
    const rider = await Rider.findOne({mobile});
    if(!rider) return res.status(400).json({success: false, error: "Rider not found"});
    if(rider.status!== 'Approved') return res.status(400).json({success: false, error: "Admin se approval pending hai"});
    const match = await bcrypt.compare(password, rider.password);
    if(!match) return res.status(400).json({success: false, error: "Invalid password"});
    res.json({success:true, riderId: rider._id, name: rider.name});
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
});

module.exports = router;