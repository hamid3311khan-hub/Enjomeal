const express = require("express");

const {
  createUpdateController,
  getActiveUpdatesController,
  getAllUpdatesController,
  updateUpdateController,
  deleteUpdateController,
} = require("../controllers/updateController");

const authMiddleware =
  require("../middleware/auth.middleware");

const roleMiddleware =
  require("../middleware/role.middleware");

const router = express.Router();

// ======================================
// GET ACTIVE UPDATES
// CUSTOMER / LOGGED-IN USERS
// ======================================

router.get(
  "/active",
  authMiddleware,
  getActiveUpdatesController
);

// ======================================
// GET ALL UPDATES
// ADMIN ONLY
// ======================================

router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllUpdatesController
);

// ======================================
// CREATE UPDATE
// ADMIN ONLY
// ======================================

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("admin"),
  createUpdateController
);

// ======================================
// UPDATE UPDATE
// ADMIN ONLY
// ======================================

router.put(
  "/:updateId",
  authMiddleware,
  roleMiddleware("admin"),
  updateUpdateController
);

// ======================================
// DELETE UPDATE
// ADMIN ONLY
// ======================================

router.delete(
  "/:updateId",
  authMiddleware,
  roleMiddleware("admin"),
  deleteUpdateController
);

// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;
