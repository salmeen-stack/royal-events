  
import axios from "axios";
import dotenv from "dotenv";
import prisma from "../config/prisma.js";
import { generateTransactionRef } from "../utils/token.js";
import { releaseInvitationAfterPayment } from "./invitation.service.js";

dotenv.config();

const SNIPPE_BASE_URL = process.env.SNIPPE_BASE_URL || "https://api.snippe.sh";
const SNIPPE_API_KEY = process.env.SNIPPE_API_KEY;

export const normalizeSnippeAmount = (amount) => {
  if (typeof amount === "string") {
    amount = Number(amount);
  }

  if (!Number.isFinite(amount)) {
    throw new Error("Invalid payment amount");
  }

  return Math.max(0, Math.round(amount));
};

export const buildSnippePaymentPayload = ({
  amount,
  transactionRef,
  guestName,
  guestPhone,
  guestEmail,
  eventName,
  webhookUrl,
}) => {
  const normalizedPhone = (guestPhone || "").replace(/\s+/g, "").replace(/^\+/, "");
  const [firstName, ...rest] = (guestName || "Guest").trim().split(/\s+/);
  const lastName = rest.join(" ") || "Guest";

  return {
    payment_type: "mobile",
    details: {
      amount: normalizeSnippeAmount(amount),
      currency: "TZS",
    },
    phone_number: normalizedPhone,
    customer: {
      firstname: firstName || "Guest",
      lastname: lastName,
      email: guestEmail || "guest@example.com",
    },
    webhook_url: webhookUrl,
    metadata: {
      order_id: transactionRef,
      event_name: eventName || "Royal Events",
    },
  };
};

export const createSnippePayment = async ({
  amount,
  transactionRef,
  guestName,
  guestPhone,
  guestEmail,
  eventName,
  webhookUrl,
}) => {
  try {
    if (!SNIPPE_API_KEY) {
      throw new Error("SNIPPE_API_KEY is not configured");
    }

    const payload = buildSnippePaymentPayload({
      amount,
      transactionRef,
      guestName,
      guestPhone,
      guestEmail,
      eventName,
      webhookUrl,
    });

    const response = await axios.post(`${SNIPPE_BASE_URL}/v1/payments`, payload, {
      headers: {
        Authorization: `Bearer ${SNIPPE_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Idempotency-Key": transactionRef.slice(0, 30),
      },
      timeout: 30000,
    });

    const paymentData = response.data?.data || {};

    return {
      success: true,
      reference: paymentData.reference || transactionRef,
      status: paymentData.status || "pending",
      paymentUrl: paymentData.payment_url || null,
      paymentQrCode: paymentData.payment_qr_code || null,
      data: paymentData,
    };
  } catch (error) {
    console.error("Create Snippe payment error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// ==========================================
// CREATE PAYMENT SESSION WITH SNIPPE
// ==========================================

export const createPaymentSession = async ({
  contributionId,
  amount,
  guestName,
  guestPhone,
  eventName,
}) => {
  try {
    const transactionRef = generateTransactionRef();

    const payment = await createSnippePayment({
      amount,
      transactionRef,
      guestName,
      guestPhone,
      eventName,
      webhookUrl: `${process.env.QR_BASE_URL || process.env.BACKEND_URL || "http://localhost:5001"}/api/transactions/webhook/snippe`,
    });

    if (!payment.success) {
      return {
        success: false,
        error: payment.error,
      };
    }

    return {
      success: true,
      transactionRef,
      paymentUrl: payment.paymentUrl || null,
      paymentQrCode: payment.paymentQrCode || null,
      snippeSessionId: payment.reference || null,
      data: payment.data,
    };
  } catch (error) {
    console.error("Create payment session error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// VERIFY PAYMENT STATUS FROM SNIPPE
// ==========================================

export const verifyPaymentStatus = async (transactionRef) => {
  try {
    const response = await axios.get(
      `${process.env.SNIPPE_BASE_URL}/payments/status/${transactionRef}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SNIPPE_API_KEY}`,
          Accept: "application/json",
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      status: response.data?.status || "UNKNOWN",
      data: response.data,
    };

  } catch (error) {
    console.error("Verify payment status error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// PROCESS SUCCESSFUL PAYMENT
// ==========================================

export const processSuccessfulPayment = async ({
  transactionRef,
  snippeRef,
  amount,
}) => {
  try {
    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { transactionRef },
      include: {
        contribution: true,
        guest: true,
        event: true,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found." };
    }

    if (transaction.status === "SUCCESSFUL") {
      return { success: false, error: "Transaction already processed." };
    }

    // Update transaction
    await prisma.transaction.update({
      where: { transactionRef },
      data: {
        snippeRef: snippeRef || null,
        status: "SUCCESSFUL",
        amount: parseFloat(amount),
        paidAt: new Date(),
      },
    });

    // Update contribution
    const newPaidAmount =
      parseFloat(transaction.contribution.paidAmount) + parseFloat(amount);

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

    // Release invitation if fully paid
    if (newStatus === "PAID") {
      await releaseInvitationAfterPayment({
        contributionId: transaction.contributionId,
      });
    }

    return {
      success: true,
      transaction,
      contributionStatus: newStatus,
      invitationReleased: newStatus === "PAID",
    };

  } catch (error) {
    console.error("Process successful payment error:", error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// PROCESS FAILED PAYMENT
// ==========================================

export const processFailedPayment = async ({
  transactionRef,
  failureReason,
}) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { transactionRef },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found." };
    }

    await prisma.transaction.update({
      where: { transactionRef },
      data: {
        status: "FAILED",
        failureReason: failureReason || "Payment failed.",
      },
    });

    return { success: true };

  } catch (error) {
    console.error("Process failed payment error:", error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// VERIFY SNIPPE WEBHOOK SIGNATURE
// ==========================================

export const verifyWebhookSignature = async (payload, signature) => {
  try {
    const crypto = await import("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.SNIPPE_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("Verify webhook signature error:", error);
    return false;
  }
};

// ==========================================
// GET PAYMENT SUMMARY FOR EVENT
// ==========================================

export const getEventPaymentSummary = async (eventId) => {
  try {
    const [
      totalCollected,
      pendingTransactions,
      failedTransactions,
      successfulTransactions,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { eventId, status: "SUCCESSFUL" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({
        where: { eventId, status: "PENDING" },
      }),
      prisma.transaction.count({
        where: { eventId, status: "FAILED" },
      }),
      prisma.transaction.count({
        where: { eventId, status: "SUCCESSFUL" },
      }),
    ]);

    return {
      success: true,
      summary: {
        totalCollected: totalCollected._sum.amount || 0,
        successfulTransactions,
        pendingTransactions,
        failedTransactions,
      },
    };

  } catch (error) {
    console.error("Get event payment summary error:", error);
    return { success: false, error: error.message };
  }
};