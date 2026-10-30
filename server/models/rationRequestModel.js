const mongoose = require("mongoose");

const rationItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
      max: 100000,
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "g", "litre", "ml", "piece", "pack", "dozen", "bottle", "box"],
    },
    brand: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    image: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2048,
    },
    imagePublicId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 255,
    },
    availability: {
      type: String,
      enum: ["PENDING", "AVAILABLE", "UNAVAILABLE"],
      default: "PENDING",
    },
    quotedPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    customerDecision: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REMOVED", "DEFERRED"],
      default: "PENDING",
    },
  },
  { _id: true }
);

const rationRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [rationItemSchema],
      required: true,
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0 && items.length <= 50;
        },
        message: "A ration request must contain between 1 and 50 items",
      },
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    customerNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    requestStatus: {
      type: String,
      enum: ["SUBMITTED", "QUOTATION_READY", "APPROVED", "ORDERED", "CANCELLED"],
      default: "SUBMITTED",
      index: true,
    },
    quotationVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    quotationTotal: {
      type: Number,
      default: null,
      min: 0,
    },
    approvedTotal: {
      type: Number,
      default: null,
      min: 0,
    },
    quotationUpdatedAt: {
      type: Date,
      default: null,
    },
    customerApprovedAt: {
      type: Date,
      default: null,
    },
    customerApprovedVersion: {
      type: Number,
      default: null,
    },
    groceryOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroceryOrder",
      default: null,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    strict: true,
    optimisticConcurrency: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

rationRequestSchema.index({ user: 1, createdAt: -1 });
rationRequestSchema.index({ requestStatus: 1, createdAt: -1 });

module.exports =
  mongoose.models.RationRequest ||
  mongoose.model("RationRequest", rationRequestSchema);
