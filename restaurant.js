const express = require('express');
const router = express.Router();
const { RestaurantOwner, MenuItem, Order } = require('../models');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post('/api/restaurant/register', upload.single('image'), async (req,res)=>{
  try{
    const {restaurantName, ownerName, mobile, email, address, password} = req.body;
    const exist = await RestaurantOwner.findOne({mobile});
    if(exist) return res.json({success: false, error: "Mobile pehle se registered hai"});
    const restaurantId = 'RES' + Date.now();
    let imageUrl = null;
    if(req.file){
      const result = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream({folder:"restaurants"}, (err, result) => resolve(result)).end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const trial_end_date = new Date();
    trial_end_date.setDate(trial_end_date.getDate() + 30);
    const newRestaurant = new RestaurantOwner({ restaurantId, restaurantName, ownerName, mobile, email, address, password: hashedPassword, image: imageUrl, trial_end_date });
    await newRestaurant.save();
    res.json({success:true, message: "Register ho gaya. Approval ka wait karein"});
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
});

router.post('/api/restaurant/login', async (req,res)=>{
  try{
    const {mobile, password} = req.body;
    const restaurant = await RestaurantOwner.findOne({mobile});
    if(!restaurant) return res.status(400).json({success: false, error: "Restaurant not found"});
    if(restaurant.status!== 'Approved') return res.status(400).json({success: false, error: "Admin se approval pending hai"});
    const match = await bcrypt.compare(password, restaurant.password);
    if(!match) return res.status(400).json({success: false, error: "Invalid password"});
    res.json({success:true, restaurantId: restaurant.restaurantId, name: restaurant.restaurantName});
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
});

router.post('/api/restaurant/menu', upload.single('image'), async (req,res)=>{
  try{
    const {name, price, description, category, restaurantId} = req.body;
    let imageUrl = '';
    if(req.file){
      const result = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream({folder:"menu-items"}, (err, result) => resolve(result)).end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }
    const item = new MenuItem({name, price: Number(price), desc: description, category, restaurantId, image: imageUrl, veg: category === 'Veg'});
    await item.save();
    res.json({success: true, item})
  }catch(e){ res.status(500).json({success: false, error: e.message}) }
});

router.get('/api/restaurant/menu/:restaurantId', async (req,res)=>{
  const items = await MenuItem.find({restaurantId: req.params.restaurantId}).sort({createdAt: -1});
  res.json({success: true, items})
});

router.delete('/api/restaurant/menu/:id', async (req,res)=>{
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({success: true})
});

router.get('/api/restaurant/orders/:restaurantId', async (req,res)=>{
  const orders = await Order.find({restaurantId: req.params.restaurantId}).sort({createdAt: -1});
  res.json({success: true, orders})
});

module.exports = router;