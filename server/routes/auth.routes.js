const express = require("express");

const {
  register,
  login,
  profile,
  resetUserPassword,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {
  passwordResetRateLimiter,
} = require("../middleware/rateLimit.middleware");

const router = express.Router();

// =====================================================
// REGISTER
// PUBLIC
// =====================================================

router.post(
  "/register",
  register
);

// =====================================================
// LOGIN
// PUBLIC
// =====================================================

router.post(
  "/login",
  login
);

// =====================================================
// GET MY PROFILE
// AUTHENTICATED USER
// =====================================================

router.get(
  "/profile",
  authMiddleware,
  profile
);

// =====================================================
// FORGOT PASSWORD
// PUBLIC
// Sends OTP to registered email
// =====================================================

router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  forgotPassword
);

// =====================================================
// VERIFY PASSWORD RESET OTP
// PUBLIC
// Returns short-lived reset token
// =====================================================

router.post(
  "/verify-reset-otp",
  passwordResetRateLimiter,
  verifyResetOTP
);

// =====================================================
// RESET PASSWORD
// PUBLIC WITH RESET TOKEN
// =====================================================

router.post(
  "/reset-password",
  passwordResetRateLimiter,
  resetPassword
);

// =====================================================
// RESET USER PASSWORD
// ADMIN ONLY
// =====================================================

router.put(
  "/reset-password/:userId",
  authMiddleware,
  roleMiddleware("admin"),
  resetUserPassword
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
