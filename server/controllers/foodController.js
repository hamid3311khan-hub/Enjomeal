const mongoose = require("mongoose");
const Food = require("../models/foodModels");
const Restaurant = require("../models/restaurant");

// ===============================
// CHECK RESTAURANT OWNERSHIP
// ===============================
const checkRestaurantOwnership = (restaurant, req) => {
  // Admin has full access
  if (req.user.role === "admin") {
    return true;
  }

  if (!restaurant || !restaurant.owner) {
    return false;
  }

  return restaurant.owner.toString() === req.user.id.toString();
};

// ===============================
// CREATE FOOD
// RESTAURANT OWNER / ADMIN
// ===============================
const createFoodController = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      restaurant,
      image,
      isAvailable,
    } = req.body;

    if (!name || !description || price === undefined || !category || !restaurant) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(restaurant)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const restaurantData = await Restaurant.findById(restaurant);

    if (!restaurantData) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Ownership check
    if (!checkRestaurantOwnership(restaurantData, req)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only add food to your own restaurant.",
      });
    }

    const food = await Food.create({
      name,
      description,
      price,
      category,
      restaurant,
      image,
      isAvailable,
    });

    const populatedFood = await Food.findById(food._id).populate(
      "restaurant"
    );

    return res.status(201).json({
      success: true,
      message: "Food created successfully",
      food: populatedFood,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Create Food API",
      error: error.message,
    });
  }
};

// ===============================
// GET ALL FOODS
// PUBLIC
// ===============================
const getAllFoodsController = async (req, res) => {
  try {
    const foods = await Food.find({
      isAvailable: true,
    }).populate("restaurant");

    return res.status(200).json({
      success: true,
      totalFoods: foods.length,
      message: "All Foods List",
      foods,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get All Foods API",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE FOOD
// PUBLIC
// ===============================
const getSingleFoodController = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const food = await Food.findById(req.params.id).populate("restaurant");

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    if (!food.isAvailable) {
      return res.status(404).json({
        success: false,
        message: "Food is currently unavailable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Food fetched successfully",
      food,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Single Food API",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE FOOD
// RESTAURANT OWNER / ADMIN
// ===============================
const updateFoodController = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    const restaurant = await Restaurant.findById(food.restaurant);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Ownership check
    if (!checkRestaurantOwnership(restaurant, req)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only update food from your own restaurant.",
      });
    }

    // Prevent changing restaurant ownership
    const allowedUpdates = [
      "name",
      "description",
      "price",
      "category",
      "image",
      "isAvailable",
    ];

    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedFood = await Food.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("restaurant");

    return res.status(200).json({
      success: true,
      message: "Food updated successfully",
      food: updatedFood,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Update Food API",
      error: error.message,
    });
  }
};

// ===============================
// DELETE FOOD
// RESTAURANT OWNER / ADMIN
// ===============================
const deleteFoodController = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    const restaurant = await Restaurant.findById(food.restaurant);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Ownership check
    if (!checkRestaurantOwnership(restaurant, req)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only delete food from your own restaurant.",
      });
    }

    await Food.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Food deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Delete Food API",
      error: error.message,
    });
  }
};

// ===============================
// SEARCH FOOD
// PUBLIC
// ===============================
const searchFoodController = async (req, res) => {
  try {
    const keyword = req.params.keyword;

    const foods = await Food.find({
      name: {
        $regex: keyword,
        $options: "i",
      },
      isAvailable: true,
    }).populate("restaurant");

    return res.status(200).json({
      success: true,
      totalFoods: foods.length,
      foods,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Search Food API",
      error: error.message,
    });
  }
};

// ===============================
// GET FOODS BY RESTAURANT
// PUBLIC
// ===============================
const getFoodsByRestaurantController = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const foods = await Food.find({
      restaurant: restaurantId,
      isAvailable: true,
    }).populate("restaurant");

    return res.status(200).json({
      success: true,
      totalFoods: foods.length,
      message: "Restaurant foods fetched successfully",
      foods,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Restaurant Foods API",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  createFoodController,
  getAllFoodsController,
  getSingleFoodController,
  updateFoodController,
  deleteFoodController,
  searchFoodController,
  getFoodsByRestaurantController,
};