const express = require("express");

const {
  createNotificationController,
  getMyNotificationsController,
  getUnreadNotificationsController,
  getSingleNotificationController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ===============================
// CREATE NOTIFICATION
// ADMIN ONLY
// ===============================
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("admin"),
  createNotificationController
);

// ===============================
// GET MY NOTIFICATIONS
// ALL AUTHENTICATED USERS
// ===============================
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(
    "customer",
    "restaurant",
    "delivery",
    "admin"
  ),
  getMyNotificationsController
);

// ===============================
// GET UNREAD NOTIFICATIONS
// ALL AUTHENTICATED USERS
// ===============================
router.get(
  "/unread",
  authMiddleware,
  roleMiddleware(
    "customer",
    "restaurant",
    "delivery",
    "admin"
  ),
  getUnreadNotificationsController
);

// ===============================
// MARK ALL AS READ
// ALL AUTHENTICATED USERS
// ===============================
router.put(
  "/read-all",
  authMiddleware,
  roleMiddleware(
    "customer",
    "restaurant",
    "delivery",
    "admin"
  ),
  markAllNotificationsAsReadController
);

// ===============================
// GET SINGLE NOTIFICATION
// ALL AUTHENTICATED USERS
// ===============================
router.get(
  "/:notificationId",
  authMiddleware,
  roleMiddleware(
    "customer",
    "restaurant",
    "delivery",
    "admin"
  ),
  getSingleNotificationController
);

// ===============================
// MARK AS READ
// ALL AUTHENTICATED USERS
// ===============================
router.put(
  "/:notificationId/read",
  authMiddleware,
  roleMiddleware(
    "customer",
    "restaurant",
    "delivery",
    "admin"
  ),
  markNotificationAsReadController
);

// ===============================
// DELETE NOTIFICATION
// ALL AUTHENTICATED USERS
// ===============================
router.delete(
  "/:notificationId",
  authMiddleware,
  roleMiddleware(
    "customer",
    "restaurant",
    "delivery",
    "admin"
  ),
  deleteNotificationController
);

module.exports = router;