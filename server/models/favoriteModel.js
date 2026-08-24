const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same customer same food ko duplicate favorite nahi kar sakta
favoriteSchema.index(
  { user: 1, food: 1 },
  { unique: true }
);

module.exports = mongoose.model("Favorite", favoriteSchema);