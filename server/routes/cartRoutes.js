const express = require("express");

const {
  addToCartController,
  getCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
} = require("../controllers/cartController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// =====================================================
// ADD FOOD TO CART
// CUSTOMER ONLY
// =====================================================
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("customer"),
  addToCartController
);

// =====================================================
// GET MY CART
// CUSTOMER ONLY
// =====================================================
router.get(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  getCartController
);

// =====================================================
// UPDATE CART ITEM
// CUSTOMER ONLY
// =====================================================
router.put(
  "/items/:foodId",
  authMiddleware,
  roleMiddleware("customer"),
  updateCartItemController
);

// =====================================================
// REMOVE CART ITEM
// CUSTOMER ONLY
// =====================================================
router.delete(
  "/items/:foodId",
  authMiddleware,
  roleMiddleware("customer"),
  removeCartItemController
);

// =====================================================
// CLEAR CART
// CUSTOMER ONLY
// =====================================================
router.delete(
  "/clear",
  authMiddleware,
  roleMiddleware("customer"),
  clearCartController
);

module.exports = router;