const successResponse = (
  res,
  {
    statusCode = 200,
    message = "Request successful",
    data = {},
  } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const errorResponse = (
  res,
  {
    statusCode = 500,
    message = "Internal server error",
    errors = undefined,
  } = {}
) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};