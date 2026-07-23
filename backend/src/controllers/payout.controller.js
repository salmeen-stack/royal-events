  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";

// ==========================================
// GET ALL PAYOUTS
// ==========================================

export const getAllPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              eventReference: true,
              eventOwner: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.payout.count({ where }),
    ]);

    return paginatedResponse(res, "Payouts retrieved successfully.", payouts, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all payouts error:", error);
    return errorResponse(res, "Failed to retrieve payouts.", 500);
  }
};

// ==========================================
// GET PAYOUT BY ID
// ==========================================

export const getPayoutById = async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            eventOwner: true,
          },
        },
      },
    });

    if (!payout) {
      return errorResponse(res, "Payout not found.", 404);
    }

    return successResponse(res, "Payout retrieved successfully.", payout);

  } catch (error) {
    console.error("Get payout by id error:", error);
    return errorResponse(res, "Failed to retrieve payout.", 500);
  }
};

// ==========================================
// CREATE PAYOUT
// ==========================================

export const createPayout = async (req, res) => {
  try {
    const { eventId, amount, fees, serviceFee, notes } = req.body;

    if (!eventId || !amount) {
      return errorResponse(res, "Event ID and amount are required.");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventOwner: {
          select: { id: true, name: true },
        },
      },
    });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    // Calculate net amount
    const totalFees = parseFloat(fees || 0) + parseFloat(serviceFee || 0);
    const netAmount = parseFloat(amount) - totalFees;

    if (netAmount <= 0) {
      return errorResponse(res, "Net amount after fees must be greater than zero.");
    }

    // Check total collected vs payout amount
    const totalCollected = await prisma.transaction.aggregate({
      where: { eventId, status: "SUCCESSFUL" },
      _sum: { amount: true },
    });

    const totalPreviousPayouts = await prisma.payout.aggregate({
      where: { eventId, status: { in: ["PENDING", "PROCESSED"] } },
      _sum: { amount: true },
    });

    const availableAmount =
      parseFloat(totalCollected._sum.amount || 0) -
      parseFloat(totalPreviousPayouts._sum.amount || 0);

    if (parseFloat(amount) > availableAmount) {
      return errorResponse(
        res,
        `Payout amount exceeds available balance. Available: TZS ${availableAmount.toLocaleString()}`
      );
    }

    const payout = await prisma.payout.create({
      data: {
        eventId,
        amount: parseFloat(amount),
        fees: parseFloat(fees || 0),
        serviceFee: parseFloat(serviceFee || 0),
        netAmount,
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventOwner: { select: { name: true, phone: true } },
          },
        },
      },
    });

    return successResponse(res, "Payout created successfully.", payout, 201);

  } catch (error) {
    console.error("Create payout error:", error);
    return errorResponse(res, "Failed to create payout.", 500);
  }
};

// ==========================================
// UPDATE PAYOUT STATUS
// ==========================================

export const updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payoutRef, payoutDate, notes } = req.body;

    const validStatuses = ["PENDING", "PROCESSED", "FAILED"];

    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, "Valid status is required. Use PENDING, PROCESSED or FAILED.");
    }

    const payout = await prisma.payout.findUnique({ where: { id } });

    if (!payout) {
      return errorResponse(res, "Payout not found.", 404);
    }

    if (payout.status === "PROCESSED") {
      return errorResponse(res, "Cannot update a payout that has already been processed.");
    }

    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: {
        status,
        ...(payoutRef && { payoutRef }),
        ...(payoutDate && { payoutDate: new Date(payoutDate) }),
        ...(notes && { notes }),
      },
    });

    return successResponse(res, "Payout status updated successfully.", updatedPayout);

  } catch (error) {
    console.error("Update payout status error:", error);
    return errorResponse(res, "Failed to update payout status.", 500);
  }
};

// ==========================================
// GET EVENT PAYOUT SUMMARY
// ==========================================

export const getEventPayoutSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventOwner: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      totalCollected,
      totalPayouts,
      pendingPayouts,
      processedPayouts,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { eventId, status: "SUCCESSFUL" },
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
        where: { eventId },
        _sum: { amount: true, netAmount: true, fees: true, serviceFee: true },
        _count: true,
      }),
      prisma.payout.aggregate({
        where: { eventId, status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payout.aggregate({
        where: { eventId, status: "PROCESSED" },
        _sum: { amount: true, netAmount: true },
        _count: true,
      }),
    ]);

    const totalCollectedAmount = parseFloat(totalCollected._sum.amount || 0);
    const totalPayoutAmount = parseFloat(totalPayouts._sum.amount || 0);
    const availableBalance = totalCollectedAmount - totalPayoutAmount;

    return successResponse(res, "Payout summary retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        eventReference: event.eventReference,
        eventOwner: event.eventOwner,
      },
      financial: {
        totalCollected: totalCollectedAmount,
        totalPayouts: totalPayoutAmount,
        availableBalance,
        totalFees: parseFloat(totalPayouts._sum.fees || 0),
        totalServiceFees: parseFloat(totalPayouts._sum.serviceFee || 0),
        totalNetAmount: parseFloat(totalPayouts._sum.netAmount || 0),
      },
      payouts: {
        total: totalPayouts._count,
        pending: {
          count: pendingPayouts._count,
          amount: parseFloat(pendingPayouts._sum.amount || 0),
        },
        processed: {
          count: processedPayouts._count,
          amount: parseFloat(processedPayouts._sum.amount || 0),
          netAmount: parseFloat(processedPayouts._sum.netAmount || 0),
        },
      },
    });

  } catch (error) {
    console.error("Get event payout summary error:", error);
    return errorResponse(res, "Failed to retrieve payout summary.", 500);
  }
};