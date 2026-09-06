
const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
    // User who used the coupon
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Coupon used
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },

    // Phone number snapshot
    phone: {
      type: String,
      trim: true,
    },
    // Order where coupon was used
order: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Order",
  required: true,
},
  },
  {
    timestamps: true,
  }
);

// One user can use one coupon only once
couponUsageSchema.index(
  {
    user: 1,
    coupon: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "CouponUsage",
  couponUsageSchema
);
