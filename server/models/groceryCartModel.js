const mongoose = require("mongoose");

const groceryCartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroceryProduct",
      required: [true, "Grocery product is required"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      max: [100, "Quantity cannot exceed 100"],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: false }
);

const groceryCartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [groceryCartItemSchema],
      default: [],
      validate: {
        validator(items) {
          return items.length <= 100;
        },
        message: "Grocery cart cannot contain more than 100 items",
      },
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, "Total amount cannot be negative"],
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

groceryCartSchema.pre("save", function () {
  this.totalAmount = (this.items || []).reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );
});

module.exports =
  mongoose.models.GroceryCart ||
  mongoose.model("GroceryCart", groceryCartSchema);
