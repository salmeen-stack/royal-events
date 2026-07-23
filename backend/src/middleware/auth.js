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

    // Check if event owner access should be revoked (7 days after event)
    if (user.role === "EVENT_OWNER") {
      const eventOwner = await prisma.eventOwner.findUnique({
        where: { email: user.email },
        include: {
          events: {
            select: {
              eventDate: true,
              status: true,
            },
          },
        },
      });

      if (eventOwner && eventOwner.events.length > 0) {
        const now = new Date();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        
        // Check if all events are completed and 7 days have passed
        const allEventsExpired = eventOwner.events.every(event => {
          const eventDate = new Date(event.eventDate);
          const daysSinceEvent = now - eventDate;
          return daysSinceEvent > sevenDaysInMs;
        });

        if (allEventsExpired) {
          // Deactivate the user account
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: false },
          });
          return errorResponse(res, "Your access has been revoked as all your events have concluded.", 401);
        }
      }
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