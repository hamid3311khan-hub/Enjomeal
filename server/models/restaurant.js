const mongoose = require("mongoose");

// =====================================================
// RESTAURANT SCHEMA
// =====================================================

const restaurantSchema = new mongoose.Schema(
  {
    // ===================================================
    // BASIC RESTAURANT INFORMATION
    // ===================================================

    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      minlength: [2, "Restaurant name must be at least 2 characters"],
      maxlength: [150, "Restaurant name cannot exceed 150 characters"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Restaurant owner is required"],
      index: true,
    },

    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      minlength: [2, "Owner name must be at least 2 characters"],
      maxlength: [100, "Owner name cannot exceed 100 characters"],
    },

    // ===================================================
    // CONTACT INFORMATION
    // ===================================================

    email: {
      type: String,
      required: [true, "Restaurant email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid restaurant email",
      ],
    },

    phone: {
      type: String,
      required: [true, "Restaurant phone is required"],
      unique: true,
      trim: true,
      index: true,
      maxlength: [20, "Phone number is too long"],
    },

    // ===================================================
    // ADDRESS
    // ===================================================

    address: {
      type: String,
      required: [true, "Restaurant address is required"],
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
      index: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
      index: true,
    },

    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [
        /^[0-9]{6}$/,
        "Please provide a valid 6-digit pincode",
      ],
      index: true,
    },

    // ===================================================
    // RESTAURANT CATEGORY
    // ===================================================

    cuisine: {
      type: [String],
      default: [],
      validate: {
        validator: function (cuisine) {
          return cuisine.every(
            (item) =>
              typeof item === "string" &&
              item.trim().length > 0 &&
              item.trim().length <= 50
          );
        },
        message: "Invalid cuisine value",
      },
    },

    // ===================================================
    // RESTAURANT IMAGE
    // ===================================================

    image: {
      type: String,
      default: "",
      trim: true,
    },

    // ===================================================
    // RESTAURANT STATUS
    // ===================================================

    isOpen: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ===================================================
    // RATING
    // ===================================================

    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
    },

    // ===================================================
    // ADMIN APPROVAL
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
      default: "PENDING",
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

// =====================================================
// NORMALIZE DATA
// =====================================================

restaurantSchema.pre("save", function () {
  if (this.name) {
    this.name = this.name.trim();
  }

  if (this.ownerName) {
    this.ownerName = this.ownerName.trim();
  }

  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (this.phone) {
    this.phone = this.phone.trim();
  }

  if (this.address) {
    this.address = this.address.trim();
  }

  if (this.city) {
    this.city = this.city.trim();
  }

  if (this.state) {
    this.state = this.state.trim();
  }

  if (this.pincode) {
    this.pincode = this.pincode.trim();
  }

  if (Array.isArray(this.cuisine)) {
    this.cuisine = [
      ...new Set(
        this.cuisine
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }
});

// =====================================================
// INDEXES
// =====================================================

// Admin restaurant approval listing
restaurantSchema.index({
  approvalStatus: 1,
  isActive: 1,
});

// Restaurant discovery
restaurantSchema.index({
  city: 1,
  isActive: 1,
  isOpen: 1,
});

// Restaurant discovery by cuisine
restaurantSchema.index({
  cuisine: 1,
  isActive: 1,
});

// Rating based restaurant listing
restaurantSchema.index({
  rating: -1,
  isActive: 1,
});

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.Restaurant ||
  mongoose.model("Restaurant", restaurantSchema);