const express = require("express");

const {
  addRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
  getMyRestaurant,
} = require("../controllers/restaurantController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// =====================================================
// PUBLIC
// =====================================================

router.get("/", getRestaurants);

// =====================================================
// ADMIN
// =====================================================

router.get(
  "/admin/pending",
  authMiddleware,
  roleMiddleware("admin"),
  getPendingRestaurants
);

router.put(
  "/admin/:id/approve",
  authMiddleware,
  roleMiddleware("admin"),
  approveRestaurant
);

router.put(
  "/admin/:id/reject",
  authMiddleware,
  roleMiddleware("admin"),
  rejectRestaurant
);

// =====================================================
// RESTAURANT OWNER / ADMIN
// =====================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  addRestaurant
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  updateRestaurant
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  deleteRestaurant
);

// =====================================================
// PUBLIC SINGLE RESTAURANT
// KEEP THIS LAST
// =====================================================

router.get("/my-restaurant", authMiddleware, roleMiddleware("restaurant", "admin"), getMyRestaurant);
router.get("/:id", getRestaurantById);

module.exports = router;