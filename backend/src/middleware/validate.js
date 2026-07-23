import { errorResponse } from "../utils/response.js";

// ==========================================
// VALIDATE REQUIRED FIELDS
// ==========================================

export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      if (
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
      ) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return errorResponse(
        res,
        `Missing required fields: ${missing.join(", ")}`,
        400
      );
    }

    next();
  };
};

// ==========================================
// VALIDATE PAGINATION QUERY
// ==========================================

export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return errorResponse(res, "Page must be a positive number.", 400);
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return errorResponse(res, "Limit must be between 1 and 100.", 400);
  }

  next();
};

// ==========================================
// VALIDATE UUID PARAM
// ==========================================

export const validateUUID = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return errorResponse(res, `Invalid ${paramName} format.`, 400);
    }

    next();
  };
};

// ==========================================
// VALIDATE EMAIL FORMAT
// ==========================================

export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "Invalid email format.", 400);
    }
  }

  next();
};

// ==========================================
// VALIDATE PHONE FORMAT
// ==========================================

export const validatePhone = (req, res, next) => {
  const { phone } = req.body;

  if (phone) {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return errorResponse(res, "Invalid phone number format.", 400);
    }
  }

  next();
};

// ==========================================
// VALIDATE AMOUNT
// ==========================================

export const validateAmount = (req, res, next) => {
  const { amount } = req.body;

  if (amount !== undefined) {
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return errorResponse(res, "Amount must be a positive number.", 400);
    }
  }

  next();
};

// ==========================================
// VALIDATE DATE FORMAT
// ==========================================

export const validateDate = (fieldName) => {
  return (req, res, next) => {
    const date = req.body[fieldName];

    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return errorResponse(res, `Invalid date format for ${fieldName}.`, 400);
      }
    }

    next();
  };
};

// ==========================================
// RATE LIMITER MIDDLEWARE
// ==========================================

const requestCounts = new Map();

export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, startTime: now });
      return next();
    }

    const data = requestCounts.get(key);

    if (now - data.startTime > windowMs) {
      requestCounts.set(key, { count: 1, startTime: now });
      return next();
    }

    if (data.count >= maxRequests) {
      return errorResponse(
        res,
        "Too many requests. Please try again later.",
        429
      );
    }

    data.count++;
    next();
  };
};