const express = require("express");

const {
  register,
  login,
  profile,
  resetUserPassword,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  otpLogin,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {
  authRateLimiter,
  passwordResetRateLimiter,
} = require("../middleware/rateLimit.middleware");

const router = express.Router();

// =====================================================
// REGISTER
// PUBLIC
// =====================================================

router.post(
  "/register",
  authRateLimiter,
  register
);

// =====================================================
// LOGIN
// PUBLIC
// =====================================================

router.post(
  "/login",
  authRateLimiter,
  login
);

// =====================================================
// OTP LOGIN
// CUSTOMER / RESTAURANT / DELIVERY
// PUBLIC
// =====================================================

router.post(
  "/otp-login",
  authRateLimiter,
  otpLogin
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
