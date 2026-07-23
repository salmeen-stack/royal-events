  
import prisma from "../config/prisma.js";
import { generateQRToken, generateSMSToken, generateInvitationRef } from "../utils/token.js";
import { generateQRCodeDataURL } from "./qrcode.service.js";
import { sendInvitationSMS, sendPaymentConfirmationSMS } from "./sms.service.js";
import { sendWhatsAppInvitation } from "./whatsapp.service.js";

// ==========================================
// GENERATE INVITATION FOR GUEST
// ==========================================

export const generateInvitation = async ({ guestId, eventId, channel = "SMS" }) => {
  try {
    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: { guestId, eventId },
    });

    if (existingInvitation) {
      return {
        success: false,
        error: "Invitation already exists for this guest.",
        invitation: existingInvitation,
      };
    }

    // Get guest and event details
    const [guest, event] = await Promise.all([
      prisma.guest.findUnique({ where: { id: guestId } }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    if (!guest) return { success: false, error: "Guest not found." };
    if (!event) return { success: false, error: "Event not found." };

    // Generate unique tokens
    const qrToken = generateQRToken();
    const smsToken = generateSMSToken();
    const invitationRef = generateInvitationRef();

    // Generate QR code
    const qrResult = await generateQRCodeDataURL(qrToken);
    const qrCodeUrl = qrResult.success ? qrResult.dataURL : null;

    // Create invitation record
    const invitation = await prisma.invitation.create({
      data: {
        invitationRef,
        qrToken,
        smsToken,
        qrCodeUrl,
        channel,
        status: "PENDING",
        eventId,
        guestId,
      },
    });

    return {
      success: true,
      invitation,
      guest,
      event,
    };

  } catch (error) {
    console.error("Generate invitation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// SEND INVITATION TO GUEST
// ==========================================

export const sendInvitation = async ({ invitationId }) => {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        guest: true,
        event: true,
      },
    });

    if (!invitation) {
      return { success: false, error: "Invitation not found." };
    }

    if (invitation.status === "SENT" || invitation.status === "DELIVERED") {
      return { success: false, error: "Invitation has already been sent." };
    }

    let sendResult;

    if (invitation.channel === "WHATSAPP" || invitation.channel === "BOTH") {
      sendResult = await sendWhatsAppInvitation({
        guest: invitation.guest,
        event: invitation.event,
        invitation,
        qrCodeBase64: invitation.qrCodeUrl,
      });
    }

    if (invitation.channel === "SMS" || invitation.channel === "BOTH") {
      sendResult = await sendInvitationSMS({
        guest: invitation.guest,
        event: invitation.event,
        smsToken: invitation.smsToken,
      });
    }

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      invitation,
      sendResult,
    };

  } catch (error) {
    console.error("Send invitation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// RELEASE INVITATION AFTER PAYMENT
// ==========================================

export const releaseInvitationAfterPayment = async ({ contributionId }) => {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        guest: true,
        event: true,
      },
    });

    if (!contribution) {
      return { success: false, error: "Contribution not found." };
    }

    if (contribution.status !== "PAID") {
      return { success: false, error: "Contribution is not fully paid." };
    }

    // Send payment confirmation
    await sendPaymentConfirmationSMS({
      guest: contribution.guest,
      event: contribution.event,
      amount: contribution.paidAmount,
    });

    // Generate invitation
    const invitationResult = await generateInvitation({
      guestId: contribution.guestId,
      eventId: contribution.eventId,
      channel: "SMS",
    });

    if (!invitationResult.success) {
      return invitationResult;
    }

    // Send invitation
    const sendResult = await sendInvitation({
      invitationId: invitationResult.invitation.id,
    });

    return {
      success: true,
      contribution,
      invitation: invitationResult.invitation,
      sendResult,
    };

  } catch (error) {
    console.error("Release invitation after payment error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// BULK GENERATE INVITATIONS FOR EVENT
// ==========================================

export const bulkGenerateInvitations = async ({ eventId, channel = "SMS" }) => {
  try {
    // Get all paid contributions for this event
    const paidContributions = await prisma.contribution.findMany({
      where: {
        eventId,
        status: "PAID",
      },
      include: {
        guest: true,
      },
    });

    if (paidContributions.length === 0) {
      return {
        success: false,
        error: "No paid contributions found for this event.",
      };
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    for (const contribution of paidContributions) {
      // Check if invitation already exists
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          guestId: contribution.guestId,
          eventId,
        },
      });

      if (existingInvitation) {
        results.skipped++;
        continue;
      }

      const invitationResult = await generateInvitation({
        guestId: contribution.guestId,
        eventId,
        channel,
      });

      if (invitationResult.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          guest: contribution.guest.name,
          error: invitationResult.error,
        });
      }
    }

    return { success: true, results };

  } catch (error) {
    console.error("Bulk generate invitations error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};