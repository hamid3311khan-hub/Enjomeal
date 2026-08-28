const rateLimit = require("express-rate-limit");

// ==========================================
// GENERAL API LIMIT
// ==========================================
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ==========================================
// AUTH LIMIT
// Login / Register जैसे endpoints के लिए
// ==========================================
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

// ==========================================
// SENSITIVE ACTION LIMIT
// Order / payment जैसी sensitive APIs
// ==========================================
const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests for this operation. Please try again later.",
  },
});
// ==========================================
// PASSWORD RESET LIMIT
// Forgot Password / OTP verification
// ==========================================
const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many password reset attempts. Please try again later.",
  },
});

module.exports = {
  generalRateLimiter,
  authRateLimiter,
  sensitiveRateLimiter,
  passwordResetRateLimiter
};
