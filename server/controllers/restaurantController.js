const mongoose = require("mongoose");
const Restaurant = require("../models/restaurant");
const User = require("../models/user");

// ===============================
// HELPER: CHECK RESTAURANT ACCESS
// ===============================
const checkRestaurantOwnership = (restaurant, req) => {
  // Admin has full access
  if (req.user.role === "admin") {
    return true;
  }

  // Restaurant must have an owner
  if (!restaurant.owner) {
    return false;
  }

  // Logged-in restaurant user must own this restaurant
  return restaurant.owner.toString() === req.user.id.toString();
};

// ===============================
// ADD RESTAURANT
// ===============================
const addRestaurant = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      cuisine,
      image,
      isOpen,
    } = req.body;

    // For restaurant registration through authenticated
    // restaurant user, owner should come from JWT.
    const owner =
      req.user && req.user.role === "restaurant"
        ? req.user.id
        : req.body.owner;

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: "Restaurant owner is required",
      });
    }

    const restaurant = await Restaurant.create({
      name,
      owner,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      cuisine,
      image,
      isOpen,
      approvalStatus: "PENDING",
      isActive: false,
    });

    return res.status(201).json({
      success: true,
      message:
        "Restaurant registered successfully. Waiting for admin approval",
      restaurant,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET ALL RESTAURANTS
// PUBLIC
// ===============================
const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      approvalStatus: "APPROVED",
      isActive: true,
    }).populate(
      "owner",
      "name email phone role approvalStatus isActive"
    );

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET RESTAURANT BY ID
// PUBLIC
// ===============================
const getRestaurantById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id).populate(
      "owner",
      "name email phone role approvalStatus isActive"
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Public users should not see inactive/rejected restaurants
    if (
      restaurant.approvalStatus !== "APPROVED" ||
      !restaurant.isActive
    ) {
      return res.status(404).json({
        success: false,
        message: "Restaurant is not available",
      });
    }

    return res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// UPDATE RESTAURANT
// OWNER / ADMIN
// ===============================
const updateRestaurant = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

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
          "Access denied. You can only manage your own restaurant.",
      });
    }

    // Prevent restaurant owner from changing ownership
    // or approval fields directly.
    const allowedUpdates = [
      "name",
      "ownerName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
      "cuisine",
      "image",
      "isOpen",
    ];

    // Admin can additionally update approval/active status
    if (req.user.role === "admin") {
      allowedUpdates.push("approvalStatus", "isActive");
    }

    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate(
      "owner",
      "name email phone role approvalStatus isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// DELETE RESTAURANT
// OWNER / ADMIN
// ===============================
const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const restaurant = await Restaurant.findById(id);

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
          "Access denied. You can only delete your own restaurant.",
      });
    }

    await Restaurant.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET PENDING RESTAURANTS
// ADMIN ONLY
// ===============================
const getPendingRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      approvalStatus: "PENDING",
    }).populate(
      "owner",
      "name email phone role approvalStatus isActive"
    );

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// APPROVE RESTAURANT
// ADMIN ONLY
// ===============================
const approveRestaurant = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check owner connection
    if (!restaurant.owner) {
      return res.status(400).json({
        success: false,
        message: "Restaurant owner is not linked",
      });
    }

    const user = await User.findById(restaurant.owner);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Restaurant owner account not found",
      });
    }

    // Approve owner
    user.approvalStatus = "APPROVED";
    user.isActive = true;
    await user.save();

    // Approve restaurant
    restaurant.approvalStatus = "APPROVED";
    restaurant.isActive = true;
    await restaurant.save();

    await restaurant.populate(
      "owner",
      "name email phone role approvalStatus isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Restaurant and owner approved successfully",
      restaurant,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// REJECT RESTAURANT
// ADMIN ONLY
// ===============================
const rejectRestaurant = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check owner connection
    if (!restaurant.owner) {
      return res.status(400).json({
        success: false,
        message: "Restaurant owner is not linked",
      });
    }

    const user = await User.findById(restaurant.owner);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Restaurant owner account not found",
      });
    }

    // Reject owner
    user.approvalStatus = "REJECTED";
    user.isActive = false;
    await user.save();

    // Reject restaurant
    restaurant.approvalStatus = "REJECTED";
    restaurant.isActive = false;
    await restaurant.save();

    await restaurant.populate(
      "owner",
      "name email phone role approvalStatus isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Restaurant and owner rejected successfully",
      restaurant,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET MY RESTAURANT
// RESTAURANT OWNER / ADMIN
// ===============================
const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user.id,
    }).populate(
      "owner",
      "name email phone role approvalStatus isActive"
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.log("Get My Restaurant Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant profile.",
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  addRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
  getMyRestaurant,
};