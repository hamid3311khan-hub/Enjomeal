const express = require("express");

const {
  getAdminDashboardStatsController,
  getAdminRestaurantsController,
  approveRestaurantController,
  rejectRestaurantController,
  activateRestaurantController,
  deactivateRestaurantController,
  deleteAdminRestaurantController,
  getAdminCustomersController,
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// =====================================
// ADMIN DASHBOARD STATS
// =====================================

router.get(
  "/dashboard-stats",
  authMiddleware,
  getAdminDashboardStatsController
);

// =====================================
// ADMIN RESTAURANTS
// =====================================

// Get all restaurants
router.get(
  "/restaurants",
  authMiddleware,
  getAdminRestaurantsController
);

// Approve restaurant
router.put(
  "/restaurants/:restaurantId/approve",
  authMiddleware,
  approveRestaurantController
);

// Reject restaurant
router.put(
  "/restaurants/:restaurantId/reject",
  authMiddleware,
  rejectRestaurantController
);

// Activate restaurant
router.put(
  "/restaurants/:restaurantId/activate",
  authMiddleware,
  activateRestaurantController
);

// Deactivate restaurant
router.put(
  "/restaurants/:restaurantId/deactivate",
  authMiddleware,
  deactivateRestaurantController
);

// Delete restaurant
router.delete(
  "/restaurants/:restaurantId",
  authMiddleware,
  deleteAdminRestaurantController
);

// =====================================
// ADMIN CUSTOMERS
// =====================================

// Get all customers
router.get(
  "/customers",
  authMiddleware,
  getAdminCustomersController
);

module.exports = router;