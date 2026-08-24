const mongoose = require("mongoose");

// =====================================================
// FOOD SCHEMA
// =====================================================

const foodSchema = new mongoose.Schema(
  {
    // ===================================================
    // FOOD NAME
    // ===================================================

    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      minlength: [2, "Food name must be at least 2 characters"],
      maxlength: [150, "Food name cannot exceed 150 characters"],
    },

    // ===================================================
    // DESCRIPTION
    // ===================================================

    description: {
      type: String,
      required: [true, "Food description is required"],
      trim: true,
      minlength: [2, "Description must be at least 2 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // ===================================================
    // PRICE
    // ===================================================

    price: {
      type: Number,
      required: [true, "Food price is required"],
      min: [0, "Price cannot be negative"],
      max: [1000000, "Price cannot exceed 10,00,000"],
    },

    // ===================================================
    // FOOD IMAGE
    // ===================================================

    image: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Image URL is too long"],
    },

    // ===================================================
    // CATEGORY
    // ===================================================

    category: {
      type: String,
      required: [true, "Food category is required"],
      trim: true,
      minlength: [2, "Category must be at least 2 characters"],
      maxlength: [100, "Category cannot exceed 100 characters"],
      index: true,
    },

    // ===================================================
    // RESTAURANT
    // ===================================================

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant is required"],
      index: true,
    },

    // ===================================================
    // AVAILABILITY
    // ===================================================

    isAvailable: {
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
// IMPORTANT:
// Do NOT use next() here.
// =====================================================

foodSchema.pre("save", function () {
  if (this.name) {
    this.name = this.name.trim();
  }

  if (this.description) {
    this.description = this.description.trim();
  }

  if (this.category) {
    this.category = this.category.trim();
  }

  if (this.image) {
    this.image = this.image.trim();
  }
});

// =====================================================
// INDEXES
// =====================================================

// Restaurant food listing
foodSchema.index({
  restaurant: 1,
  isAvailable: 1,
});

// Restaurant + category filtering
foodSchema.index({
  restaurant: 1,
  category: 1,
  isAvailable: 1,
});

// Category filtering
foodSchema.index({
  category: 1,
  isAvailable: 1,
});

// Search
foodSchema.index({
  name: "text",
  description: "text",
});

// Recent foods
foodSchema.index({
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.Food ||
  mongoose.model("Food", foodSchema);