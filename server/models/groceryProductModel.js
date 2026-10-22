const mongoose = require("mongoose");

const groceryProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [150, "Product name cannot exceed 150 characters"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Grocery category is required"],
      index: true,
    },

    image: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Image URL cannot exceed 2000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Price cannot be negative"],
    },

    mrp: {
      type: Number,
      default: null,
      min: [0, "MRP cannot be negative"],
      validate: {
        validator(value) {
          return value == null || value >= this.price;
        },
        message: "MRP must be greater than or equal to selling price",
      },
    },

    unit: {
      type: String,
      enum: [
        "kg",
        "g",
        "litre",
        "ml",
        "piece",
        "pack",
        "dozen",
        "bottle",
        "box",
      ],
      default: "piece",
      required: true,
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, "Stock quantity cannot be negative"],
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

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
  }
);

groceryProductSchema.index({
  isActive: 1,
  isAvailable: 1,
  category: 1,
  createdAt: -1,
});

groceryProductSchema.index({
  name: "text",
  description: "text",
});

module.exports =
  mongoose.models.GroceryProduct ||
  mongoose.model("GroceryProduct", groceryProductSchema);
