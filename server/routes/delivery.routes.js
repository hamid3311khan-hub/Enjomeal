const express = require("express");

const {
  createDeliveryController,
  getAllDeliveryController,
  getAvailableDeliveryController,
  getSingleDeliveryController,
  updateDeliveryController,
  deleteDeliveryController,
  updateDeliveryAvailabilityController,
  getAssignedOrdersController,
  updateDeliveryActiveStatusController,
  getMyDeliveryProfileController,
  updateMyLiveLocationController
} = require("../controllers/deliveryController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// =====================================================
// CREATE DELIVERY PARTNER
// ADMIN ONLY
// =====================================================
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("admin"),
  createDeliveryController
);

// =====================================================
// GET ALL DELIVERY PARTNERS
// ADMIN ONLY
// =====================================================
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllDeliveryController
);

// =====================================================
// GET AVAILABLE DELIVERY PARTNERS
// RESTAURANT / ADMIN
// =====================================================
router.get(
  "/available",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  getAvailableDeliveryController
);

// =====================================================
// GET MY DELIVERY PROFILE
// DELIVERY PARTNER ONLY
// =====================================================
router.get(
  "/my-profile",
  authMiddleware,
  roleMiddleware("delivery"),
  getMyDeliveryProfileController
);

// =====================================================
// UPDATE MY LIVE LOCATION
// DELIVERY PARTNER ONLY
// =====================================================
router.put(
  "/my-location",
  authMiddleware,
  roleMiddleware("delivery"),
  updateMyLiveLocationController
);


// =====================================================
// GET ASSIGNED ORDERS
// DELIVERY PARTNER / ADMIN
// =====================================================
router.get(
  "/:deliveryPartnerId/orders",
  authMiddleware,
  roleMiddleware("delivery", "admin"),
  getAssignedOrdersController
);


// =====================================================
// UPDATE DELIVERY AVAILABILITY
// DELIVERY PARTNER / ADMIN
// =====================================================
router.put(
  "/:id/availability",
  authMiddleware,
  roleMiddleware("delivery", "admin"),
  updateDeliveryAvailabilityController
);

// =====================================================
// UPDATE DELIVERY ACTIVE STATUS
// ADMIN ONLY
// =====================================================
router.put(
  "/:id/active-status",
  authMiddleware,
  roleMiddleware("admin"),
  updateDeliveryActiveStatusController
);

// =====================================================
// GET SINGLE DELIVERY PARTNER
// ADMIN / DELIVERY PARTNER
// =====================================================
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("delivery", "admin"),
  getSingleDeliveryController
);

// =====================================================
// UPDATE DELIVERY PARTNER
// ADMIN ONLY
// =====================================================
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateDeliveryController
);

// =====================================================
// DELETE DELIVERY PARTNER
// ADMIN ONLY
// =====================================================
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteDeliveryController
);

module.exports = router;
