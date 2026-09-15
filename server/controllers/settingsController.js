const Settings = require("../models/settingsModel");

// ==========================================
// GET SETTINGS
// AUTHENTICATED USERS
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

        deliveryPartnerAdmissionCharge: 0,
        deliveryPartnerOffer: "",
        deliveryPartnerOfferValidUntil: null,
        deliveryPartnerInfo: "",
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Settings Error:", error);

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

const updateSettingsController = async (req, res) => {
  try {
    const {
      deliveryFee,
      platformCharge,
      freeDelivery,

      deliveryPartnerAdmissionCharge,
      deliveryPartnerOffer,
      deliveryPartnerOfferValidUntil,
      deliveryPartnerInfo,
    } = req.body;

    // ========================================
    // EXISTING SETTINGS VALIDATION
    // ========================================

    if (
      deliveryFee !== undefined &&
      (typeof deliveryFee !== "number" || deliveryFee < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivery fee must be a non-negative number",
      });
    }

    if (
      platformCharge !== undefined &&
      (typeof platformCharge !== "number" ||
        platformCharge < 0)
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
        message: "freeDelivery must be true or false",
      });
    }

    // ========================================
    // DELIVERY PARTNER VALIDATION
    // ========================================

    if (
      deliveryPartnerAdmissionCharge !== undefined &&
      (typeof deliveryPartnerAdmissionCharge !== "number" ||
        deliveryPartnerAdmissionCharge < 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner admission charge must be a non-negative number",
      });
    }

    if (
      deliveryPartnerOffer !== undefined &&
      typeof deliveryPartnerOffer !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivery partner offer must be text",
      });
    }

    if (
      deliveryPartnerOfferValidUntil !== undefined &&
      deliveryPartnerOfferValidUntil !== null &&
      Number.isNaN(
        new Date(
          deliveryPartnerOfferValidUntil
        ).getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid delivery partner offer validity date",
      });
    }

    if (
      deliveryPartnerInfo !== undefined &&
      typeof deliveryPartnerInfo !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner information must be text",
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
    // UPDATE EXISTING SETTINGS
    // ========================================

    if (deliveryFee !== undefined) {
      settings.deliveryFee = deliveryFee;
    }

    if (platformCharge !== undefined) {
      settings.platformCharge = platformCharge;
    }

    if (freeDelivery !== undefined) {
      settings.freeDelivery = freeDelivery;
    }

    // ========================================
    // UPDATE DELIVERY PARTNER SETTINGS
    // ========================================

    if (
      deliveryPartnerAdmissionCharge !== undefined
    ) {
      settings.deliveryPartnerAdmissionCharge =
        deliveryPartnerAdmissionCharge;
    }

    if (deliveryPartnerOffer !== undefined) {
      settings.deliveryPartnerOffer =
        deliveryPartnerOffer.trim();
    }

    if (
      deliveryPartnerOfferValidUntil !== undefined
    ) {
      settings.deliveryPartnerOfferValidUntil =
        deliveryPartnerOfferValidUntil
          ? new Date(
              deliveryPartnerOfferValidUntil
            )
          : null;
    }

    if (deliveryPartnerInfo !== undefined) {
      settings.deliveryPartnerInfo =
        deliveryPartnerInfo.trim();
    }

    // ========================================
    // SAVE
    // ========================================

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);

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
