const mongoose = require("mongoose");

// =====================================================
// SUPPORT TICKET SCHEMA
// =====================================================

const ticketSchema = new mongoose.Schema(
  {
    // =================================================
    // CUSTOMER
    // =================================================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =================================================
    // TICKET DETAILS
    // =================================================

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },

    category: {
      type: String,
      enum: [
        "ORDER",
        "PAYMENT",
        "DELIVERY",
        "REFUND",
        "ACCOUNT",
        "OTHER",
      ],
      default: "OTHER",
      index: true,
    },

    // =================================================
    // STATUS
    // =================================================

    status: {
      type: String,
      enum: [
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
      ],
      default: "OPEN",
      index: true,
    },

    // =================================================
    // ADMIN RESPONSE
    // =================================================

    adminReply: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

ticketSchema.index({
  customer: 1,
  status: 1,
});

ticketSchema.index({
  status: 1,
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.Ticket ||
  mongoose.model("Ticket", ticketSchema);
