const mongoose = require("mongoose");

// =====================================================
// TICKET SCHEMA
// =====================================================

const ticketSchema = new mongoose.Schema(
  {
    // ==========================================
    // CUSTOMER
    // ==========================================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // TICKET NUMBER
    // ==========================================

    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ==========================================
    // SUBJECT
    // ==========================================

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // ==========================================
    // MESSAGE
    // ==========================================

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // ==========================================
    // CATEGORY
    // ==========================================

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

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
      ],
      default: "OPEN",
    },

    // ==========================================
    // ADMIN REPLY
    // ==========================================

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

ticketSchema.pre(
  "validate",
  async function (next) {
    try {
      if (this.ticketNumber) {
        return next();
      }

      const random =
        Math.floor(
          1000 + Math.random() * 9000
        );

      this.ticketNumber =
        `ENJO-${Date.now()}-${random}`;

      next();
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// EXPORT MODEL
// =====================================================

const Ticket = mongoose.model(
  "Ticket",
  ticketSchema
);

module.exports = Ticket;
