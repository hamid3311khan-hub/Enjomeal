const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    // Food order reference; optional for Grocery orders.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: undefined,
    },

    // Grocery order reference; optional for Food orders.
    groceryOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroceryOrder",
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

couponUsageSchema.pre("validate", function (next) {
  const hasFoodOrder = Boolean(this.order);
  const hasGroceryOrder = Boolean(this.groceryOrder);

  if (hasFoodOrder === hasGroceryOrder) {
    this.invalidate(
      "order",
      "Exactly one of order or groceryOrder must be provided"
    );
  }

  next();
});

// One user can use one coupon only once across both services.
couponUsageSchema.index(
  {
    user: 1,
    coupon: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.models.CouponUsage ||
  mongoose.model("CouponUsage", couponUsageSchema);
