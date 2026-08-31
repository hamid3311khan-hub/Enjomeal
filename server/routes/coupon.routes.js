const express = require("express");

const {
  createCouponController,
  getAllCouponsController,
  getSingleCouponController,
  updateCouponController,
  deleteCouponController,
  applyCouponController,
  getAvailableCouponsController,
} = require("../controllers/couponController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// =====================================================
// CREATE COUPON
// ADMIN ONLY
// =====================================================

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("admin"),
  createCouponController
);

// =====================================================
// GET ALL COUPONS
// ADMIN ONLY
// =====================================================

router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllCouponsController
);

// =====================================================
// GET ACTIVE COUPONS
// CUSTOMER ONLY
//
// IMPORTANT:
// This route MUST come before "/:couponId"
// Otherwise Express can treat "active" as couponId.
// =====================================================

router.get(
  "/active",
  authMiddleware,
  roleMiddleware("customer"),
  getAvailableCouponsController
);

// =====================================================
// APPLY / VALIDATE COUPON
// CUSTOMER ONLY
// =====================================================

router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("customer"),
  applyCouponController
);

// =====================================================
// GET SINGLE COUPON
// ADMIN ONLY
//
// Keep this dynamic route AFTER all fixed routes.
// =====================================================

router.get(
  "/:couponId",
  authMiddleware,
  roleMiddleware("admin"),
  getSingleCouponController
);

// =====================================================
// UPDATE COUPON
// ADMIN ONLY
// =====================================================

router.put(
  "/:couponId",
  authMiddleware,
  roleMiddleware("admin"),
  updateCouponController
);

// =====================================================
// DELETE COUPON
// ADMIN ONLY
// =====================================================

router.delete(
  "/:couponId",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCouponController
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
