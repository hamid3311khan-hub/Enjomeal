const mongoose = require("mongoose");

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
  {
    // ===================================================
    // BASIC INFORMATION
    // ===================================================

    name: {
      type: String,

      // Customer OTP account ke liye name abhi required nahi
      // Restaurant / Delivery / Admin ke liye required
      required: function () {
        return this.role !== "customer";
      },

      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,

      // Customer OTP account ke liye email required nahi
      // Restaurant / Delivery / Admin ke liye required
      required: function () {
        return this.role !== "customer";
      },

      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: [150, "Email cannot exceed 150 characters"],

      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,

      // Customer OTP login mein password nahi hoga
      // Restaurant / Delivery / Admin ke liye password required
      required: function () {
        return this.role !== "customer";
      },

      select: false,
      minlength: [6, "Password must be at least 6 characters"],
    },

    phone: {
      type: String,
      trim: true,
      default: null,
      maxlength: [20, "Phone number is too long"],
      index: true,
    },

    // ===================================================
    // USER ROLE
    // ===================================================

    role: {
      type: String,
      enum: {
        values: [
          "customer",
          "restaurant",
          "delivery",
          "admin",
        ],
        message: "Invalid user role",
      },
      default: "customer",
      index: true,
    },

    // ===================================================
    // ACCOUNT APPROVAL
    // ===================================================

    approvalStatus: {
      type: String,
      enum: {
        values: [
          "PENDING",
          "APPROVED",
          "REJECTED",
        ],
        message: "Invalid approval status",
      },
      default: "APPROVED",
      index: true,
    },

    // ===================================================
    // ACCOUNT ACTIVE STATUS
    // ===================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ===================================================
    // PASSWORD RESET
    // ===================================================

    resetPasswordOTPHash: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordOTPExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },

  {
    timestamps: true,

    // Prevent accidental fields from being silently stored
    strict: true,

    // Return virtual fields when converting to JSON
    toJSON: {
      virtuals: true,

      transform: (doc, ret) => {
        delete ret.password;
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
// NORMALIZE EMAIL / PHONE / NAME
// =====================================================

userSchema.pre("save", function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (this.name) {
    this.name = this.name.trim();
  }

  if (this.phone) {
    this.phone = this.phone.trim();
  }
});

// =====================================================
// INDEXES
// =====================================================

userSchema.index({
  role: 1,
  approvalStatus: 1,
});

userSchema.index({
  role: 1,
  isActive: 1,
});

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
