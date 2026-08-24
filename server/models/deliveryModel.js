const mongoose = require("mongoose");

// =====================================================
// DELIVERY PARTNER SCHEMA
// =====================================================

const deliverySchema = new mongoose.Schema(
  {
    // ===================================================
    // LINKED USER ACCOUNT
    // ===================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Delivery user account is required"],
      unique: true,
      index: true,
    },

    // ===================================================
    // BASIC INFORMATION
    // ===================================================

    name: {
      type: String,
      required: [true, "Delivery partner name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      index: true,
      maxlength: [20, "Phone number is too long"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    // ===================================================
    // VEHICLE
    // ===================================================

    vehicleType: {
      type: String,
      enum: {
        values: ["BIKE", "SCOOTER", "BICYCLE"],
        message: "Invalid vehicle type",
      },
      default: "BIKE",
    },

    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      maxlength: [30, "Vehicle number is too long"],
    },

    // ===================================================
    // AVAILABILITY
    // ===================================================

    isAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ===================================================
    // ADMIN ACTIVE STATUS
    // ===================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
// NORMALIZE DATA
// =====================================================

deliverySchema.pre("save", function () {
  if (this.name) {
    this.name = this.name.trim();
  }

  if (this.phone) {
    this.phone = this.phone.trim();
  }

  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (this.vehicleNumber) {
    this.vehicleNumber = this.vehicleNumber
      .trim()
      .toUpperCase();
  }
});

// =====================================================
// INDEXES
// =====================================================

// Find active + available delivery partners quickly
deliverySchema.index({
  isActive: 1,
  isAvailable: 1,
});

// Vehicle lookup
deliverySchema.index({
  vehicleNumber: 1,
});

// Recently registered partners
deliverySchema.index({
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.Delivery ||
  mongoose.model("Delivery", deliverySchema);