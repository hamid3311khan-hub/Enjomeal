const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const AppError = require("../utils/AppError");

const authMiddleware = async (req, res, next) => {
  try {
    // ==========================================
    // CHECK JWT SECRET
    // ==========================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return next(
        new AppError(
          "Authentication service is not configured",
          500
        )
      );
    }

    // ==========================================
    // GET AUTHORIZATION HEADER
    // ==========================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(
        new AppError(
          "Authentication required. Please login first.",
          401
        )
      );
    }

    // ==========================================
    // VALIDATE BEARER FORMAT
    // ==========================================

    if (!authHeader.startsWith("Bearer ")) {
      return next(
        new AppError(
          "Invalid authorization format. Use Bearer token.",
          401
        )
      );
    }

    // ==========================================
    // EXTRACT TOKEN
    // ==========================================

    const token = authHeader.substring(7).trim();

    if (!token) {
      return next(
        new AppError(
          "Authentication token is missing.",
          401
        )
      );
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log(
      "JWT Decoded Payload:",
      decoded
    );

    // ==========================================
    // GET USER ID
    // SUPPORT:
    // id
    // userId
    // _id
    // ==========================================

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!userId) {
      return next(
        new AppError(
          "Invalid authentication token. User ID not found.",
          401
        )
      );
    }

    // ==========================================
    // VALIDATE USER ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return next(
        new AppError(
          "Invalid user authentication data.",
          401
        )
      );
    }

    // ==========================================
    // FIND CURRENT USER
    // ==========================================

    const user =
      await User.findById(userId).select(
        "-password"
      );

    if (!user) {
      return next(
        new AppError(
          "User account no longer exists.",
          401
        )
      );
    }

    // ==========================================
    // ACCOUNT ACTIVE CHECK
    // ==========================================

    if (user.isActive === false) {
      return next(
        new AppError(
          "Your account is inactive. Please contact support.",
          403
        )
      );
    }

    // ==========================================
    // RESTAURANT / DELIVERY APPROVAL CHECK
    // ==========================================

    if (
      ["restaurant", "delivery"].includes(
        user.role
      )
    ) {
      if (
        user.approvalStatus &&
        user.approvalStatus !== "APPROVED"
      ) {
        const status =
          user.approvalStatus.toLowerCase();

        return next(
          new AppError(
            `Your ${user.role} account is ${status}.`,
            403
          )
        );
      }
    }

    // ==========================================
    // ATTACH CURRENT USER
    // ==========================================

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      approvalStatus:
        user.approvalStatus,
      isActive: user.isActive,
    };

    // ==========================================
    // DEBUG
    // ==========================================

    console.log(
      "Authenticated User:",
      {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
      }
    );

    // ==========================================
    // CONTINUE
    // ==========================================

    return next();

  } catch (error) {
    console.error(
      "Auth Middleware Error:",
      error.message
    );

    // ==========================================
    // TOKEN EXPIRED
    // ==========================================

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return next(
        new AppError(
          "Authentication token has expired. Please login again.",
          401
        )
      );
    }

    // ==========================================
    // INVALID JWT
    // ==========================================

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return next(
        new AppError(
          "Invalid authentication token.",
          401
        )
      );
    }

    // ==========================================
    // OTHER ERRORS
    // ==========================================

    return next(
      new AppError(
        "Authentication service error.",
        500
      )
    );
  }
};

module.exports = authMiddleware;