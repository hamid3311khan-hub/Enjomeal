const express = require("express");

const {
  createFoodController,
  getAllFoodsController,
  getSingleFoodController,
  updateFoodController,
  deleteFoodController,
  searchFoodController,
  getFoodsByRestaurantController,
} = require("../controllers/foodController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// =====================================================
// PUBLIC FOOD ROUTES
// =====================================================

// GET ALL AVAILABLE FOODS
router.get("/all", getAllFoodsController);

// SEARCH FOOD
router.get("/search/:keyword", searchFoodController);

// GET FOODS BY RESTAURANT
router.get(
  "/restaurant/:restaurantId",
  getFoodsByRestaurantController
);

// GET SINGLE FOOD
router.get("/:id", getSingleFoodController);

// =====================================================
// PROTECTED FOOD ROUTES
// RESTAURANT OWNER / ADMIN
// =====================================================

// CREATE FOOD
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  createFoodController
);

// UPDATE FOOD
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  updateFoodController
);

// DELETE FOOD
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  deleteFoodController
);

module.exports = router;