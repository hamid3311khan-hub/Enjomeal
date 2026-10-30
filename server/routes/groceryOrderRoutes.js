const express = require("express");

const {
  createGroceryOrder,
  cancelGroceryOrder,
  getMyGroceryOrders,
  getMyGroceryOrderById,
  getAllGroceryOrdersAdmin,
  updateGroceryOrderStatusAdmin,
} = require("../controllers/groceryOrderController");

const {
  checkoutApprovedRationRequest,
} = require("../controllers/rationCheckoutController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ADMIN GROCERY ORDERS — must appear before "/:orderId"
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  getAllGroceryOrdersAdmin
);

router.put(
  "/admin/:orderId/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateGroceryOrderStatusAdmin
);



// CHECKOUT AN APPROVED CUSTOM RATION REQUEST
router.post(
  "/ration/:requestId/checkout",
  authMiddleware,
  roleMiddleware("customer"),
  checkoutApprovedRationRequest
);

// CREATE GROCERY ORDER
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("customer"),
  createGroceryOrder
);

router.post("/:orderId/cancel", authMiddleware, roleMiddleware("customer"), cancelGroceryOrder);

// CUSTOMER'S GROCERY ORDERS
router.get(
  "/my-orders",
  authMiddleware,
  roleMiddleware("customer"),
  getMyGroceryOrders
);

// SINGLE GROCERY ORDER — CUSTOMER OWNER CHECK IS IN CONTROLLER
router.get(
  "/:orderId",
  authMiddleware,
  roleMiddleware("customer"),
  getMyGroceryOrderById
);

module.exports = router;
