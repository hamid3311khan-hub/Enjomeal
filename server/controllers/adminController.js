const User = require("../models/user");
const Restaurant = require("../models/restaurant");
const Delivery = require("../models/deliveryModel");
const Order = require("../models/orderModel");

// =====================================
// ADMIN DASHBOARD STATS
// =====================================

const getAdminDashboardStatsController = async (
  req,
  res
) => {
  try {
    const totalCustomers =
      await User.countDocuments({
        role: "customer",
      });

    const totalRestaurants =
      await Restaurant.countDocuments();

    const totalDeliveryPartners =
      await Delivery.countDocuments();

    const totalOrders =
      await Order.countDocuments();

    return res.status(200).json({
      success: true,
      message:
        "Admin dashboard stats fetched successfully",

      stats: {
        totalCustomers,
        totalRestaurants,
        totalDeliveryPartners,
        totalOrders,
      },
    });
  } catch (error) {
    console.error(
      "Admin Dashboard Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Admin Dashboard Stats API",
      error: error.message,
    });
  }
};


// =====================================
// GET ALL RESTAURANTS
// ADMIN ONLY
// =====================================

const getAdminRestaurantsController = async (
  req,
  res
) => {
  try {
    const restaurants =
      await Restaurant.find()
        .populate(
          "owner",
          "name email phone role isActive"
        )
        .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message:
        "Admin restaurants fetched successfully",

      count: restaurants.length,

      restaurants,
    });
  } catch (error) {
    console.error(
      "Admin Restaurants Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Admin Restaurants API",
      error: error.message,
    });
  }
};


// =====================================
// APPROVE RESTAURANT
// ADMIN ONLY
// =====================================

const approveRestaurantController = async (
  req,
  res
) => {
  try {
    const { restaurantId } = req.params;

    const restaurant =
      await Restaurant.findById(
        restaurantId
      );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (
      restaurant.approvalStatus ===
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restaurant is already approved",
      });
    }

    restaurant.approvalStatus =
      "APPROVED";

    restaurant.isActive = true;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message:
        "Restaurant approved successfully",

      restaurant,
    });
  } catch (error) {
    console.error(
      "Approve Restaurant Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Approve Restaurant API",
      error: error.message,
    });
  }
};


// =====================================
// REJECT RESTAURANT
// ADMIN ONLY
// =====================================

const rejectRestaurantController = async (
  req,
  res
) => {
  try {
    const { restaurantId } = req.params;

    const restaurant =
      await Restaurant.findById(
        restaurantId
      );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (
      restaurant.approvalStatus ===
      "REJECTED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restaurant is already rejected",
      });
    }

    restaurant.approvalStatus =
      "REJECTED";

    restaurant.isActive = false;
    restaurant.isOpen = false;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message:
        "Restaurant rejected successfully",

      restaurant,
    });
  } catch (error) {
    console.error(
      "Reject Restaurant Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Reject Restaurant API",
      error: error.message,
    });
  }
};


// =====================================
// ACTIVATE RESTAURANT
// ADMIN ONLY
// =====================================

const activateRestaurantController = async (
  req,
  res
) => {
  try {
    const { restaurantId } = req.params;

    const restaurant =
      await Restaurant.findById(
        restaurantId
      );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (
      restaurant.approvalStatus !==
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved restaurants can be activated",
      });
    }

    restaurant.isActive = true;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message:
        "Restaurant activated successfully",

      restaurant,
    });
  } catch (error) {
    console.error(
      "Activate Restaurant Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Activate Restaurant API",
      error: error.message,
    });
  }
};


// =====================================
// DEACTIVATE RESTAURANT
// ADMIN ONLY
// =====================================

const deactivateRestaurantController =
  async (req, res) => {
    try {
      const { restaurantId } =
        req.params;

      const restaurant =
        await Restaurant.findById(
          restaurantId
        );

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message:
            "Restaurant not found",
        });
      }

      restaurant.isActive = false;
      restaurant.isOpen = false;

      await restaurant.save();

      return res.status(200).json({
        success: true,
        message:
          "Restaurant deactivated successfully",

        restaurant,
      });
    } catch (error) {
      console.error(
        "Deactivate Restaurant Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error in Deactivate Restaurant API",
        error: error.message,
      });
    }
  };


// =====================================
// DELETE RESTAURANT
// ADMIN ONLY
// =====================================

const deleteAdminRestaurantController =
  async (req, res) => {
    try {
      const { restaurantId } =
        req.params;

      const restaurant =
        await Restaurant.findById(
          restaurantId
        );

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message:
            "Restaurant not found",
        });
      }

      await Restaurant.findByIdAndDelete(
        restaurantId
      );

      return res.status(200).json({
        success: true,
        message:
          "Restaurant deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Restaurant Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error in Delete Restaurant API",
        error: error.message,
      });
    }
  };
  // =====================================
// GET ALL CUSTOMERS
// ADMIN ONLY
// =====================================

const getAdminCustomersController = async (
  req,
  res
) => {
  try {
    const customers = await User.find({
      role: "customer",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message:
        "Admin customers fetched successfully",

      count: customers.length,

      customers,
    });
  } catch (error) {
    console.error(
      "Admin Customers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Admin Customers API",
      error: error.message,
    });
  }
};


// =====================================
// EXPORT
// =====================================

module.exports = {
  getAdminDashboardStatsController,
  getAdminRestaurantsController,
  approveRestaurantController,
  rejectRestaurantController,
  activateRestaurantController,
  deactivateRestaurantController,
  deleteAdminRestaurantController,
  getAdminCustomersController,
};