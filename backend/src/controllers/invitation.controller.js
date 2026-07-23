  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import {
  generateInvitation,
  sendInvitation,
  releaseInvitationAfterPayment,
  bulkGenerateInvitations,
} from "../services/invitation.service.js";

// ==========================================
// GET ALL INVITATIONS
// ==========================================

export const getAllInvitations = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, status, channel, search } = req.query;
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
    if (channel) where.channel = channel;

    if (search) {
      where.OR = [
        { invitationRef: { contains: search, mode: "insensitive" } },
        { smsToken: { contains: search, mode: "insensitive" } },
        { guest: { name: { contains: search, mode: "insensitive" } } },
        { guest: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        include: {
          guest: {
            select: { id: true, name: true, phone: true, email: true },
          },
          event: {
            select: { id: true, name: true, eventReference: true, eventDate: true },
          },
          checkIn: {
            select: { id: true, checkedInAt: true, method: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.invitation.count({ where }),
    ]);

    return paginatedResponse(res, "Invitations retrieved successfully.", invitations, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all invitations error:", error);
    return errorResponse(res, "Failed to retrieve invitations.", 500);
  }
};

// ==========================================
// GET INVITATION BY ID
// ==========================================

export const getInvitationById = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        guest: true,
        event: true,
        checkIn: {
          include: {
            staff: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invitation not found.", 404);
    }

    return successResponse(res, "Invitation retrieved successfully.", invitation);

  } catch (error) {
    console.error("Get invitation by id error:", error);
    return errorResponse(res, "Failed to retrieve invitation.", 500);
  }
};

// ==========================================
// GENERATE INVITATION FOR GUEST
// ==========================================

export const generateGuestInvitation = async (req, res) => {
  try {
    const { guestId, eventId, channel } = req.body;

    if (!guestId || !eventId) {
      return errorResponse(res, "Guest ID and Event ID are required.");
    }

    const validChannels = ["SMS", "WHATSAPP", "BOTH"];
    if (channel && !validChannels.includes(channel)) {
      return errorResponse(res, "Invalid channel. Use SMS, WHATSAPP or BOTH.");
    }

    const result = await generateInvitation({
      guestId,
      eventId,
      channel: channel || "SMS",
    });

    if (!result.success) {
      return errorResponse(res, result.error);
    }

    return successResponse(res, "Invitation generated successfully.", result.invitation, 201);

  } catch (error) {
    console.error("Generate guest invitation error:", error);
    return errorResponse(res, "Failed to generate invitation.", 500);
  }
};

// ==========================================
// SEND INVITATION
// ==========================================

export const sendGuestInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sendInvitation({ invitationId: id });

    if (!result.success) {
      return errorResponse(res, result.error);
    }

    return successResponse(res, "Invitation sent successfully.", result.invitation);

  } catch (error) {
    console.error("Send guest invitation error:", error);
    return errorResponse(res, "Failed to send invitation.", 500);
  }
};

// ==========================================
// RELEASE INVITATION AFTER PAYMENT
// ==========================================

export const releaseInvitation = async (req, res) => {
  try {
    const { contributionId } = req.body;

    if (!contributionId) {
      return errorResponse(res, "Contribution ID is required.");
    }

    const result = await releaseInvitationAfterPayment({ contributionId });

    if (!result.success) {
      return errorResponse(res, result.error);
    }

    return successResponse(res, "Invitation released and sent successfully.", {
      invitation: result.invitation,
    });

  } catch (error) {
    console.error("Release invitation error:", error);
    return errorResponse(res, "Failed to release invitation.", 500);
  }
};

// ==========================================
// BULK GENERATE INVITATIONS
// ==========================================

export const bulkGenerateEventInvitations = async (req, res) => {
  try {
    const { eventId, channel } = req.body;

    if (!eventId) {
      return errorResponse(res, "Event ID is required.");
    }

    const result = await bulkGenerateInvitations({
      eventId,
      channel: channel || "SMS",
    });

    if (!result.success) {
      return errorResponse(res, result.error);
    }

    return successResponse(res, "Bulk invitation generation completed.", result.results);

  } catch (error) {
    console.error("Bulk generate invitations error:", error);
    return errorResponse(res, "Failed to generate invitations.", 500);
  }
};

// ==========================================
// VERIFY INVITATION BY QR TOKEN
// ==========================================

export const verifyByQRToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { qrToken: token },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            venue: true,
          },
        },
        checkIn: true,
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invalid QR code. Invitation not found.", 404);
    }

    if (invitation.checkIn) {
      return errorResponse(res, "ALREADY CHECKED IN", 409, {
        alreadyCheckedIn: true,
        checkInDetails: {
          checkedInAt: invitation.checkIn.checkedInAt,
          method: invitation.checkIn.method,
        },
        guest: {
          name: invitation.guest.name,
          phone: invitation.guest.phone,
        },
      });
    }

    return successResponse(res, "VALID INVITATION", {
      invitation: {
        id: invitation.id,
        invitationRef: invitation.invitationRef,
        channel: invitation.channel,
        status: invitation.status,
      },
      guest: {
        id: invitation.guest.id,
        name: invitation.guest.name,
        phone: invitation.guest.phone,
        expectedContribution: invitation.guest.expectedContribution,
      },
      event: invitation.event,
      checkInStatus: "NOT CHECKED IN",
    });

  } catch (error) {
    console.error("Verify QR token error:", error);
    return errorResponse(res, "Failed to verify QR code.", 500);
  }
};

// ==========================================
// VERIFY INVITATION BY SMS TOKEN
// ==========================================

export const verifyBySMSToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return errorResponse(res, "Token is required.");
    }

    const invitation = await prisma.invitation.findUnique({
      where: { smsToken: token.toUpperCase().trim() },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            venue: true,
          },
        },
        checkIn: true,
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invalid token. Guest not found.", 404);
    }

    if (invitation.checkIn) {
      return errorResponse(res, "ALREADY CHECKED IN", 409, {
        alreadyCheckedIn: true,
        checkInDetails: {
          checkedInAt: invitation.checkIn.checkedInAt,
          method: invitation.checkIn.method,
        },
        guest: {
          name: invitation.guest.name,
          phone: invitation.guest.phone,
        },
      });
    }

    return successResponse(res, "GUEST FOUND", {
      invitation: {
        id: invitation.id,
        invitationRef: invitation.invitationRef,
        smsToken: invitation.smsToken,
      },
      guest: {
        id: invitation.guest.id,
        name: invitation.guest.name,
        phone: invitation.guest.phone,
        expectedContribution: invitation.guest.expectedContribution,
      },
      event: invitation.event,
      checkInStatus: "NOT CHECKED IN",
    });

  } catch (error) {
    console.error("Verify SMS token error:", error);
    return errorResponse(res, "Failed to verify token.", 500);
  }
};

// ==========================================
// GET INVITATION QR CODE
// ==========================================

export const getInvitationQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      select: {
        id: true,
        invitationRef: true,
        qrCodeUrl: true,
        qrToken: true,
        smsToken: true,
        channel: true,
        guest: { select: { name: true } },
        event: { select: { name: true } },
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invitation not found.", 404);
    }

    return successResponse(res, "QR code retrieved successfully.", invitation);

  } catch (error) {
    console.error("Get invitation QR code error:", error);
    return errorResponse(res, "Failed to retrieve QR code.", 500);
  }
};