const crypto = require("crypto");

const requestIdMiddleware = (req, res, next) => {
  const incomingRequestId = req.headers["x-request-id"];

  const requestId =
    typeof incomingRequestId === "string" &&
    incomingRequestId.trim().length > 0
      ? incomingRequestId.trim().slice(0, 100)
      : crypto.randomUUID();

  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  next();
};

module.exports = requestIdMiddleware;