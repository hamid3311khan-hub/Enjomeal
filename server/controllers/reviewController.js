const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");
const Restaurant = require("../models/restaurant");

// ===============================
// UPDATE RESTAURANT RATING
// ===============================
const updateRestaurantRating = async (restaurantId) => {
  try {
    const result = await Review.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
        },
      },
      {
        $group: {
          _id: "$restaurant",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // No reviews
    if (result.length === 0) {
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: 0,
      });

      return;
    }

    const averageRating = Number(
      result[0].averageRating.toFixed(1)
    );

    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: averageRating,
    });
  } catch (error) {
    console.log("Rating update error:", error);
  }
};

// ===============================
// CREATE REVIEW
// CUSTOMER ONLY
// ===============================
const createReviewController = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      restaurant,
      food,
      order,
      rating,
      comment,
    } = req.body;

    // Validation
    if (!restaurant || !order || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Restaurant, order and rating are required",
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Validate restaurant
    if (!mongoose.Types.ObjectId.isValid(restaurant)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    // Validate order
    if (!mongoose.Types.ObjectId.isValid(order)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Check Restaurant
    const restaurantItem = await Restaurant.findById(restaurant);

    if (!restaurantItem) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check Order
    const orderItem = await Order.findById(order);

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Order must belong to logged-in customer
    if (
      orderItem.user.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own order",
      });
    }

    // Order restaurant must match review restaurant
    if (
      orderItem.restaurant.toString() !==
      restaurant.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This restaurant does not belong to the selected order",
      });
    }

    // Review only after delivery
    if (orderItem.orderStatus !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message:
          "You can review only after order is delivered",
      });
    }

    // Check duplicate review
    const existingReview = await Review.findOne({
      user: userId,
      order,
      restaurant,
      food: food || null,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    // Create Review
    const review = await Review.create({
      user: userId,
      restaurant,
      food: food || null,
      order,
      rating,
      comment,
    });

    // Update restaurant average rating
    await updateRestaurantRating(restaurant);

    // Populate
    await review.populate("user", "name email");
    await review.populate("restaurant", "name");
    await review.populate("food", "name price");

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Create Review API",
      error: error.message,
    });
  }
};

// ===============================
// GET RESTAURANT REVIEWS
// ===============================
const getRestaurantReviewsController = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const reviews = await Review.find({
      restaurant: restaurantId,
    })
      .populate("user", "name")
      .populate("restaurant", "name")
      .populate("food", "name price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Restaurant reviews fetched successfully",
      totalReviews: reviews.length,
      reviews,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Restaurant Reviews API",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE REVIEW
// ===============================
const getSingleReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(reviewId)
      .populate("user", "name")
      .populate("restaurant", "name")
      .populate("food", "name price");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review fetched successfully",
      review,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Single Review API",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE REVIEW
// CUSTOMER ONLY
// ===============================
const updateReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    if (
      rating === undefined &&
      comment === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating or comment is required",
      });
    }

    // Validate rating
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Customer can update only own review
    if (
      review.user.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can update only your own review.",
      });
    }

    if (rating !== undefined) {
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Update restaurant average rating
    await updateRestaurantRating(review.restaurant);

    await review.populate("user", "name");
    await review.populate("restaurant", "name");
    await review.populate("food", "name price");

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Update Review API",
      error: error.message,
    });
  }
};

// ===============================
// DELETE REVIEW
// CUSTOMER ONLY
// ===============================
const deleteReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Customer can delete only own review
    if (
      review.user.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can delete only your own review.",
      });
    }

    // Save restaurant ID before deleting review
    const restaurantId = review.restaurant;

    await Review.findByIdAndDelete(reviewId);

    // Recalculate restaurant rating
    await updateRestaurantRating(restaurantId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Delete Review API",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  createReviewController,
  getRestaurantReviewsController,
  getSingleReviewController,
  updateReviewController,
  deleteReviewController,
};