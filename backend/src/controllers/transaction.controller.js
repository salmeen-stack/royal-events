  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import { generateTransactionRef } from "../utils/token.js";
import { createSnippePayment } from "../services/payment.service.js";

// ==========================================
// GET ALL TRANSACTIONS
// ==========================================

export const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { transactionRef: { contains: search, mode: "insensitive" } },
        { snippeRef: { contains: search, mode: "insensitive" } },
        { guest: { name: { contains: search, mode: "insensitive" } } },
        { guest: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          guest: {
            select: { id: true, name: true, phone: true },
          },
          event: {
            select: { id: true, name: true, eventReference: true },
          },
          contribution: {
            select: {
              id: true,
              expectedAmount: true,
              paidAmount: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    return paginatedResponse(res, "Transactions retrieved successfully.", transactions, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all transactions error:", error);
    return errorResponse(res, "Failed to retrieve transactions.", 500);
  }
};

// ==========================================
// GET TRANSACTION BY ID
// ==========================================

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            name: true,
            eventReference: true,
            eventDate: true,
          },
        },
        contribution: true,
      },
    });

    if (!transaction) {
      return errorResponse(res, "Transaction not found.", 404);
    }

    return successResponse(res, "Transaction retrieved successfully.", transaction);

  } catch (error) {
    console.error("Get transaction by id error:", error);
    return errorResponse(res, "Failed to retrieve transaction.", 500);
  }
};

// ==========================================
// INITIATE PAYMENT (Create Pending Transaction)
// ==========================================

export const initiatePayment = async (req, res) => {
  try {
    const { contributionId, amount, paymentMethod } = req.body;

    if (!contributionId || !amount) {
      return errorResponse(res, "Contribution ID and amount are required.");
    }

    if (parseFloat(amount) <= 0) {
      return errorResponse(res, "Amount must be greater than zero.");
    }

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

    if (contribution.status === "PAID") {
      return errorResponse(res, "This contribution has already been fully paid.");
    }

    const transactionRef = generateTransactionRef();

    const payment = await createSnippePayment({
      amount: parseFloat(amount),
      transactionRef,
      guestName: contribution.guest.name,
      guestPhone: contribution.guest.phone,
      guestEmail: contribution.guest.email || "guest@example.com",
      eventName: contribution.event.name,
      webhookUrl: `${process.env.QR_BASE_URL || process.env.BACKEND_URL || "http://localhost:5001"}/api/transactions/webhook/snippe`,
    });

    const transaction = await prisma.transaction.create({
      data: {
        transactionRef,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || null,
        status: payment.success ? "PENDING" : "FAILED",
        failureReason: payment.success ? null : payment.error,
        eventId: contribution.eventId,
        guestId: contribution.guestId,
        contributionId,
      },
    });

    if (!payment.success) {
      return errorResponse(res, payment.error || "Failed to initiate payment.", 400);
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        snippeRef: payment.reference || null,
      },
    });

    return successResponse(res, "Payment initiated successfully.", {
      transactionRef: transaction.transactionRef,
      transactionId: transaction.id,
      amount: transaction.amount,
      guest: contribution.guest.name,
      event: contribution.event.name,
      paymentUrl: payment.paymentUrl,
      status: payment.status,
      reference: payment.reference,
    }, 201);
  } catch (error) {
    console.error("Initiate payment error:", error);
    return errorResponse(res, "Failed to initiate payment.", 500);
  }
};

// ==========================================
// SNIPPE PAYMENT WEBHOOK
// ==========================================

export const handlePaymentWebhook = async (req, res) => {
  try {
    const payload = req.body;

    // Store webhook payload first
    await prisma.paymentWebhook.create({
      data: {
        provider: "SNIPPE",
        payload,
        status: "RECEIVED",
      },
    });

    const { transactionRef, snippeRef, status, amount } = payload;

    if (!transactionRef) {
      return res.status(200).json({ received: true });
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { transactionRef },
      include: {
        contribution: true,
        guest: true,
        event: true,
      },
    });

    if (!transaction) {
      return res.status(200).json({ received: true, message: "Transaction not found." });
    }

    if (status === "SUCCESS" || status === "SUCCESSFUL") {

      // Update transaction to successful
      await prisma.transaction.update({
        where: { transactionRef },
        data: {
          snippeRef: snippeRef || null,
          status: "SUCCESSFUL",
          paidAt: new Date(),
        },
      });

      // Update contribution paid amount
      const newPaidAmount =
        parseFloat(transaction.contribution.paidAmount) + parseFloat(amount || transaction.amount);

      const newBalance =
        parseFloat(transaction.contribution.expectedAmount) - newPaidAmount;

      const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

      await prisma.contribution.update({
        where: { id: transaction.contributionId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalance < 0 ? 0 : newBalance,
          status: newStatus,
        },
      });

      // Update webhook status
      await prisma.paymentWebhook.updateMany({
        where: {
          provider: "SNIPPE",
          status: "RECEIVED",
        },
        data: { status: "PROCESSED", processedAt: new Date() },
      });

      // If fully paid - trigger invitation release
      if (newStatus === "PAID") {
        console.log(`✅ Payment complete for guest: ${transaction.guest.name}. Invitation to be released.`);
      }

    } else if (status === "FAILED") {

      await prisma.transaction.update({
        where: { transactionRef },
        data: {
          status: "FAILED",
          failureReason: payload.failureReason || "Payment failed.",
        },
      });
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Payment webhook error:", error);
    return res.status(200).json({ received: true, error: error.message });
  }
};

// ==========================================
// GET EVENT TRANSACTION SUMMARY
// ==========================================

export const getEventTransactionSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [summary, statusBreakdown] = await Promise.all([
      prisma.transaction.aggregate({
        where: { eventId },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ["status"],
        where: { eventId },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    const successfulAmount = await prisma.transaction.aggregate({
      where: { eventId, status: "SUCCESSFUL" },
      _sum: { amount: true },
    });

    return successResponse(res, "Event transaction summary retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        contributionTarget: event.contributionTarget,
      },
      summary: {
        totalTransactions: summary._count,
        totalAmount: summary._sum.amount || 0,
        successfulAmount: successfulAmount._sum.amount || 0,
      },
      statusBreakdown,
    });

  } catch (error) {
    console.error("Get event transaction summary error:", error);
    return errorResponse(res, "Failed to retrieve transaction summary.", 500);
  }
};