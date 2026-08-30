const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);
