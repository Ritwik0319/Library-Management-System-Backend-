// Custom error handler class
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Custom error middleware
export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error.";
  err.statusCode = err.statusCode || 500;

  // Duplicate key error
  if (err.code === 11000) {
    err = new ErrorHandler("Duplicate field value entered.", 400);
  }

  // Invalid JWT
  if (err.name === "JsonWebTokenError") {
    err = new ErrorHandler("JSON Web Token is invalid. Try again.", 400);
  }

  // Expired JWT
  if (err.name === "TokenExpiredError") {
    err = new ErrorHandler("JSON Web Token has expired. Try again.", 400);
  }

  // Invalid ObjectId or datatype
  if (err.name === "CastError") {
    err = new ErrorHandler(`Resource not found: Invalid ${err.path}`, 400);
  }

  // Handle multiple validation errors
  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((e) => e.message)
        .join(" ")
    : err.message;

  return res
    .status(err.statusCode)
    .json({ success: false, message: errorMessage });
};

export default ErrorHandler;
