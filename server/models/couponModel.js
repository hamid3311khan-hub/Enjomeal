const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    // Coupon Code
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Coupon Description
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Discount Type
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
    },

    // Discount Value
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Minimum Order Amount
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maximum Discount
    maximumDiscount: {
      type: Number,
      default: null,
      min: 0,
    },

    // Coupon Expiry
    expiryDate: {
      type: Date,
      required: true,
    },

    // Maximum Usage Limit
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    // Number of times coupon used
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Coupon Active / Inactive
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);