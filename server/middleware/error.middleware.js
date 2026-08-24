const errorMiddleware = (err, req, res, next) => {
  // ==========================================
  // BASIC ERROR LOG
  // ==========================================
  console.error("API ERROR:", {
    message: err.message,
    name: err.name,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || err.status || 500,
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });

  // ==========================================
  // MONGOOSE VALIDATION ERROR
  // ==========================================
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // ==========================================
  // MONGOOSE CAST ERROR
  // ==========================================
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path || "resource"} ID`,
    });
  }

  // ==========================================
  // MONGODB DUPLICATE KEY ERROR
  // ==========================================
  if (err.code === 11000) {
    const duplicateFields = Object.keys(
      err.keyPattern || err.keyValue || {}
    );

    return res.status(409).json({
      success: false,
      message:
        duplicateFields.length > 0
          ? `Duplicate value already exists for: ${duplicateFields.join(
              ", "
            )}`
          : "Duplicate value already exists",
    });
  }

  // ==========================================
  // JWT INVALID TOKEN
  // ==========================================
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }

  // ==========================================
  // JWT EXPIRED TOKEN
  // ==========================================
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message:
        "Authentication token has expired. Please login again.",
    });
  }

  // ==========================================
  // INVALID JSON BODY
  // ==========================================
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  // ==========================================
  // PAYLOAD TOO LARGE
  // ==========================================
  if (
    err.type === "entity.too.large" ||
    err.status === 413
  ) {
    return res.status(413).json({
      success: false,
      message: "Request payload is too large",
    });
  }

  // ==========================================
  // CUSTOM APPLICATION ERROR
  // ==========================================
  const statusCode = Number(
    err.statusCode || err.status || 500
  );

  const safeStatusCode =
    statusCode >= 400 && statusCode <= 599
      ? statusCode
      : 500;

  // ==========================================
  // PRODUCTION RESPONSE
  // ==========================================
  if (process.env.NODE_ENV === "production") {
    return res.status(safeStatusCode).json({
      success: false,
      message:
        safeStatusCode === 500
          ? "Internal server error"
          : err.message || "Something went wrong",
      ...(err.errors && {
        errors: err.errors,
      }),
    });
  }

  // ==========================================
  // DEVELOPMENT RESPONSE
  // ==========================================
  return res.status(safeStatusCode).json({
    success: false,
    message:
      err.message || "Something went wrong",
    ...(err.errors && {
      errors: err.errors,
    }),
    error: {
      name: err.name,
      stack: err.stack,
    },
  });
};

module.exports = errorMiddleware;