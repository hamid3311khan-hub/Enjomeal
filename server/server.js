require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const connectDB = require("./database/db");

const requestIdMiddleware = require("./middleware/requestId.middleware");
const {
  generalRateLimiter, } = require("./middleware/rateLimit.middleware");
const notFoundMiddleware = require("./middleware/notFound.middleware");
const errorMiddleware = require("./middleware/error.middleware");
const authMiddleware = require("./middleware/auth.middleware");
const roleMiddleware = require("./middleware/role.middleware");
const deliveryRoutes = require("./routes/delivery.routes");
const adminRoutes = require("./routes/adminRoutes");

// =====================================================
// APP CONFIG
// =====================================================

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

const httpServer = http.createServer(app);

const socketOrigins = [
  "https://enjomeal-customer-web.onrender.com",
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []),
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        NODE_ENV !== "production" ||
        socketOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Socket CORS origin not allowed")
      );
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization
        ?.replace(/^Bearer\s+/i, "")
        ?.trim();

    if (!token) {
      return next(
        new Error("Authentication token is required")
      );
    }

    if (!process.env.JWT_SECRET) {
      return next(
        new Error("Socket authentication is not configured")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!userId) {
      return next(
        new Error("Invalid authentication token")
      );
    }

    const user = await User.findById(userId).select(
      "-password"
    );

    if (!user) {
      return next(
        new Error("User account no longer exists")
      );
    }

    if (user.isActive === false) {
      return next(
        new Error("User account is inactive")
      );
    }

    if (
      ["restaurant", "delivery"].includes(user.role) &&
      user.approvalStatus &&
      user.approvalStatus !== "APPROVED"
    ) {
      return next(
        new Error("User account is not approved")
      );
    }

    socket.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
    };

    return next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error.message
    );

    return next(
      new Error("Socket authentication failed")
    );
  }
});
io.on("connection", (socket) => {
  const userRoom = `user:${socket.user.id}`;
  const roleRoom = `role:${socket.user.role}`;

  socket.join(userRoom);
  socket.join(roleRoom);

  console.log(
    `Socket connected: ${socket.id} | User: ${socket.user.id} | Role: ${socket.user.role}`
  );

  socket.emit("socket:connected", {
    success: true,
    message: "Real-time connection established",
    userId: socket.user.id,
    role: socket.user.role,
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `Socket disconnected: ${socket.id} | User: ${socket.user.id} | Reason: ${reason}`
    );
  });
});
app.disable("x-powered-by");

// =====================================================
// TRUST PROXY
// Required for Render / reverse proxy environments
// =====================================================

if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// =====================================================
// REQUEST ID
// =====================================================

app.use(requestIdMiddleware);

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "https://enjomeal-customer-web.onrender.com",
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []),
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin
      // Example: Thunder Client, Postman, server-to-server
      if (!origin) {
        return callback(null, true);
      }

      // Development fallback
      if (
        NODE_ENV !== "production" &&
        allowedOrigins.length === 0
      ) {
        return callback(null, true);
      }

      // Production requires configured origin
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
    ],
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

// =====================================================
// STATIC FILES
// =====================================================

app.use(
  express.static(
    path.join(__dirname, "../public")
  )
);

// =====================================================
// RATE LIMIT
// =====================================================

app.use(generalRateLimiter);

// =====================================================
// DATABASE
// =====================================================

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const restaurantRoutes = require("./routes/restaurant.routes");

const foodRoutes = require("./routes/foodRoutes");
const cartRoutes = require("./routes/cartRoutes");

const reviewRoutes = require("./routes/review.routes");
const notificationRoutes = require("./routes/notification.routes");
const addressRoutes = require("./routes/address.routes");
const couponRoutes = require("./routes/coupon.routes");
const favoriteRoutes = require("./routes/favorite.routes");

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/restaurants", restaurantRoutes);

app.use("/api/v1/foods", foodRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/addresses", addressRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/favorites", favoriteRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/delivery", deliveryRoutes);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "EnjoMeal API is running",
    environment: NODE_ENV,
    version: "1.0.0",
    requestId: req.requestId,
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "EnjoMeal API is healthy",
    status: "UP",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// =====================================================
// 404 NOT FOUND
// MUST COME AFTER ALL ROUTES
// =====================================================

app.use(notFoundMiddleware);

// =====================================================
// GLOBAL ERROR HANDLER
// MUST BE LAST
// =====================================================

app.use(errorMiddleware);

// =====================================================
// START SERVER AFTER DATABASE CONNECTION
// =====================================================

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = httpServer.listen(PORT, () => {
      console.log("======================================");
      console.log("          EnjoMeal API Server");
      console.log("======================================");
      console.log(`Environment : ${NODE_ENV}`);
      console.log(`Port        : ${PORT}`);
      console.log(`API         : http://localhost:${PORT}`);
      console.log(
        `Health      : http://localhost:${PORT}/api/health`
      );
      console.log("Database    : Connected");
      console.log("======================================");
    });
  } catch (error) {
    console.error("======================================");
    console.error("Failed to start EnjoMeal server");
    console.error("======================================");
    console.error(error.message);

    process.exit(1);
  }
};

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down...`);

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("SIGINT", () => shutdown("SIGINT"));

// =====================================================
// PROCESS ERROR HANDLERS
// =====================================================

process.on("unhandledRejection", (error) => {
  console.error(
    "Unhandled Promise Rejection:",
    error
  );

  shutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error) => {
  console.error(
    "Uncaught Exception:",
    error
  );

  shutdown("UNCAUGHT_EXCEPTION");
});

// =====================================================
// START
// =====================================================

startServer();

module.exports = app;
