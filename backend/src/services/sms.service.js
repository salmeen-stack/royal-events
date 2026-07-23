  
import axios from "axios";
import dotenv from "dotenv";
import prisma from "../config/prisma.js";

dotenv.config();

// ==========================================
// SEND SINGLE SMS
// ==========================================

export const sendSMS = async ({ to, message, eventId = null, guestId = null, type = "SMS" }) => {
  try {
    // Create notification record first
    const notification = await prisma.notification.create({
      data: {
        type,
        channel: "SMS",
        recipient: to,
        message,
        status: "PENDING",
        eventId,
        guestId,
      },
    });

    // Send via Rafiki SMS API
    const response = await axios.post(
      `${process.env.RAFIKI_BASE_URL}/send`,
      {
        api_key: process.env.RAFIKI_API_KEY,
        sender_id: process.env.RAFIKI_SENDER_ID,
        to,
        message,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000,
      }
    );

    // Update notification as sent
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        providerRef: response.data?.messageId || response.data?.id || null,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      notificationId: notification.id,
      providerRef: response.data?.messageId || null,
    };

  } catch (error) {
    console.error("Send SMS error:", error.message);

    // Update notification as failed if it was created
    try {
      await prisma.notification.updateMany({
        where: {
          recipient: to,
          status: "PENDING",
          channel: "SMS",
        },
        data: {
          status: "FAILED",
          failureReason: error.message,
        },
      });
    } catch (dbError) {
      console.error("Failed to update notification status:", dbError.message);
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// SEND BULK SMS
// ==========================================

export const sendBulkSMS = async (messages) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const msg of messages) {
    const result = await sendSMS(msg);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        to: msg.to,
        error: result.error,
      });
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
};

// ==========================================
// SEND CONTRIBUTION REQUEST SMS
// ==========================================

export const sendContributionRequestSMS = async ({ guest, event, contributionLink }) => {
  const message =
    `Hello ${guest.name},\n\n` +
    `You have been invited to support ${event.name}.\n\n` +
    `Please use the link below to make your contribution:\n` +
    `${contributionLink}\n\n` +
    `Thank you for your support.`;

  return sendSMS({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "CONTRIBUTION_REQUEST",
  });
};

// ==========================================
// SEND PAYMENT CONFIRMATION SMS
// ==========================================

export const sendPaymentConfirmationSMS = async ({ guest, event, amount }) => {
  const message =
    `Dear ${guest.name},\n\n` +
    `Your contribution of TZS ${parseFloat(amount).toLocaleString()} ` +
    `to ${event.name} has been received successfully.\n\n` +
    `Your invitation will be sent to you shortly.\n\n` +
    `Thank you.`;

  return sendSMS({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "PAYMENT_CONFIRMATION",
  });
};

// ==========================================
// SEND INVITATION SMS WITH TOKEN
// ==========================================

export const sendInvitationSMS = async ({ guest, event, smsToken }) => {
  const eventDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const message =
    `Dear ${guest.name},\n\n` +
    `Your contribution has been received.\n\n` +
    `You are invited to ${event.name} ` +
    `on ${eventDate} at ${event.venue}.\n\n` +
    `Your Check-In Token is:\n` +
    `${smsToken}\n\n` +
    `Please present this token at the event entrance.`;

  return sendSMS({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "INVITATION",
  });
};

// ==========================================
// SEND CONTRIBUTION REMINDER SMS
// ==========================================

export const sendContributionReminderSMS = async ({ guest, event, contributionLink, balanceAmount }) => {
  const message =
    `Dear ${guest.name},\n\n` +
    `This is a friendly reminder about your contribution to ${event.name}.\n\n` +
    `Outstanding amount: TZS ${parseFloat(balanceAmount).toLocaleString()}\n\n` +
    `Please use the link below to make your contribution:\n` +
    `${contributionLink}\n\n` +
    `Thank you.`;

  return sendSMS({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "CONTRIBUTION_REMINDER",
  });
};

// ==========================================
// SEND EVENT REMINDER SMS
// ==========================================

export const sendEventReminderSMS = async ({ guest, event, daysUntilEvent }) => {
  const eventDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let message = "";

  if (daysUntilEvent === 0) {
    message =
      `Dear ${guest.name},\n\n` +
      `Today is the big day!\n\n` +
      `${event.name} is happening today at ${event.venue}.\n\n` +
      `Please have your QR code or Check-In Token ready.\n\n` +
      `We look forward to celebrating with you!`;
  } else if (daysUntilEvent === 1) {
    message =
      `Dear ${guest.name},\n\n` +
      `Reminder: ${event.name} is tomorrow!\n\n` +
      `Date: ${eventDate}\n` +
      `Venue: ${event.venue}\n\n` +
      `Please have your QR code or Check-In Token ready.`;
  } else {
    message =
      `Dear ${guest.name},\n\n` +
      `${event.name} is only ${daysUntilEvent} days away!\n\n` +
      `Date: ${eventDate}\n` +
      `Venue: ${event.venue}\n\n` +
      `We look forward to seeing you there.`;
  }

  return sendSMS({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "EVENT_REMINDER",
  });
};