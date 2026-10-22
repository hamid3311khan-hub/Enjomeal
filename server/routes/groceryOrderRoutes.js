const express = require("express");

const {
  createGroceryOrder,
  cancelGroceryOrder,
  getMyGroceryOrders,
  getMyGroceryOrderById,
} = require("../controllers/groceryOrderController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

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
