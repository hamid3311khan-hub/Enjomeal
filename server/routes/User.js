const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 150,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    role: {
      type: String,
      enum: ["customer", "restaurant", "delivery", "admin"],
      default: "customer",
      index: true,
    },

    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize email before saving
userSchema.pre("save", function (next) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  next();
});

module.exports = mongoose.model("User", userSchema);