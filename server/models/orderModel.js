const mongoose = require("mongoose");

// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: [true, "Food is required"],
    },

    // Snapshot of food name at order time
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: 150,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [100, "Quantity cannot exceed 100"],
    },

    // Price snapshot at order time
    price: {
      type: Number,
      required: [true, "Food price is required"],
      min: [0, "Price cannot be negative"],
    },

    // quantity × price
    itemTotal: {
      type: Number,
      required: [true, "Item total is required"],
      min: [0, "Item total cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// DELIVERY ADDRESS SNAPSHOT
// =====================================================

const deliveryAddressSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: [true, "Delivery address is required"],
      trim: true,
      maxlength: 500,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      maxlength: 10,
    },

    landmark: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    contactName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    contactPhone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    // ===================================================
    // CUSTOMER
    // ===================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
      index: true,
    },

    // ===================================================
    // RESTAURANT
    // ===================================================

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant is required"],
      index: true,
    },

    // ===================================================
    // DELIVERY PARTNER
    // ===================================================

    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      default: null,
      index: true,
    },

    // ===================================================
    // ORDER ITEMS
    // ===================================================

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    // ===================================================
    // AMOUNT
    // ===================================================

    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, "Delivery fee cannot be negative"],
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    // ===================================================
    // DELIVERY ADDRESS SNAPSHOT
    // ===================================================

    deliveryAddress: {
      type: deliveryAddressSchema,
      required: [true, "Delivery address is required"],
    },

    // ===================================================
    // PAYMENT
    // ===================================================

    paymentMethod: {
      type: String,
      enum: {
        values: ["COD", "ONLINE"],
        message: "Invalid payment method",
      },
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: {
        values: [
          "PENDING",
          "PAID",
          "FAILED",
          "REFUNDED",
        ],
        message: "Invalid payment status",
      },
      default: "PENDING",
      index: true,
    },

    paymentReference: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // ===================================================
    // ORDER STATUS
    // ===================================================

    orderStatus: {
      type: String,
      enum: {
        values: [
          "PLACED",
          "CONFIRMED",
          "PREPARING",
          "READY",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
        ],
        message: "Invalid order status",
      },
      default: "PLACED",
      index: true,
    },

    // ===================================================
    // CANCELLATION
    // ===================================================

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // ===================================================
    // DELIVERY TIMESTAMPS
    // ===================================================

    confirmedAt: {
      type: Date,
      default: null,
    },

    preparingAt: {
      type: Date,
      default: null,
    },

    readyAt: {
      type: Date,
      default: null,
    },

    outForDeliveryAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
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
// AUTO CALCULATE ORDER TOTALS
// =====================================================

orderSchema.pre("validate", async function () {
  if (!this.items || this.items.length === 0) {
    return;
  }

  // ---------------------------------------------------
  // Calculate itemTotal
  // ---------------------------------------------------

  for (const item of this.items) {
    if (
      item.price !== undefined &&
      item.quantity !== undefined
    ) {
      item.itemTotal =
        Number(item.price) * Number(item.quantity);
    }

    // -------------------------------------------------
    // Food name snapshot
    // -------------------------------------------------

    if (!item.foodName && item.food) {
      try {
        const Food = mongoose.model("Food");

        const food = await Food.findById(item.food).select(
          "name"
        );

        if (food) {
          item.foodName = food.name;
        }
      } catch (error) {
        console.log(
          "Food name snapshot error:",
          error.message
        );
      }
    }
  }

  // ---------------------------------------------------
  // Calculate subtotal
  // ---------------------------------------------------

  this.subtotal = this.items.reduce(
    (total, item) => {
      return total + Number(item.itemTotal || 0);
    },
    0
  );

  // ---------------------------------------------------
  // Calculate total amount
  // ---------------------------------------------------

  const deliveryFee = Number(this.deliveryFee || 0);

  const discountAmount = Number(
    this.discountAmount || 0
  );

  this.totalAmount =
    this.subtotal +
    deliveryFee -
    discountAmount;

  // Safety
  if (this.totalAmount < 0) {
    this.totalAmount = 0;
  }
});

// =====================================================
// AUTOMATIC ORDER TIMESTAMPS
// =====================================================

orderSchema.pre("save", function () {
  if (
    this.isModified("orderStatus") ||
    this.isNew
  ) {
    switch (this.orderStatus) {
      case "CONFIRMED":
        if (!this.confirmedAt) {
          this.confirmedAt = new Date();
        }
        break;

      case "PREPARING":
        if (!this.preparingAt) {
          this.preparingAt = new Date();
        }
        break;

      case "READY":
        if (!this.readyAt) {
          this.readyAt = new Date();
        }
        break;

      case "OUT_FOR_DELIVERY":
        if (!this.outForDeliveryAt) {
          this.outForDeliveryAt = new Date();
        }
        break;

      case "DELIVERED":
        if (!this.deliveredAt) {
          this.deliveredAt = new Date();
        }
        break;

      case "CANCELLED":
        if (!this.cancelledAt) {
          this.cancelledAt = new Date();
        }
        break;

      default:
        break;
    }
  }
});

// =====================================================
// INDEXES
// =====================================================

// Customer order history
orderSchema.index({
  user: 1,
  createdAt: -1,
});

// Restaurant order management
orderSchema.index({
  restaurant: 1,
  orderStatus: 1,
  createdAt: -1,
});

// Delivery partner assigned orders
orderSchema.index({
  deliveryPartner: 1,
  orderStatus: 1,
  createdAt: -1,
});

// Payment tracking
orderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

// Active orders
orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);