const mongoose = require("mongoose");

const groceryOrderItemSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["CATALOGUE", "RATION"],
      default: "CATALOGUE",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroceryProduct",
      required: function () {
        return this.source !== "RATION";
      },
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "g", "litre", "ml", "piece", "pack", "dozen", "bottle", "box"],
    },
    quantity: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          if (this.source === "RATION") {
            return Number.isFinite(value) && value >= 0.001 && value <= 100000;
          }
          return Number.isInteger(value) && value >= 1 && value <= 100;
        },
        message: "Quantity is outside the allowed range for this item source",
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const groceryDeliveryAddressSchema = new mongoose.Schema(
  {
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    contactName: { type: String, required: true, trim: true, maxlength: 100 },
    contactPhone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    pincode: { type: String, required: true, trim: true, maxlength: 10 },
    landmark: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { _id: false }
);

const groceryOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    checkoutKey: {
      type: String,
      trim: true,
      maxlength: 100,
      default: undefined,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderType: {
      type: String,
      enum: ["CATALOGUE", "RATION"],
      default: "CATALOGUE",
      required: true,
      index: true,
    },
    rationRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RationRequest",
      default: null,
    },
    items: {
      type: [groceryOrderItemSchema],
      required: true,
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Grocery order must contain at least one item",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    platformCharge: { type: Number, default: 0, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true, default: undefined },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryAddress: {
      type: groceryDeliveryAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "QR"],
      default: "COD",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentReference: { type: String, trim: true, default: null },
    paymentVerifiedAt: { type: Date, default: null },
    stockReserved: {
      type: Boolean,
      default: false,
      index: true,
    },
    stockRestoredAt: {
      type: Date,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PACKING",
        "READY_FOR_PICKUP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
      index: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      default: null,
      index: true,
    },
    assignedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

groceryOrderSchema.pre("validate", function () {
  const isRationOrder = this.orderType === "RATION";
  const hasRationRequest = this.rationRequest != null;

  if (isRationOrder && !hasRationRequest) {
    this.invalidate(
      "rationRequest",
      "Ration orders must reference an approved ration request"
    );
  }

  if (!isRationOrder && hasRationRequest) {
    this.invalidate(
      "rationRequest",
      "Catalogue orders cannot reference a ration request"
    );
  }

  for (const item of this.items || []) {
    if (item.source !== this.orderType) {
      this.invalidate(
        "items",
        "Order type must match every item's source"
      );
      break;
    }
  }
});

groceryOrderSchema.index(
  { user: 1, checkoutKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      checkoutKey: { $type: "string" },
    },
  }
);

groceryOrderSchema.index(
  { rationRequest: 1 },
  {
    unique: true,
    partialFilterExpression: {
      rationRequest: { $type: "objectId" },
    },
  }
);

groceryOrderSchema.index({ user: 1, createdAt: -1 });
groceryOrderSchema.index({ deliveryPartner: 1, orderStatus: 1, createdAt: -1 });
groceryOrderSchema.index({ orderStatus: 1, createdAt: -1 });

module.exports =
  mongoose.models.GroceryOrder ||
  mongoose.model("GroceryOrder", groceryOrderSchema);
