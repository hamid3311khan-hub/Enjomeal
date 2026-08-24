const express = require("express");

const {
  createReviewController,
  getRestaurantReviewsController,
  getSingleReviewController,
  updateReviewController,
  deleteReviewController,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ===============================
// CREATE REVIEW
// CUSTOMER ONLY
// ===============================
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("customer"),
  createReviewController
);

// ===============================
// GET RESTAURANT REVIEWS
// PUBLIC
// ===============================
router.get(
  "/restaurant/:restaurantId",
  getRestaurantReviewsController
);

// ===============================
// GET SINGLE REVIEW
// PUBLIC
// ===============================
router.get(
  "/:reviewId",
  getSingleReviewController
);

// ===============================
// UPDATE REVIEW
// CUSTOMER ONLY
// ===============================
router.put(
  "/:reviewId",
  authMiddleware,
  roleMiddleware("customer"),
  updateReviewController
);

// ===============================
// DELETE REVIEW
// CUSTOMER ONLY
// ===============================
router.delete(
  "/:reviewId",
  authMiddleware,
  roleMiddleware("customer"),
  deleteReviewController
);

module.exports = router;