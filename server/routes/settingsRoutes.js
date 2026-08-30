const express = require("express");

const {
  getSettingsController,
  updateSettingsController,
} = require("../controllers/settingsController");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// ==========================================
// GET SETTINGS
// ==========================================

router.get(
  "/",
  authMiddleware,
  getSettingsController
);

// ==========================================
// UPDATE SETTINGS
// ADMIN ONLY
// ==========================================

router.put(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin only.",
      });
    }

    next();
  },
  updateSettingsController
);

module.exports = router;
