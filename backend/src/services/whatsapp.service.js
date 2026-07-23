  
import axios from "axios";
import dotenv from "dotenv";
import prisma from "../config/prisma.js";

dotenv.config();

// ==========================================
// SEND WHATSAPP MESSAGE
// ==========================================

export const sendWhatsAppMessage = async ({
  to,
  message,
  eventId = null,
  guestId = null,
  type = "INVITATION",
}) => {
  try {
    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        type,
        channel: "WHATSAPP",
        recipient: to,
        message,
        status: "PENDING",
        eventId,
        guestId,
      },
    });

    // Send via WhatsApp API
    const response = await axios.post(
      `${process.env.WHATSAPP_BASE_URL}/send`,
      {
        api_key: process.env.WHATSAPP_API_KEY,
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
        providerRef: response.data?.messageId || null,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      notificationId: notification.id,
      providerRef: response.data?.messageId || null,
    };

  } catch (error) {
    console.error("Send WhatsApp error:", error.message);

    try {
      await prisma.notification.updateMany({
        where: {
          recipient: to,
          status: "PENDING",
          channel: "WHATSAPP",
        },
        data: {
          status: "FAILED",
          failureReason: error.message,
        },
      });
    } catch (dbError) {
      console.error("Failed to update notification:", dbError.message);
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// SEND WHATSAPP INVITATION WITH QR CODE
// ==========================================

export const sendWhatsAppInvitation = async ({
  guest,
  event,
  invitation,
  qrCodeBase64,
}) => {
  const eventDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const message =
    `🎉 *You Are Invited!*\n\n` +
    `Dear *${guest.name}*,\n\n` +
    `Your contribution has been received.\n\n` +
    `You are officially invited to:\n\n` +
    `📌 *Event:* ${event.name}\n` +
    `📅 *Date:* ${eventDate}\n` +
    `⏰ *Time:* ${event.eventTime}\n` +
    `📍 *Venue:* ${event.venue}\n` +
    `🗺️ *Location:* ${event.location}\n\n` +
    `*Invitation Reference:* ${invitation.invitationRef}\n\n` +
    `Please present your QR code at the event entrance for check-in.\n\n` +
    `We look forward to celebrating with you! 🎊`;

  return sendWhatsAppMessage({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "INVITATION",
  });
};

// ==========================================
// SEND WHATSAPP CONTRIBUTION REQUEST
// ==========================================

export const sendWhatsAppContributionRequest = async ({
  guest,
  event,
  contributionLink,
}) => {
  const message =
    `Hello *${guest.name}*,\n\n` +
    `You have been invited to support:\n\n` +
    `📌 *${event.name}*\n\n` +
    `Please use the link below to make your contribution:\n` +
    `${contributionLink}\n\n` +
    `Thank you for your support. 🙏`;

  return sendWhatsAppMessage({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "CONTRIBUTION_REQUEST",
  });
};

// ==========================================
// SEND WHATSAPP EVENT REMINDER
// ==========================================

export const sendWhatsAppEventReminder = async ({
  guest,
  event,
  daysUntilEvent,
}) => {
  const eventDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let message = "";

  if (daysUntilEvent === 0) {
    message =
      `🎉 *Today is the Big Day!*\n\n` +
      `Dear *${guest.name}*,\n\n` +
      `*${event.name}* is happening TODAY!\n\n` +
      `📍 *Venue:* ${event.venue}\n` +
      `⏰ *Time:* ${event.eventTime}\n\n` +
      `Please have your QR code or Check-In Token ready.\n\n` +
      `We look forward to celebrating with you! 🎊`;
  } else if (daysUntilEvent === 1) {
    message =
      `⏰ *Event Reminder - Tomorrow!*\n\n` +
      `Dear *${guest.name}*,\n\n` +
      `*${event.name}* is happening TOMORROW!\n\n` +
      `📅 *Date:* ${eventDate}\n` +
      `📍 *Venue:* ${event.venue}\n` +
      `⏰ *Time:* ${event.eventTime}\n\n` +
      `Please have your QR code or Check-In Token ready.`;
  } else {
    message =
      `⏰ *Event Reminder*\n\n` +
      `Dear *${guest.name}*,\n\n` +
      `*${event.name}* is only *${daysUntilEvent} days* away!\n\n` +
      `📅 *Date:* ${eventDate}\n` +
      `📍 *Venue:* ${event.venue}\n` +
      `⏰ *Time:* ${event.eventTime}\n\n` +
      `We look forward to seeing you there! 🎊`;
  }

  return sendWhatsAppMessage({
    to: guest.phone,
    message,
    eventId: event.id,
    guestId: guest.id,
    type: "EVENT_REMINDER",
  });
};