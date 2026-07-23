import { verifyToken } from "../utils/token.js";
import { errorResponse } from "../utils/response.js";
import prisma from "../config/prisma.js";

// ==========================================
// AUTHENTICATE TOKEN
// ==========================================

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Access denied. No token provided.", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return errorResponse(res, "User not found.", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Account is deactivated.", 401);
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return errorResponse(res, "Invalid token.", 401);
    }
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, "Token has expired.", 401);
    }
    return errorResponse(res, "Authentication failed.", 401);
  }
};

// ==========================================
// AUTHORIZE ROLES
// ==========================================

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Not authenticated.", 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        "Access denied. You do not have permission to perform this action.",
        403
      );
    }

    next();
  };
};

// ==========================================
// ROLE SHORTCUTS
// ==========================================

export const isSuperAdmin = authorize("SUPER_ADMIN");

export const isStaff = authorize("SUPER_ADMIN", "STAFF");

export const isEventOwner = authorize("SUPER_ADMIN", "STAFF", "EVENT_OWNER");