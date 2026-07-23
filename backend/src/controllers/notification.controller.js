  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import { sendSMS, sendContributionReminderSMS } from "../services/sms.service.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";

// ==========================================
// GET ALL NOTIFICATIONS
// ==========================================

export const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, type, channel, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (eventId) where.eventId = eventId;
    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { guest: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          guest: {
            select: { id: true, name: true, phone: true },
          },
          event: {
            select: { id: true, name: true, eventReference: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({ where }),
    ]);

    return paginatedResponse(res, "Notifications retrieved successfully.", notifications, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all notifications error:", error);
    return errorResponse(res, "Failed to retrieve notifications.", 500);
  }
};

// ==========================================
// GET NOTIFICATION BY ID
// ==========================================

export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        guest: true,
        event: {
          select: { id: true, name: true, eventReference: true },
        },
      },
    });

    if (!notification) {
      return errorResponse(res, "Notification not found.", 404);
    }

    return successResponse(res, "Notification retrieved successfully.", notification);

  } catch (error) {
    console.error("Get notification by id error:", error);
    return errorResponse(res, "Failed to retrieve notification.", 500);
  }
};

// ==========================================
// SEND MANUAL SMS
// ==========================================

export const sendManualSMS = async (req, res) => {
  try {
    const { guestId, eventId, message } = req.body;

    if (!guestId || !message) {
      return errorResponse(res, "Guest ID and message are required.");
    }

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });

    if (!guest) {
      return errorResponse(res, "Guest not found.", 404);
    }

    const result = await sendSMS({
      to: guest.phone,
      message,
      eventId: eventId || null,
      guestId,
      type: "CONTRIBUTION_REMINDER",
    });

    if (!result.success) {
      return errorResponse(res, `Failed to send SMS: ${result.error}`);
    }

    return successResponse(res, "SMS sent successfully.", result);

  } catch (error) {
    console.error("Send manual SMS error:", error);
    return errorResponse(res, "Failed to send SMS.", 500);
  }
};

// ==========================================
// SEND MANUAL WHATSAPP
// ==========================================

export const sendManualWhatsApp = async (req, res) => {
  try {
    const { guestId, eventId, message } = req.body;

    if (!guestId || !message) {
      return errorResponse(res, "Guest ID and message are required.");
    }

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });

    if (!guest) {
      return errorResponse(res, "Guest not found.", 404);
    }

    const result = await sendWhatsAppMessage({
      to: guest.phone,
      message,
      eventId: eventId || null,
      guestId,
      type: "CONTRIBUTION_REMINDER",
    });

    if (!result.success) {
      return errorResponse(res, `Failed to send WhatsApp message: ${result.error}`);
    }

    return successResponse(res, "WhatsApp message sent successfully.", result);

  } catch (error) {
    console.error("Send manual WhatsApp error:", error);
    return errorResponse(res, "Failed to send WhatsApp message.", 500);
  }
};

// ==========================================
// SEND BULK CONTRIBUTION REMINDERS
// ==========================================

export const sendBulkContributionReminders = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return errorResponse(res, "Event ID is required.");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    // Get all unpaid or partial contributions
    const pendingContributions = await prisma.contribution.findMany({
      where: {
        eventId,
        status: { in: ["PENDING", "PARTIAL"] },
      },
      include: {
        guest: true,
      },
    });

    if (pendingContributions.length === 0) {
      return errorResponse(res, "No pending contributions found for this event.");
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const contribution of pendingContributions) {
      const result = await sendContributionReminderSMS({
        guest: contribution.guest,
        event,
        contributionLink: contribution.contributionLink,
        balanceAmount: contribution.balanceAmount,
      });

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          guest: contribution.guest.name,
          error: result.error,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return successResponse(
      res,
      `Contribution reminders sent to ${results.success} guests.`,
      results
    );

  } catch (error) {
    console.error("Send bulk contribution reminders error:", error);
    return errorResponse(res, "Failed to send bulk reminders.", 500);
  }
};

// ==========================================
// GET NOTIFICATION STATS FOR EVENT
// ==========================================

export const getEventNotificationStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [total, byChannel, byStatus, byType] = await Promise.all([
      prisma.notification.count({ where: { eventId } }),
      prisma.notification.groupBy({
        by: ["channel"],
        where: { eventId },
        _count: true,
      }),
      prisma.notification.groupBy({
        by: ["status"],
        where: { eventId },
        _count: true,
      }),
      prisma.notification.groupBy({
        by: ["type"],
        where: { eventId },
        _count: true,
      }),
    ]);

    return successResponse(res, "Notification stats retrieved successfully.", {
      event: { id: event.id, name: event.name },
      total,
      byChannel,
      byStatus,
      byType,
    });

  } catch (error) {
    console.error("Get notification stats error:", error);
    return errorResponse(res, "Failed to retrieve notification stats.", 500);
  }
};