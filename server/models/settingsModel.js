const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // ==========================================
    // CUSTOMER / ORDER SETTINGS
    // ==========================================

    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, "Delivery fee cannot be negative"],
    },

    platformCharge: {
      type: Number,
      default: 0,
      min: [0, "Platform charge cannot be negative"],
    },

    freeDelivery: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // DELIVERY PARTNER SETTINGS
    // ==========================================

    deliveryPartnerAdmissionCharge: {
      type: Number,
      default: 0,
      min: [
        0,
        "Delivery partner admission charge cannot be negative",
      ],
    },

    deliveryPartnerOffer: {
      type: String,
      default: "",
      trim: true,
      maxlength: [
        500,
        "Delivery partner offer cannot exceed 500 characters",
      ],
    },

    deliveryPartnerOfferValidUntil: {
      type: Date,
      default: null,
    },

    deliveryPartnerInfo: {
      type: String,
      default: "",
      trim: true,
      maxlength: [
        2000,
        "Delivery partner information cannot exceed 2000 characters",
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Settings",
  settingsSchema
);
