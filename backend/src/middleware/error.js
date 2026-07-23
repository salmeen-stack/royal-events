import { errorResponse } from "../utils/response.js";

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

export const globalErrorHandler = (err, req, res, next) => {
  console.error("==========================================");
  console.error("❌ Global Error Handler");
  console.error("==========================================");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  console.error("==========================================");

  // Prisma errors
  if (err.code === "P2002") {
    return errorResponse(
      res,
      "A record with this information already exists.",
      409
    );
  }

  if (err.code === "P2025") {
    return errorResponse(res, "Record not found.", 404);
  }

  if (err.code === "P2003") {
    return errorResponse(
      res,
      "Related record not found. Please check your input.",
      400
    );
  }

  if (err.code === "P2014") {
    return errorResponse(
      res,
      "The change would violate a required relation.",
      400
    );
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Invalid token.", 401);
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Token has expired. Please login again.", 401);
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return errorResponse(res, "File size exceeds the allowed limit.", 400);
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return errorResponse(res, "Unexpected file field.", 400);
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return errorResponse(res, err.message, 400);
  }

  // Syntax errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return errorResponse(res, "Invalid JSON in request body.", 400);
  }

  // Default error
  return errorResponse(
    res,
    process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : err.message || "Internal server error.",
    err.status || 500
  );
};

// ==========================================
// NOT FOUND HANDLER
// ==========================================

export const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    `Route ${req.method} ${req.originalUrl} not found.`,
    404
  );
};

// ==========================================
// ASYNC HANDLER WRAPPER
// ==========================================

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};