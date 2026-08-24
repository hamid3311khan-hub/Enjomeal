const mongoose = require("mongoose");
const Favorite = require("../models/favoriteModel");
const Food = require("../models/foodModels");

// ===============================
// ADD FAVORITE FOOD
// CUSTOMER ONLY
// ===============================
const addFavoriteController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { food } = req.body;

    if (!food) {
      return res.status(400).json({
        success: false,
        message: "Food ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(food)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const foodItem = await Food.findById(food);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    const existingFavorite = await Favorite.findOne({
      user: userId,
      food,
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Food is already in your favorites",
      });
    }

    const favorite = await Favorite.create({
      user: userId,
      food,
    });

    await favorite.populate("food");

    return res.status(201).json({
      success: true,
      message: "Food added to favorites successfully",
      favorite,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Add Favorite API",
      error: error.message,
    });
  }
};

// ===============================
// GET MY FAVORITES
// CUSTOMER ONLY
// ===============================
const getMyFavoritesController = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.find({
      user: userId,
    })
      .populate("food")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Favorites fetched successfully",
      totalFavorites: favorites.length,
      favorites,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Favorites API",
      error: error.message,
    });
  }
};

// ===============================
// REMOVE FAVORITE FOOD
// CUSTOMER ONLY
// ===============================
const removeFavoriteController = async (req, res) => {
  try {
    const { foodId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const favorite = await Favorite.findOne({
      user: req.user.id,
      food: foodId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Food is not in your favorites",
      });
    }

    await Favorite.findByIdAndDelete(favorite._id);

    return res.status(200).json({
      success: true,
      message: "Food removed from favorites successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Remove Favorite API",
      error: error.message,
    });
  }
};

// ===============================
// CHECK FAVORITE
// CUSTOMER ONLY
// ===============================
const checkFavoriteController = async (req, res) => {
  try {
    const { foodId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const favorite = await Favorite.findOne({
      user: req.user.id,
      food: foodId,
    });

    return res.status(200).json({
      success: true,
      isFavorite: !!favorite,
      message: favorite
        ? "Food is in favorites"
        : "Food is not in favorites",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Check Favorite API",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  addFavoriteController,
  getMyFavoritesController,
  removeFavoriteController,
  checkFavoriteController,
};