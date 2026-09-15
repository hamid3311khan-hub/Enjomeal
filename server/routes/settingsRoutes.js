const express = require("express");

const {
  getSettingsController,
  updateSettingsController,
  getDeliveryPartnerSettingsController,
} = require("../controllers/settingsController");

const authMiddleware = require("../middleware/auth.middleware");

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
// GET DELIVERY PARTNER SETTINGS
// DELIVERY PARTNER ONLY
// ==========================================

router.get(
  "/delivery-partner",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Delivery partner only.",
      });
    }

    next();
  },
  getDeliveryPartnerSettingsController
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
