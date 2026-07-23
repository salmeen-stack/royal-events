  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import { generateEventReference } from "../utils/token.js";

// ==========================================
// GET ALL EVENTS
// ==========================================

export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Filter by event owner if user is EVENT_OWNER
    if (req.user.role === "EVENT_OWNER") {
      const eventOwner = await prisma.eventOwner.findUnique({
        where: { email: req.user.email },
      });
      if (eventOwner) {
        where.eventOwnerId = eventOwner.id;
      }
    }

    if (status) where.status = status;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { eventReference: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          eventOwner: {
            select: { id: true, name: true, email: true, phone: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              guests: true,
              contributions: true,
              invitations: true,
              checkIns: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.event.count({ where }),
    ]);

    return paginatedResponse(res, "Events retrieved successfully.", events, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all events error:", error);
    return errorResponse(res, "Failed to retrieve events.", 500);
  }
};

// ==========================================
// GET EVENT BY ID
// ==========================================

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventOwner: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            guests: true,
            contributions: true,
            invitations: true,
            checkIns: true,
          },
        },
      },
    });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    // Get financial summary
    const financialSummary = await prisma.contribution.aggregate({
      where: { eventId: id },
      _sum: {
        expectedAmount: true,
        paidAmount: true,
        balanceAmount: true,
      },
    });

    return successResponse(res, "Event retrieved successfully.", {
      ...event,
      financialSummary: {
        totalExpected: financialSummary._sum.expectedAmount || 0,
        totalPaid: financialSummary._sum.paidAmount || 0,
        totalBalance: financialSummary._sum.balanceAmount || 0,
      },
    });

  } catch (error) {
    console.error("Get event by id error:", error);
    return errorResponse(res, "Failed to retrieve event.", 500);
  }
};

// ==========================================
// CREATE EVENT
// ==========================================

export const createEvent = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      eventDate,
      eventTime,
      venue,
      location,
      googleMapsUrl,
      imageUrl,
      contributionTarget,
      contributionDeadline,
      paymentInstructions,
      eventProgram,
      eventOwnerId,
    } = req.body;

    // Validate required fields
    if (!name || !type || !eventDate || !eventTime || !venue || !location || !eventOwnerId) {
      return errorResponse(
        res,
        "Name, type, eventDate, eventTime, venue, location and eventOwnerId are required."
      );
    }

    // Check event owner exists
    const eventOwner = await prisma.eventOwner.findUnique({
      where: { id: eventOwnerId },
    });

    if (!eventOwner) {
      return errorResponse(res, "Event owner not found.", 404);
    }

    // Generate unique event reference
    const eventReference = generateEventReference();

    // Create event
    const event = await prisma.event.create({
      data: {
        eventReference,
        name: name.trim(),
        type,
        description: description || null,
        eventDate: new Date(eventDate),
        eventTime,
        venue: venue.trim(),
        location: location.trim(),
        googleMapsUrl: googleMapsUrl || null,
        imageUrl: imageUrl || null,
        contributionTarget: contributionTarget || 0,
        contributionDeadline: contributionDeadline ? new Date(contributionDeadline) : null,
        paymentInstructions: paymentInstructions || null,
        eventProgram: eventProgram || null,
        status: "DRAFT",
        eventOwnerId,
        createdById: req.user.id,
      },
      include: {
        eventOwner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(res, "Event created successfully.", event, 201);

  } catch (error) {
    console.error("Create event error:", error);
    return errorResponse(res, "Failed to create event.", 500);
  }
};

// ==========================================
// UPDATE EVENT
// ==========================================

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      description,
      eventDate,
      eventTime,
      venue,
      location,
      googleMapsUrl,
      imageUrl,
      contributionTarget,
      contributionDeadline,
      paymentInstructions,
      eventProgram,
      status,
    } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(eventTime && { eventTime }),
        ...(venue && { venue: venue.trim() }),
        ...(location && { location: location.trim() }),
        ...(googleMapsUrl !== undefined && { googleMapsUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(contributionTarget !== undefined && { contributionTarget }),
        ...(contributionDeadline !== undefined && {
          contributionDeadline: contributionDeadline ? new Date(contributionDeadline) : null,
        }),
        ...(paymentInstructions !== undefined && { paymentInstructions }),
        ...(eventProgram !== undefined && { eventProgram }),
        ...(status && { status }),
      },
      include: {
        eventOwner: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return successResponse(res, "Event updated successfully.", updatedEvent);

  } catch (error) {
    console.error("Update event error:", error);
    return errorResponse(res, "Failed to update event.", 500);
  }
};

// ==========================================
// DELETE EVENT
// ==========================================

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    if (event._count.guests > 0) {
      return errorResponse(
        res,
        "Cannot delete event with registered guests. Change status to CANCELLED instead."
      );
    }

    await prisma.event.delete({ where: { id } });

    return successResponse(res, "Event deleted successfully.");

  } catch (error) {
    console.error("Delete event error:", error);
    return errorResponse(res, "Failed to delete event.", 500);
  }
};

// ==========================================
// GET EVENT DASHBOARD STATS
// ==========================================

export const getEventStats = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      totalGuests,
      paidGuests,
      unpaidGuests,
      totalInvitations,
      sentInvitations,
      totalCheckIns,
      financialSummary,
      successfulTransactions,
    ] = await Promise.all([
      prisma.guest.count({ where: { eventId: id } }),
      prisma.contribution.count({ where: { eventId: id, status: "PAID" } }),
      prisma.contribution.count({ where: { eventId: id, status: "PENDING" } }),
      prisma.invitation.count({ where: { eventId: id } }),
      prisma.invitation.count({ where: { eventId: id, status: "SENT" } }),
      prisma.checkIn.count({ where: { eventId: id } }),
      prisma.contribution.aggregate({
        where: { eventId: id },
        _sum: {
          expectedAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: { eventId: id, status: "SUCCESSFUL" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return successResponse(res, "Event stats retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        eventReference: event.eventReference,
        status: event.status,
        eventDate: event.eventDate,
        contributionTarget: event.contributionTarget,
      },
      guests: {
        total: totalGuests,
        paid: paidGuests,
        unpaid: unpaidGuests,
      },
      financial: {
        target: event.contributionTarget,
        totalExpected: financialSummary._sum.expectedAmount || 0,
        totalPaid: financialSummary._sum.paidAmount || 0,
        totalBalance: financialSummary._sum.balanceAmount || 0,
        successfulTransactions: successfulTransactions._count,
        totalTransactionAmount: successfulTransactions._sum.amount || 0,
      },
      invitations: {
        total: totalInvitations,
        sent: sentInvitations,
        pending: totalInvitations - sentInvitations,
      },
      attendance: {
        totalCheckIns,
        notCheckedIn: totalGuests - totalCheckIns,
      },
    });

  } catch (error) {
    console.error("Get event stats error:", error);
    return errorResponse(res, "Failed to retrieve event stats.", 500);
  }
};