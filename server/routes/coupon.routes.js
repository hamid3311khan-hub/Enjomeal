const express = require("express");

const {
  createCouponController,
  getAllCouponsController,
  getSingleCouponController,
  updateCouponController,
  deleteCouponController,
  applyCouponController,
} = require("../controllers/couponController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ===============================
// CREATE COUPON
// ADMIN ONLY
// ===============================
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("admin"),
  createCouponController
);

// ===============================
// GET ALL COUPONS
// ADMIN ONLY
// ===============================
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllCouponsController
);

// ===============================
// GET SINGLE COUPON
// ADMIN ONLY
// ===============================
router.get(
  "/:couponId",
  authMiddleware,
  roleMiddleware("admin"),
  getSingleCouponController
);

// ===============================
// UPDATE COUPON
// ADMIN ONLY
// ===============================
router.put(
  "/:couponId",
  authMiddleware,
  roleMiddleware("admin"),
  updateCouponController
);

// ===============================
// DELETE COUPON
// ADMIN ONLY
// ===============================
router.delete(
  "/:couponId",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCouponController
);

// ===============================
// APPLY / VALIDATE COUPON
// CUSTOMER ONLY
// ===============================
router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("customer"),
  applyCouponController
);

module.exports = router;