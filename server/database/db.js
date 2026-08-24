const mongoose = require("mongoose");

// =====================================================
// DATABASE CONFIG
// =====================================================

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGO_URI is not defined in environment variables."
      );
    }

    // Avoid unnecessary reconnect attempt
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected.");
      return;
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log("======================================");
    console.log("MongoDB Connected Successfully");
    console.log(`Database: ${mongoose.connection.name}`);
    console.log("======================================");
  } catch (error) {
    console.error("======================================");
    console.error("MongoDB Connection Failed");
    console.error("======================================");
    console.error(error.message);

    throw error;
  }
};

// =====================================================
// DATABASE EVENTS
// =====================================================

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established.");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB runtime error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

// =====================================================
// EXPORT
// =====================================================

module.exports = connectDB;