const mongoose = require("mongoose");

// =====================================================
// CART ITEM SCHEMA
// =====================================================

const cartItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: [true, "Food is required"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [100, "Quantity cannot exceed 100"],
      default: 1,
    },

    // Price snapshot when item was added to cart
    price: {
      type: Number,
      required: [true, "Food price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// CART SCHEMA
// =====================================================

const cartSchema = new mongoose.Schema(
  {
    // One active cart per customer
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      index: true,
    },

    // One restaurant per active cart
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: function (items) {
          return items.length <= 100;
        },
        message: "Cart cannot contain more than 100 items",
      },
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: [0, "Total amount cannot be negative"],
    },
  },
  {
    timestamps: true,

    strict: true,

    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

// =====================================================
// CART TOTAL VALIDATION
// =====================================================
// IMPORTANT:
// Modern Mongoose style - no next()
// =====================================================

cartSchema.pre("save", function () {
  if (!this.items || this.items.length === 0) {
    this.totalAmount = 0;
    this.restaurant = null;
    return;
  }

  this.totalAmount = this.items.reduce(
    (total, item) =>
      total +
      Number(item.price) * Number(item.quantity),
    0
  );
});

// =====================================================
// INDEXES
// =====================================================

cartSchema.index({
  user: 1,
  restaurant: 1,
});

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.Cart ||
  mongoose.model("Cart", cartSchema);