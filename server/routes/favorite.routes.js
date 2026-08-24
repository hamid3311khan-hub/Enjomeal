const express = require("express");

const {
  addFavoriteController,
  getMyFavoritesController,
  removeFavoriteController,
  checkFavoriteController,
} = require("../controllers/favoriteController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ===============================
// ADD FAVORITE FOOD
// CUSTOMER ONLY
// ===============================
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("customer"),
  addFavoriteController
);

// ===============================
// GET MY FAVORITES
// CUSTOMER ONLY
// ===============================
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("customer"),
  getMyFavoritesController
);

// ===============================
// CHECK FAVORITE
// CUSTOMER ONLY
// ===============================
router.get(
  "/check/:foodId",
  authMiddleware,
  roleMiddleware("customer"),
  checkFavoriteController
);

// ===============================
// REMOVE FAVORITE FOOD
// CUSTOMER ONLY
// ===============================
router.delete(
  "/:foodId",
  authMiddleware,
  roleMiddleware("customer"),
  removeFavoriteController
);

module.exports = router;