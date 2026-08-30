const Settings = require("../models/settingsModel");

// ==========================================
// GET SETTINGS
// ADMIN / AUTHENTICATED USERS
// ==========================================

const getSettingsController = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        deliveryFee: 0,
        platformCharge: 0,
        freeDelivery: false,
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Get Settings Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE SETTINGS
// ADMIN ONLY
// ==========================================

const updateSettingsController = async (
  req,
  res
) => {
  try {
    const {
      deliveryFee,
      platformCharge,
      freeDelivery,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (
      deliveryFee !== undefined &&
      (
        typeof deliveryFee !== "number" ||
        deliveryFee < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery fee must be a non-negative number",
      });
    }

    if (
      platformCharge !== undefined &&
      (
        typeof platformCharge !== "number" ||
        platformCharge < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Platform charge must be a non-negative number",
      });
    }

    if (
      freeDelivery !== undefined &&
      typeof freeDelivery !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "freeDelivery must be true or false",
      });
    }

    // ========================================
    // FIND OR CREATE SETTINGS
    // ========================================

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    // ========================================
    // UPDATE ONLY PROVIDED VALUES
    // ========================================

    if (deliveryFee !== undefined) {
      settings.deliveryFee =
        deliveryFee;
    }

    if (platformCharge !== undefined) {
      settings.platformCharge =
        platformCharge;
    }

    if (freeDelivery !== undefined) {
      settings.freeDelivery =
        freeDelivery;
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message:
        "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error(
      "Update Settings Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

module.exports = {
  getSettingsController,
  updateSettingsController,
};
