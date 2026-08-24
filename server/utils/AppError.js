class AppError extends Error {
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;

    if (errors !== undefined) {
      this.errors = errors;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;