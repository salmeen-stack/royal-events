  
import axios from "axios";
import dotenv from "dotenv";
import prisma from "../config/prisma.js";

dotenv.config();

const RAFIKI_BASE_URL = process.env.RAFIKI_BASE_URL || "https://api.rafikisms.com";
const RAFIKI_API_KEY = process.env.RAFIKI_API_KEY;
const RAFIKI_SENDER_ID = process.env.RAFIKI_SENDER_ID;

// ==========================================
// SEND SINGLE SMS
// ==========================================

export const sendSMS = async ({ to, message, eventId = null, guestId = null, type = "SMS" }) => {
  try {
    // Validate phone number format (should be international without +)
    const phone = to.replace(/^\+/, "");
    
    // Create notification record first
    const notification = await prisma.notification.create({
      data: {
        type,
        channel: "SMS",
        recipient: phone,
        message,
        status: "PENDING",
        eventId,
        guestId,
      },
    });

    // Send via Rafiki SMS API (v1/vendor/send-sms)
    console.log("Sending SMS to:", phone);
    console.log("Message length:", message.length);
    console.log("Message:", message);
    
    const response = await axios.post(
      `${RAFIKI_BASE_URL}/v1/vendor/send-sms`,
      {
        phone,
        message,
        sender_id: RAFIKI_SENDER_ID,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": RAFIKI_API_KEY,
        },
        timeout: 15000,
      }
    );

    console.log("RafikiSMS Response:", JSON.stringify(response.data, null, 2));

    // Update notification as sent
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        providerRef: response.data?.data?.message || null,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      notificationId: notification.id,
      providerRef: response.data?.data?.message || null,
    };

  } catch (error) {
    console.error("Send SMS error:", error.message);
    console.error("Error response data:", error.response?.data);
    console.error("Error response status:", error.response?.status);
    console.error("Error response headers:", error.response?.headers);

    // Update the specific notification as failed if it was created
    try {
      await prisma.notification.update({
        where: { id: notification.id },
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

export const sendBulkSMS = async ({ phones, message, eventId = null, type = "BULK_SMS" }) => {
  try {
    // Validate and format phone numbers
    const formattedPhones = phones.map(phone => phone.replace(/^\+/, ""));
    
    // Create notification records for all recipients
    const notifications = await prisma.notification.createMany({
      data: formattedPhones.map(phone => ({
        type,
        channel: "SMS",
        recipient: phone,
        message,
        status: "PENDING",
        eventId,
      })),
    });

    // Send via Rafiki SMS API (v1/vendor/send-bulk-sms)
    const response = await axios.post(
      `${RAFIKI_BASE_URL}/v1/vendor/send-bulk-sms`,
      {
        phone: formattedPhones.join(","),
        message,
        sender_id: RAFIKI_SENDER_ID,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": RAFIKI_API_KEY,
        },
        timeout: 30000,
      }
    );

    // Update all notifications as sent
    await prisma.notification.updateMany({
      where: {
        recipient: { in: formattedPhones },
        status: "PENDING",
        channel: "SMS",
      },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      totalRecipients: formattedPhones.length,
      message: response.data?.data?.message || "Bulk SMS queued successfully",
    };

  } catch (error) {
    console.error("Send bulk SMS error:", error.message);

    // Update notifications as failed
    try {
      const formattedPhones = phones.map(phone => phone.replace(/^\+/, ""));
      await prisma.notification.updateMany({
        where: {
          recipient: { in: formattedPhones },
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

// ==========================================
// GENERATE OTP FOR CHECK-IN
// ==========================================

export const generateOTP = async (phone) => {
  try {
    // Validate phone number format
    const formattedPhone = phone.replace(/^\+/, "");
    
    // Generate OTP via Rafiki SMS API (v1/otp/generate)
    const response = await axios.post(
      `${RAFIKI_BASE_URL}/v1/otp/generate`,
      {
        phone_number: formattedPhone,
        sender_id: RAFIKI_SENDER_ID,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": RAFIKI_API_KEY,
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      referenceId: response.data?.data?.reference_id,
      expiresIn: response.data?.data?.expires_in_seconds || 300,
    };

  } catch (error) {
    console.error("Generate OTP error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// VERIFY OTP FOR CHECK-IN
// ==========================================

export const verifyOTP = async (phone, otpCode, referenceId) => {
  try {
    // Validate phone number format
    const formattedPhone = phone.replace(/^\+/, "");
    
    // Verify OTP via Rafiki SMS API (v1/otp/verify)
    const response = await axios.post(
      `${RAFIKI_BASE_URL}/v1/otp/verify`,
      {
        phone_number: formattedPhone,
        otp_code: otpCode,
        reference_id: referenceId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      verified: response.data?.data?.verified || false,
      message: response.data?.message || "Verification successful",
    };

  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return {
      success: false,
      verified: false,
      error: error.message,
      errorCode: error.response?.data?.error_code || null,
    };
  }
};

// ==========================================
// CHECK SMS BALANCE
// ==========================================

export const checkBalance = async () => {
  try {
    const response = await axios.get(
      `${RAFIKI_BASE_URL}/v1/vendor/balance`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": RAFIKI_API_KEY,
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      creditBalance: response.data?.data?.credit_balance || 0,
    };

  } catch (error) {
    console.error("Check balance error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// GET DELIVERY REPORT
// ==========================================

export const getDeliveryReport = async (destAddr, requestId) => {
  try {
    const response = await axios.get(
      `${RAFIKI_BASE_URL}/v1/vendor/delivery-reports`,
      {
        params: {
          dest_addr: destAddr,
          request_id: requestId,
        },
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": RAFIKI_API_KEY,
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      deliveryReports: response.data?.data?.delivery_reports || [],
    };

  } catch (error) {
    console.error("Get delivery report error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};