const express = require("express");

const {
  createOrderController,
  getUserOrdersController,
  getSingleOrderController,
  getAllOrdersController,
  updateOrderStatusController,
  assignDeliveryPartnerController,
  cancelOrderController,
  updatePaymentStatusController,
  getRestaurantOrdersController,  
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// CREATE ORDER
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("customer"),
  createOrderController
);

// MY ORDERS
router.get(
  "/my-orders",
  authMiddleware,
  roleMiddleware("customer"),
  getUserOrdersController
);

// RESTAURANT ORDERS
router.get(
  "/restaurant/my-orders",
  authMiddleware,
  roleMiddleware("restaurant"),
  getRestaurantOrdersController
);

// GET ALL ORDERS
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllOrdersController
);

// SINGLE ORDER
router.get(
  "/:orderId",
  authMiddleware,
  roleMiddleware(
    "customer",
    "restaurant",
    "delivery",
    "admin"
  ),
  getSingleOrderController
);

// UPDATE ORDER STATUS
router.put(
  "/:orderId/status",
  authMiddleware,
  roleMiddleware(
    "restaurant",
    "delivery",
    "admin"
  ),
  updateOrderStatusController
);

// ASSIGN DELIVERY PARTNER
router.put(
  "/:orderId/assign-delivery",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  assignDeliveryPartnerController
);

// CANCEL ORDER
router.put(
  "/:orderId/cancel",
  authMiddleware,
  roleMiddleware("customer", "admin"),
  cancelOrderController
);

// UPDATE PAYMENT STATUS
router.put(
  "/:orderId/payment-status",
  authMiddleware,
  roleMiddleware("admin"),
  updatePaymentStatusController
);

module.exports = router;