import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import { generateLinkToken } from "../utils/token.js";

// ==========================================
// GET ALL CONTRIBUTIONS
// ==========================================

export const getAllContributions = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Filter by event owner if user is EVENT_OWNER
    if (req.user.role === "EVENT_OWNER") {
      const eventOwner = await prisma.eventOwner.findUnique({
        where: { email: req.user.email },
        include: { events: { select: { id: true } } },
      });
      if (eventOwner && eventOwner.events.length > 0) {
        where.eventId = { in: eventOwner.events.map(e => e.id) };
      } else {
        where.eventId = "nonexistent";
      }
    }

    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { guest: { name: { contains: search, mode: "insensitive" } } },
        { guest: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where,
        include: {
          guest: {
            select: { id: true, name: true, phone: true, email: true, category: true },
          },
          event: {
            select: { id: true, name: true, eventReference: true },
          },
          transactions: {
            select: {
              id: true,
              transactionRef: true,
              amount: true,
              status: true,
              paidAt: true,
              paymentMethod: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.contribution.count({ where }),
    ]);

    return paginatedResponse(res, "Contributions retrieved successfully.", contributions, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all contributions error:", error);
    return errorResponse(res, "Failed to retrieve contributions.", 500);
  }
};

// ==========================================
// GET CONTRIBUTION BY ID
// ==========================================

export const getContributionById = async (req, res) => {
  try {
    const { id } = req.params;

    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            name: true,
            eventReference: true,
            eventDate: true,
            venue: true,
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!contribution) {
      return errorResponse(res, "Contribution not found.", 404);
    }

    return successResponse(res, "Contribution retrieved successfully.", contribution);

  } catch (error) {
    console.error("Get contribution by id error:", error);
    return errorResponse(res, "Failed to retrieve contribution.", 500);
  }
};

// ==========================================
// UPDATE CONTRIBUTION EXPECTED AMOUNT
// ==========================================

export const updateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { expectedAmount } = req.body;

    if (expectedAmount === undefined) {
      return errorResponse(res, "Expected amount is required.");
    }

    const contribution = await prisma.contribution.findUnique({
      where: { id },
    });

    if (!contribution) {
      return errorResponse(res, "Contribution not found.", 404);
    }

    const newBalance = parseFloat(expectedAmount) - parseFloat(contribution.paidAmount);

    const updatedContribution = await prisma.contribution.update({
      where: { id },
      data: {
        expectedAmount: parseFloat(expectedAmount),
        balanceAmount: newBalance < 0 ? 0 : newBalance,
      },
    });

    return successResponse(res, "Contribution updated successfully.", updatedContribution);

  } catch (error) {
    console.error("Update contribution error:", error);
    return errorResponse(res, "Failed to update contribution.", 500);
  }
};

// ==========================================
// REGENERATE CONTRIBUTION LINK
// ==========================================

export const regenerateContributionLink = async (req, res) => {
  try {
    const { id } = req.params;

    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: {
        guest: { select: { name: true } },
      },
    });

    if (!contribution) {
      return errorResponse(res, "Contribution not found.", 404);
    }

    const linkToken = generateLinkToken();
    const contributionLink = `${process.env.FRONTEND_URL}/contribute/${linkToken}`;

    const updatedContribution = await prisma.contribution.update({
      where: { id },
      data: { linkToken, contributionLink },
    });

    return successResponse(res, "Contribution link regenerated successfully.", {
      contributionLink: updatedContribution.contributionLink,
      linkToken: updatedContribution.linkToken,
    });

  } catch (error) {
    console.error("Regenerate contribution link error:", error);
    return errorResponse(res, "Failed to regenerate contribution link.", 500);
  }
};

// ==========================================
// GET EVENT CONTRIBUTION SUMMARY
// ==========================================

export const getEventContributionSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [summary, statusBreakdown] = await Promise.all([
      prisma.contribution.aggregate({
        where: { eventId },
        _sum: {
          expectedAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
        _count: true,
      }),
      prisma.contribution.groupBy({
        by: ["status"],
        where: { eventId },
        _count: true,
        _sum: {
          expectedAmount: true,
          paidAmount: true,
        },
      }),
    ]);

    return successResponse(res, "Event contribution summary retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        contributionTarget: event.contributionTarget,
      },
      summary: {
        totalContributions: summary._count,
        totalExpected: summary._sum.expectedAmount || 0,
        totalPaid: summary._sum.paidAmount || 0,
        totalBalance: summary._sum.balanceAmount || 0,
        targetAchievement: event.contributionTarget > 0
          ? ((parseFloat(summary._sum.paidAmount) / parseFloat(event.contributionTarget)) * 100).toFixed(2)
          : 0,
      },
      statusBreakdown,
    });

  } catch (error) {
    console.error("Get event contribution summary error:", error);
    return errorResponse(res, "Failed to retrieve contribution summary.", 500);
  }
};

// ==========================================
// SEND CONTRIBUTION REQUEST
// ==========================================

export const sendContributionRequest = async (req, res) => {
  try {
    const { contributionId } = req.params;

    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        guest: true,
        event: true,
      },
    });

    if (!contribution) {
      return errorResponse(res, "Contribution not found.", 404);
    }

    // Record notification
    await prisma.notification.create({
      data: {
        type: "CONTRIBUTION_REQUEST",
        channel: "SMS",
        recipient: contribution.guest.phone,
        message: `Hello ${contribution.guest.name}, you have been invited to contribute to ${contribution.event.name}. Please use this link to make your contribution: ${contribution.contributionLink}`,
        status: "PENDING",
        eventId: contribution.eventId,
        guestId: contribution.guestId,
      },
    });

    return successResponse(res, "Contribution request queued for sending.", {
      guest: contribution.guest.name,
      phone: contribution.guest.phone,
      contributionLink: contribution.contributionLink,
    });

  } catch (error) {
    console.error("Send contribution request error:", error);
    return errorResponse(res, "Failed to send contribution request.", 500);
  }
};

// ==========================================
// SEND BULK CONTRIBUTION REQUESTS
// ==========================================

export const sendBulkContributionRequests = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return errorResponse(res, "Event ID is required.");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    // Get all pending contributions with guests
    const contributions = await prisma.contribution.findMany({
      where: {
        eventId,
        status: "PENDING",
      },
      include: {
        guest: true,
      },
    });

    if (contributions.length === 0) {
      return errorResponse(res, "No pending contributions found for this event.");
    }

    const notifications = contributions.map((contribution) => ({
      type: "CONTRIBUTION_REQUEST",
      channel: "SMS",
      recipient: contribution.guest.phone,
      message: `Hello ${contribution.guest.name}, you have been invited to contribute to ${event.name}. Please use this link: ${contribution.contributionLink}`,
      status: "PENDING",
      eventId,
      guestId: contribution.guestId,
    }));

    await prisma.notification.createMany({ data: notifications });

    return successResponse(
      res,
      `Contribution requests queued for ${contributions.length} guests.`,
      { queued: contributions.length }
    );

  } catch (error) {
    console.error("Send bulk contribution requests error:", error);
    return errorResponse(res, "Failed to send bulk contribution requests.", 500);
  }
};