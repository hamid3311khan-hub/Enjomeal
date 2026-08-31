const AppError = require("../utils/AppError");

const roleMiddleware = (...allowedRoles) => {
  // ==========================================
  // VALIDATE CONFIGURATION
  // ==========================================
  if (allowedRoles.length === 0) {
    throw new Error(
      "roleMiddleware requires at least one allowed role"
    );
  }

  return (req, res, next) => {
    try {
      // ==========================================
      // AUTHENTICATION CHECK
      // ==========================================
      if (!req.user) {
        return next(
          new AppError(
            "Authentication required.",
            401
          )
        );
      }

      // ==========================================
      // ROLE CHECK
      // ==========================================
      if (!allowedRoles.includes(req.user.role)) {
        return next(
          new AppError(
            "Access denied. You do not have permission to perform this action.",
            403
          )
        );
      }

      // ==========================================
      // AUTHORIZED
      // ==========================================
      return next();
    } catch (error) {
      console.error(
        "Role Middleware Error:",
        error.message
      );

      return next(
        new AppError(
          "Authorization service error.",
          500
        )
      );
    }
  };
};

module.exports = roleMiddleware;
