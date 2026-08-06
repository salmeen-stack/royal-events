  
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

    // Check if guest requires invitation
    if (!contribution.guest.requiresInvitation) {
      console.log(`Guest ${contribution.guest.name} does not require invitation. Only reminders will be sent.`);
      return {
        success: true,
        contribution,
        message: "Payment confirmed. Guest does not require invitation.",
      };
    }

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
    // Get event details to check if contribution is required
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { requiresContribution: true },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found.",
      };
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    let guestsToInvite = [];

    if (event.requiresContribution) {
      // If contribution is required, only get guests with paid contributions
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

      guestsToInvite = paidContributions.map(c => c.guest);
    } else {
      // If contribution is not required, get all guests who require invitations
      guestsToInvite = await prisma.guest.findMany({
        where: {
          eventId,
          requiresInvitation: true,
        },
      });

      if (guestsToInvite.length === 0) {
        return {
          success: false,
          error: "No guests found who require invitations for this event.",
        };
      }
    }

    for (const guest of guestsToInvite) {
      // Check if invitation already exists
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          guestId: guest.id,
          eventId,
        },
      });

      if (existingInvitation) {
        results.skipped++;
        continue;
      }

      const invitationResult = await generateInvitation({
        guestId: guest.id,
        eventId,
        channel,
      });

      if (invitationResult.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          guest: guest.name,
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