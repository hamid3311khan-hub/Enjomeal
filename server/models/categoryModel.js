const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },

    type: {
      type: String,
      required: [true, "Category type is required"],
      enum: {
        values: ["FOOD", "RESTAURANT", "GROCERY"],
        message: "Type must be FOOD, RESTAURANT or GROCERY",
      },
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    image: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Image URL cannot exceed 2000 characters"],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
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

categorySchema.index(
  { type: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

module.exports =
  mongoose.models.Category ||
  mongoose.model("Category", categorySchema);
