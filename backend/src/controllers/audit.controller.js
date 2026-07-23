  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";

// ==========================================
// GET ALL AUDIT LOGS
// ==========================================

export const getAllAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, eventId, module, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (userId) where.userId = userId;
    if (eventId) where.eventId = eventId;
    if (module) where.module = module;

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { module: { contains: search, mode: "insensitive" } },
      ];
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          event: {
            select: { id: true, name: true, eventReference: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginatedResponse(res, "Audit logs retrieved successfully.", auditLogs, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all audit logs error:", error);
    return errorResponse(res, "Failed to retrieve audit logs.", 500);
  }
};

// ==========================================
// GET AUDIT LOG BY ID
// ==========================================

export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        event: {
          select: { id: true, name: true, eventReference: true },
        },
      },
    });

    if (!auditLog) {
      return errorResponse(res, "Audit log not found.", 404);
    }

    return successResponse(res, "Audit log retrieved successfully.", auditLog);

  } catch (error) {
    console.error("Get audit log by id error:", error);
    return errorResponse(res, "Failed to retrieve audit log.", 500);
  }
};

// ==========================================
// CREATE AUDIT LOG (Internal Use)
// ==========================================

export const createAuditLog = async ({
  userId,
  eventId,
  action,
  module,
  details,
  ipAddress,
  userAgent,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        eventId: eventId || null,
        action,
        module,
        details: details || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error("Create audit log error:", error);
  }
};

// ==========================================
// GET AUDIT LOGS BY EVENT
// ==========================================

export const getEventAuditLogs = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { eventId },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where: { eventId } }),
    ]);

    return paginatedResponse(res, "Event audit logs retrieved successfully.", auditLogs, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get event audit logs error:", error);
    return errorResponse(res, "Failed to retrieve event audit logs.", 500);
  }
};

// ==========================================
// GET AUDIT LOG STATS
// ==========================================

export const getAuditLogStats = async (req, res) => {
  try {
    const [total, byModule, recentActivity] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({
        by: ["module"],
        _count: true,
        orderBy: { _count: { module: "desc" } },
      }),
      prisma.auditLog.findMany({
        include: {
          user: { select: { name: true, role: true } },
          event: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return successResponse(res, "Audit log stats retrieved successfully.", {
      total,
      byModule,
      recentActivity,
    });

  } catch (error) {
    console.error("Get audit log stats error:", error);
    return errorResponse(res, "Failed to retrieve audit log stats.", 500);
  }
};