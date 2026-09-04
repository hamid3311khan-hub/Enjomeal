const mongoose = require("mongoose");

// =====================================================
// TICKET SCHEMA
// =====================================================

const ticketSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ticketNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      enum: [
        "ORDER ISSUE",
        "PAYMENT",
        "DELIVERY",
        "REFUND",
        "ACCOUNT",
        "OTHER",
      ],
      default: "OTHER",
    },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },

    adminReply: {
      type: String,
      trim: true,
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
// AUTO GENERATE TICKET NUMBER
// =====================================================

ticketSchema.pre("validate", function (next) {
  if (!this.ticketNumber) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.ticketNumber = `ENJO-${Date.now()}-${random}`;
  }
  next();
});

// =====================================================
// EXPORT MODEL
// =====================================================

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
