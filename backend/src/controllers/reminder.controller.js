  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import { sendContributionReminderSMS, sendEventReminderSMS } from "../services/sms.service.js";
import { sendWhatsAppEventReminder } from "../services/whatsapp.service.js";

// ==========================================
// GET ALL REMINDERS
// ==========================================

export const getAllReminders = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (eventId) where.eventId = eventId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              eventReference: true,
              eventDate: true,
            },
          },
        },
        orderBy: { scheduledAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.reminder.count({ where }),
    ]);

    return paginatedResponse(res, "Reminders retrieved successfully.", reminders, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all reminders error:", error);
    return errorResponse(res, "Failed to retrieve reminders.", 500);
  }
};

// ==========================================
// GET REMINDER BY ID
// ==========================================

export const getReminderById = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!reminder) {
      return errorResponse(res, "Reminder not found.", 404);
    }

    return successResponse(res, "Reminder retrieved successfully.", reminder);

  } catch (error) {
    console.error("Get reminder by id error:", error);
    return errorResponse(res, "Failed to retrieve reminder.", 500);
  }
};

// ==========================================
// CREATE REMINDER
// ==========================================

export const createReminder = async (req, res) => {
  try {
    const { eventId, type, scheduledAt, message } = req.body;

    if (!eventId || !type || !scheduledAt) {
      return errorResponse(res, "Event ID, type and scheduledAt are required.");
    }

    const validTypes = [
      "CONTRIBUTION_REMINDER",
      "EVENT_REMINDER",
      "CHECKIN_REMINDER",
    ];

    if (!validTypes.includes(type)) {
      return errorResponse(res, "Invalid reminder type.");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const reminder = await prisma.reminder.create({
      data: {
        eventId,
        type,
        scheduledAt: new Date(scheduledAt),
        message: message || null,
        status: "PENDING",
      },
      include: {
        event: {
          select: { id: true, name: true, eventDate: true },
        },
      },
    });

    return successResponse(res, "Reminder created successfully.", reminder, 201);

  } catch (error) {
    console.error("Create reminder error:", error);
    return errorResponse(res, "Failed to create reminder.", 500);
  }
};

// ==========================================
// UPDATE REMINDER
// ==========================================

export const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledAt, message, status } = req.body;

    const reminder = await prisma.reminder.findUnique({ where: { id } });

    if (!reminder) {
      return errorResponse(res, "Reminder not found.", 404);
    }

    if (reminder.status === "SENT") {
      return errorResponse(res, "Cannot update a reminder that has already been sent.");
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(message !== undefined && { message }),
        ...(status && { status }),
      },
    });

    return successResponse(res, "Reminder updated successfully.", updatedReminder);

  } catch (error) {
    console.error("Update reminder error:", error);
    return errorResponse(res, "Failed to update reminder.", 500);
  }
};

// ==========================================
// DELETE REMINDER
// ==========================================

export const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({ where: { id } });

    if (!reminder) {
      return errorResponse(res, "Reminder not found.", 404);
    }

    if (reminder.status === "SENT") {
      return errorResponse(res, "Cannot delete a reminder that has already been sent.");
    }

    await prisma.reminder.delete({ where: { id } });

    return successResponse(res, "Reminder deleted successfully.");

  } catch (error) {
    console.error("Delete reminder error:", error);
    return errorResponse(res, "Failed to delete reminder.", 500);
  }
};

// ==========================================
// SEND CONTRIBUTION REMINDERS MANUALLY
// ==========================================

export const sendContributionReminders = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return errorResponse(res, "Event ID is required.");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    // Get all pending and partial contributions
    const contributions = await prisma.contribution.findMany({
      where: {
        eventId,
        status: { in: ["PENDING", "PARTIAL"] },
      },
      include: { guest: true },
    });

    if (contributions.length === 0) {
      return errorResponse(res, "No pending contributions found.");
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const contribution of contributions) {
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

    // Create reminder record
    await prisma.reminder.create({
      data: {
        eventId,
        type: "CONTRIBUTION_REMINDER",
        scheduledAt: new Date(),
        sentAt: new Date(),
        status: "SENT",
        message: `Contribution reminder sent to ${results.success} guests.`,
      },
    });

    return successResponse(
      res,
      `Contribution reminders sent to ${results.success} guests.`,
      results
    );

  } catch (error) {
    console.error("Send contribution reminders error:", error);
    return errorResponse(res, "Failed to send contribution reminders.", 500);
  }
};

// ==========================================
// SEND EVENT REMINDERS MANUALLY
// ==========================================

export const sendEventReminders = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return errorResponse(res, "Event ID is required.");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    // Calculate days until event
    const today = new Date();
    const eventDate = new Date(event.eventDate);
    const diffTime = eventDate.getTime() - today.getTime();
    const daysUntilEvent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Get all guests with sent invitations
    const invitations = await prisma.invitation.findMany({
      where: {
        eventId,
        status: "SENT",
      },
      include: { guest: true },
    });

    if (invitations.length === 0) {
      return errorResponse(res, "No guests with sent invitations found.");
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const invitation of invitations) {
      let result;

      if (invitation.channel === "WHATSAPP" || invitation.channel === "BOTH") {
        result = await sendWhatsAppEventReminder({
          guest: invitation.guest,
          event,
          daysUntilEvent,
        });
      } else {
        result = await sendEventReminderSMS({
          guest: invitation.guest,
          event,
          daysUntilEvent,
        });
      }

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          guest: invitation.guest.name,
          error: result.error,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Create reminder record
    await prisma.reminder.create({
      data: {
        eventId,
        type: "EVENT_REMINDER",
        scheduledAt: new Date(),
        sentAt: new Date(),
        status: "SENT",
        message: `Event reminder sent to ${results.success} guests. ${daysUntilEvent} days until event.`,
      },
    });

    return successResponse(
      res,
      `Event reminders sent to ${results.success} guests.`,
      results
    );

  } catch (error) {
    console.error("Send event reminders error:", error);
    return errorResponse(res, "Failed to send event reminders.", 500);
  }
};