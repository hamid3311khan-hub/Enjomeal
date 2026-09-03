const mongoose = require("mongoose");

// =====================================================
// SUPPORT TICKET SCHEMA
// =====================================================

const ticketSchema = new mongoose.Schema(
  {
    // =================================================
    // TICKET NUMBER
    // Example: ENJO-2026-000001
    // =================================================

    ticketNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

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
// AUTO GENERATE TICKET NUMBER
// =====================================================

ticketSchema.pre(
  "save",
  async function (next) {
    try {
      // Existing ticket number already present
      if (this.ticketNumber) {
        return next();
      }

      const year = new Date().getFullYear();

      const Ticket =
        mongoose.models.Ticket;

      const lastTicket =
        await Ticket.findOne({
          ticketNumber: {
            $regex: `^ENJO-${year}-`,
          },
        })
          .sort({
            createdAt: -1,
          })
          .select("ticketNumber");

      let nextNumber = 1;

      if (
        lastTicket &&
        lastTicket.ticketNumber
      ) {
        const parts =
          lastTicket.ticketNumber.split("-");

        const lastNumber =
          parseInt(
            parts[2],
            10
          );

        if (!isNaN(lastNumber)) {
          nextNumber =
            lastNumber + 1;
        }
      }

      const serial =
        String(nextNumber).padStart(
          6,
          "0"
        );

      this.ticketNumber =
        `ENJO-${year}-${serial}`;

      return next();
    } catch (error) {
      return next(error);
    }
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
