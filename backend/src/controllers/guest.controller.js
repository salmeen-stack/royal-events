  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import { generateLinkToken } from "../utils/token.js";

// ==========================================
// GET ALL GUESTS
// ==========================================

export const getAllGuests = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, search, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (eventId) where.eventId = eventId;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: {
          event: {
            select: { id: true, name: true, eventReference: true },
          },
          contributions: {
            select: {
              id: true,
              expectedAmount: true,
              paidAmount: true,
              balanceAmount: true,
              status: true,
            },
          },
          invitations: {
            select: {
              id: true,
              invitationRef: true,
              channel: true,
              status: true,
            },
          },
          checkIns: {
            select: {
              id: true,
              checkedInAt: true,
              method: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.guest.count({ where }),
    ]);

    return paginatedResponse(res, "Guests retrieved successfully.", guests, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all guests error:", error);
    return errorResponse(res, "Failed to retrieve guests.", 500);
  }
};

// ==========================================
// GET GUEST BY ID
// ==========================================

export const getGuestById = async (req, res) => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventReference: true,
            eventDate: true,
            venue: true,
            location: true,
          },
        },
        contributions: {
          include: {
            transactions: true,
          },
        },
        invitations: true,
        checkIns: {
          include: {
            staff: {
              select: { id: true, name: true },
            },
          },
        },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!guest) {
      return errorResponse(res, "Guest not found.", 404);
    }

    return successResponse(res, "Guest retrieved successfully.", guest);

  } catch (error) {
    console.error("Get guest by id error:", error);
    return errorResponse(res, "Failed to retrieve guest.", 500);
  }
};

// ==========================================
// CREATE SINGLE GUEST
// ==========================================

export const createGuest = async (req, res) => {
  try {
    const { eventId, name, phone, email, category, expectedContribution, notes } = req.body;

    if (!eventId || !name || !phone) {
      return errorResponse(res, "Event ID, name and phone are required.");
    }

    // Check event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    // Generate contribution link token
    const linkToken = generateLinkToken();
    const contributionLink = `${process.env.FRONTEND_URL}/contribute/${linkToken}`;

    // Create guest and contribution together
    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.toLowerCase().trim() : null,
        category: category || null,
        expectedContribution: expectedContribution || 0,
        notes: notes || null,
        eventId,
      },
    });

    // Create contribution record for guest
    const contribution = await prisma.contribution.create({
      data: {
        expectedAmount: expectedContribution || 0,
        paidAmount: 0,
        balanceAmount: expectedContribution || 0,
        status: "PENDING",
        contributionLink,
        linkToken,
        eventId,
        guestId: guest.id,
      },
    });

    return successResponse(
      res,
      "Guest created successfully.",
      { guest, contribution },
      201
    );

  } catch (error) {
    console.error("Create guest error:", error);
    return errorResponse(res, "Failed to create guest.", 500);
  }
};

// ==========================================
// BULK IMPORT GUESTS
// ==========================================

export const bulkImportGuests = async (req, res) => {
  try {
    const { eventId, guests } = req.body;

    if (!eventId || !guests || !Array.isArray(guests) || guests.length === 0) {
      return errorResponse(res, "Event ID and guests array are required.");
    }

    // Check event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each guest
    for (const guestData of guests) {
      try {
        if (!guestData.name || !guestData.phone) {
          results.failed++;
          results.errors.push({
            guest: guestData.name || "Unknown",
            error: "Name and phone are required.",
          });
          continue;
        }

        const linkToken = generateLinkToken();
        const contributionLink = `${process.env.FRONTEND_URL}/contribute/${linkToken}`;

        const guest = await prisma.guest.create({
          data: {
            name: guestData.name.trim(),
            phone: guestData.phone.trim(),
            email: guestData.email ? guestData.email.toLowerCase().trim() : null,
            category: guestData.category || null,
            expectedContribution: guestData.expectedContribution || 0,
            notes: guestData.notes || null,
            eventId,
          },
        });

        await prisma.contribution.create({
          data: {
            expectedAmount: guestData.expectedContribution || 0,
            paidAmount: 0,
            balanceAmount: guestData.expectedContribution || 0,
            status: "PENDING",
            contributionLink,
            linkToken,
            eventId,
            guestId: guest.id,
          },
        });

        results.success++;

      } catch (err) {
        results.failed++;
        results.errors.push({
          guest: guestData.name || "Unknown",
          error: err.message,
        });
      }
    }

    return successResponse(res, "Bulk import completed.", results, 201);

  } catch (error) {
    console.error("Bulk import guests error:", error);
    return errorResponse(res, "Failed to import guests.", 500);
  }
};

// ==========================================
// UPDATE GUEST
// ==========================================

export const updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, category, expectedContribution, notes } = req.body;

    const guest = await prisma.guest.findUnique({ where: { id } });

    if (!guest) {
      return errorResponse(res, "Guest not found.", 404);
    }

    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email ? email.toLowerCase().trim() : null }),
        ...(category !== undefined && { category }),
        ...(expectedContribution !== undefined && { expectedContribution }),
        ...(notes !== undefined && { notes }),
      },
    });

    return successResponse(res, "Guest updated successfully.", updatedGuest);

  } catch (error) {
    console.error("Update guest error:", error);
    return errorResponse(res, "Failed to update guest.", 500);
  }
};

// ==========================================
// DELETE GUEST
// ==========================================

export const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        _count: {
          select: { checkIns: true },
        },
      },
    });

    if (!guest) {
      return errorResponse(res, "Guest not found.", 404);
    }

    if (guest._count.checkIns > 0) {
      return errorResponse(res, "Cannot delete guest who has already checked in.");
    }

    // Delete related records first
    await prisma.notification.deleteMany({ where: { guestId: id } });
    await prisma.invitation.deleteMany({ where: { guestId: id } });
    await prisma.transaction.deleteMany({ where: { guestId: id } });
    await prisma.contribution.deleteMany({ where: { guestId: id } });
    await prisma.guest.delete({ where: { id } });

    return successResponse(res, "Guest deleted successfully.");

  } catch (error) {
    console.error("Delete guest error:", error);
    return errorResponse(res, "Failed to delete guest.", 500);
  }
};

// ==========================================
// GET CONTRIBUTION PAGE DATA
// ==========================================

export const getContributionPage = async (req, res) => {
  try {
    const { token } = req.params;

    const contribution = await prisma.contribution.findUnique({
      where: { linkToken: token },
      include: {
        guest: {
          select: { id: true, name: true, phone: true },
        },
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            eventDate: true,
            eventTime: true,
            venue: true,
            location: true,
            imageUrl: true,
            contributionTarget: true,
          },
        },
      },
    });

    if (!contribution) {
      return errorResponse(res, "Contribution link not found or has expired.", 404);
    }

    return successResponse(res, "Contribution page data retrieved successfully.", {
      contribution: {
        id: contribution.id,
        expectedAmount: contribution.expectedAmount,
        paidAmount: contribution.paidAmount,
        balanceAmount: contribution.balanceAmount,
        status: contribution.status,
      },
      guest: contribution.guest,
      event: contribution.event,
    });

  } catch (error) {
    console.error("Get contribution page error:", error);
    return errorResponse(res, "Failed to retrieve contribution page.", 500);
  }
};