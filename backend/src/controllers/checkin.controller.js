  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";
import { generateOTP, verifyOTP } from "../services/sms.service.js";

// ==========================================
// GET ALL CHECKINS
// ==========================================

export const getAllCheckIns = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId, method, search } = req.query;
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
    if (method) where.method = method;

    if (search) {
      where.OR = [
        { guest: { name: { contains: search, mode: "insensitive" } } },
        { guest: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        include: {
          guest: {
            select: { id: true, name: true, phone: true, category: true },
          },
          event: {
            select: { id: true, name: true, eventReference: true },
          },
          invitation: {
            select: {
              id: true,
              invitationRef: true,
              channel: true,
              smsToken: true,
            },
          },
          staff: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { checkedInAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.checkIn.count({ where }),
    ]);

    return paginatedResponse(res, "Check-ins retrieved successfully.", checkIns, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all check-ins error:", error);
    return errorResponse(res, "Failed to retrieve check-ins.", 500);
  }
};

// ==========================================
// GET CHECKIN BY ID
// ==========================================

export const getCheckInById = async (req, res) => {
  try {
    const { id } = req.params;

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      include: {
        guest: true,
        event: true,
        invitation: true,
        staff: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!checkIn) {
      return errorResponse(res, "Check-in record not found.", 404);
    }

    return successResponse(res, "Check-in retrieved successfully.", checkIn);

  } catch (error) {
    console.error("Get check-in by id error:", error);
    return errorResponse(res, "Failed to retrieve check-in.", 500);
  }
};

// ==========================================
// VERIFY QR TOKEN (GET GUEST DETAILS)
// ==========================================

export const verifyQRToken = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return errorResponse(res, "QR token is required.");
    }

    // Find invitation by QR token
    const invitation = await prisma.invitation.findUnique({
      where: { qrToken },
      include: {
        guest: {
          include: {
            contributions: {
              select: {
                expectedAmount: true,
                paidAmount: true,
                balanceAmount: true,
                status: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            venue: true,
            eventReference: true,
          },
        },
        checkIn: true,
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invalid QR code. Invitation not found.", 404);
    }

    return successResponse(res, "Guest verified successfully.", {
      guest: {
        id: invitation.guest.id,
        name: invitation.guest.name,
        phone: invitation.guest.phone,
        category: invitation.guest.category,
        contributions: invitation.guest.contributions,
      },
      event: invitation.event,
      invitation: {
        id: invitation.id,
        invitationRef: invitation.invitationRef,
        channel: invitation.channel,
      },
      alreadyCheckedIn: !!invitation.checkIn,
      checkInDetails: invitation.checkIn ? {
        checkedInAt: invitation.checkIn.checkedInAt,
        method: invitation.checkIn.method,
      } : null,
    });

  } catch (error) {
    console.error("Verify QR token error:", error);
    return errorResponse(res, "Failed to verify guest.", 500);
  }
};

// ==========================================
// VERIFY SMS TOKEN (GET GUEST DETAILS)
// ==========================================

export const verifySMSToken = async (req, res) => {
  try {
    const { smsToken } = req.body;

    if (!smsToken) {
      return errorResponse(res, "SMS token is required.");
    }

    // Find invitation by SMS token
    const invitation = await prisma.invitation.findUnique({
      where: { smsToken: smsToken.toUpperCase().trim() },
      include: {
        guest: {
          include: {
            contributions: {
              select: {
                expectedAmount: true,
                paidAmount: true,
                balanceAmount: true,
                status: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            venue: true,
            eventReference: true,
          },
        },
        checkIn: true,
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invalid token. Guest not found.", 404);
    }

    return successResponse(res, "Guest verified successfully.", {
      guest: {
        id: invitation.guest.id,
        name: invitation.guest.name,
        phone: invitation.guest.phone,
        category: invitation.guest.category,
        contributions: invitation.guest.contributions,
      },
      event: invitation.event,
      invitation: {
        id: invitation.id,
        invitationRef: invitation.invitationRef,
        channel: invitation.channel,
      },
      alreadyCheckedIn: !!invitation.checkIn,
      checkInDetails: invitation.checkIn ? {
        checkedInAt: invitation.checkIn.checkedInAt,
        method: invitation.checkIn.method,
      } : null,
    });

  } catch (error) {
    console.error("Verify SMS token error:", error);
    return errorResponse(res, "Failed to verify guest.", 500);
  }
};

// ==========================================
// CHECK IN BY QR TOKEN
// ==========================================

export const checkInByQR = async (req, res) => {
  try {
    const { qrToken, notes } = req.body;

    if (!qrToken) {
      return errorResponse(res, "QR token is required.");
    }

    // Find invitation by QR token
    const invitation = await prisma.invitation.findUnique({
      where: { qrToken },
      include: {
        guest: {
          include: {
            contributions: {
              select: {
                expectedAmount: true,
                paidAmount: true,
                balanceAmount: true,
                status: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            venue: true,
            eventReference: true,
          },
        },
        checkIn: true,
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invalid QR code. Invitation not found.", 404);
    }

    // Check if already checked in
    if (invitation.checkIn) {
      return errorResponse(res, "ALREADY CHECKED IN", 409, {
        alreadyCheckedIn: true,
        guest: {
          name: invitation.guest.name,
          phone: invitation.guest.phone,
        },
        checkInDetails: {
          checkedInAt: invitation.checkIn.checkedInAt,
          method: invitation.checkIn.method,
        },
      });
    }

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        method: "QR_SCAN",
        notes: notes || null,
        eventId: invitation.eventId,
        guestId: invitation.guestId,
        invitationId: invitation.id,
        staffId: req.user.id,
      },
      include: {
        guest: {
          select: { id: true, name: true, phone: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
    });

    // Update invitation status to delivered
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });

    return successResponse(res, "Guest checked in successfully.", {
      checkIn: {
        id: checkIn.id,
        method: checkIn.method,
        checkedInAt: checkIn.checkedInAt,
      },
      guest: {
        id: invitation.guest.id,
        name: invitation.guest.name,
        phone: invitation.guest.phone,
        category: invitation.guest.category,
        contributions: invitation.guest.contributions,
      },
      event: invitation.event,
      checkedInBy: checkIn.staff.name,
    });

  } catch (error) {
    console.error("Check-in by QR error:", error);
    return errorResponse(res, "Failed to check in guest.", 500);
  }
};

// ==========================================
// CHECK IN BY SMS TOKEN
// ==========================================

export const checkInBySMSToken = async (req, res) => {
  try {
    const { smsToken, notes } = req.body;

    if (!smsToken) {
      return errorResponse(res, "SMS token is required.");
    }

    // Find invitation by SMS token
    const invitation = await prisma.invitation.findUnique({
      where: { smsToken: smsToken.toUpperCase().trim() },
      include: {
        guest: {
          include: {
            contributions: {
              select: {
                expectedAmount: true,
                paidAmount: true,
                balanceAmount: true,
                status: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            venue: true,
            eventReference: true,
          },
        },
        checkIn: true,
      },
    });

    if (!invitation) {
      return errorResponse(res, "Invalid token. Guest not found.", 404);
    }

    // Check if already checked in
    if (invitation.checkIn) {
      return errorResponse(res, "ALREADY CHECKED IN", 409, {
        alreadyCheckedIn: true,
        guest: {
          name: invitation.guest.name,
          phone: invitation.guest.phone,
        },
        checkInDetails: {
          checkedInAt: invitation.checkIn.checkedInAt,
          method: invitation.checkIn.method,
        },
      });
    }

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        method: "SMS_TOKEN",
        notes: notes || null,
        eventId: invitation.eventId,
        guestId: invitation.guestId,
        invitationId: invitation.id,
        staffId: req.user.id,
      },
      include: {
        guest: {
          select: { id: true, name: true, phone: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });

    return successResponse(res, "Guest checked in successfully.", {
      checkIn: {
        id: checkIn.id,
        method: checkIn.method,
        checkedInAt: checkIn.checkedInAt,
      },
      guest: {
        id: invitation.guest.id,
        name: invitation.guest.name,
        phone: invitation.guest.phone,
        category: invitation.guest.category,
        contributions: invitation.guest.contributions,
      },
      event: invitation.event,
      checkedInBy: checkIn.staff.name,
    });

  } catch (error) {
    console.error("Check-in by SMS token error:", error);
    return errorResponse(res, "Failed to check in guest.", 500);
  }
};

// ==========================================
// MANUAL CHECK IN
// ==========================================

export const manualCheckIn = async (req, res) => {
  try {
    const { guestId, eventId, notes } = req.body;

    if (!guestId || !eventId) {
      return errorResponse(res, "Guest ID and Event ID are required.");
    }

    // Check if guest exists
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      return errorResponse(res, "Guest not found.", 404);
    }

    // Find invitation
    const invitation = await prisma.invitation.findFirst({
      where: { guestId, eventId },
      include: { checkIn: true },
    });

    if (!invitation) {
      return errorResponse(res, "No invitation found for this guest.");
    }

    if (invitation.checkIn) {
      return errorResponse(res, "Guest has already been checked in.", 409);
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        method: "MANUAL",
        notes: notes || null,
        eventId,
        guestId,
        invitationId: invitation.id,
        staffId: req.user.id,
      },
    });

    return successResponse(res, "Guest manually checked in successfully.", checkIn);

  } catch (error) {
    console.error("Manual check-in error:", error);
    return errorResponse(res, "Failed to check in guest.", 500);
  }
};

// ==========================================
// GET EVENT CHECKIN STATS
// ==========================================

export const getEventCheckInStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      totalGuests,
      totalCheckIns,
      qrCheckIns,
      smsCheckIns,
      manualCheckIns,
      recentCheckIns,
    ] = await Promise.all([
      prisma.guest.count({ where: { eventId } }),
      prisma.checkIn.count({ where: { eventId } }),
      prisma.checkIn.count({ where: { eventId, method: "QR_SCAN" } }),
      prisma.checkIn.count({ where: { eventId, method: "SMS_TOKEN" } }),
      prisma.checkIn.count({ where: { eventId, method: "MANUAL" } }),
      prisma.checkIn.findMany({
        where: { eventId },
        include: {
          guest: { select: { name: true, phone: true, category: true } },
          staff: { select: { name: true } },
        },
        orderBy: { checkedInAt: "desc" },
        take: 10,
      }),
    ]);

    return successResponse(res, "Check-in stats retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        eventDate: event.eventDate,
      },
      stats: {
        totalGuests,
        totalCheckIns,
        notCheckedIn: totalGuests - totalCheckIns,
        attendanceRate: totalGuests > 0
          ? ((totalCheckIns / totalGuests) * 100).toFixed(2)
          : 0,
      },
      methods: {
        qrScan: qrCheckIns,
        smsToken: smsCheckIns,
        manual: manualCheckIns,
      },
      recentCheckIns,
    });

  } catch (error) {
    console.error("Get event check-in stats error:", error);
    return errorResponse(res, "Failed to retrieve check-in stats.", 500);
  }
};

// ==========================================
// REQUEST OTP FOR CHECK-IN
// ==========================================

export const requestOTPForCheckIn = async (req, res) => {
  try {
    const { phone, eventId } = req.body;

    if (!phone || !eventId) {
      return errorResponse(res, "Phone number and Event ID are required.");
    }

    // Validate phone number format
    const formattedPhone = phone.replace(/^\+/, "");

    // Find guest by phone and event
    const guest = await prisma.guest.findFirst({
      where: {
        phone: { contains: formattedPhone, mode: "insensitive" },
        eventId,
      },
      include: {
        invitations: {
          where: { eventId },
          include: { checkIn: true },
        },
        event: true,
      },
    });

    if (!guest) {
      return errorResponse(res, "Guest not found for this phone number and event.", 404);
    }

    // Check if guest has an invitation
    if (guest.invitations.length === 0) {
      return errorResponse(res, "No invitation found for this guest.", 404);
    }

    // Check if already checked in
    const existingCheckIn = guest.invitations.find(inv => inv.checkIn);
    if (existingCheckIn) {
      return errorResponse(res, "Guest has already been checked in.", 409);
    }

    // Generate OTP via RafikiSMS
    const otpResult = await generateOTP(formattedPhone);

    if (!otpResult.success) {
      return errorResponse(res, "Failed to generate OTP. Please try again.", 500);
    }

    // Store reference ID in session or temporary storage (for now, return it)
    // In production, you might want to store this in Redis or database with expiration
    return successResponse(res, "OTP sent successfully.", {
      referenceId: otpResult.referenceId,
      expiresIn: otpResult.expiresIn,
      guest: {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
      },
    });

  } catch (error) {
    console.error("Request OTP for check-in error:", error);
    return errorResponse(res, "Failed to request OTP.", 500);
  }
};

// ==========================================
// VERIFY OTP AND CHECK-IN
// ==========================================

export const verifyOTPAndCheckIn = async (req, res) => {
  try {
    const { phone, otpCode, referenceId, eventId, notes } = req.body;

    if (!phone || !otpCode || !referenceId || !eventId) {
      return errorResponse(res, "Phone, OTP code, reference ID, and Event ID are required.");
    }

    // Validate phone number format
    const formattedPhone = phone.replace(/^\+/, "");

    // Verify OTP via RafikiSMS
    const verifyResult = await verifyOTP(formattedPhone, otpCode, referenceId);

    if (!verifyResult.success || !verifyResult.verified) {
      return errorResponse(res, verifyResult.message || "Invalid OTP code.", 400, {
        errorCode: verifyResult.errorCode,
      });
    }

    // Find guest by phone and event
    const guest = await prisma.guest.findFirst({
      where: {
        phone: { contains: formattedPhone, mode: "insensitive" },
        eventId,
      },
      include: {
        invitations: {
          where: { eventId },
          include: { checkIn: true },
        },
        event: true,
      },
    });

    if (!guest) {
      return errorResponse(res, "Guest not found.", 404);
    }

    // Get invitation
    const invitation = guest.invitations[0];
    if (!invitation) {
      return errorResponse(res, "No invitation found for this guest.", 404);
    }

    // Check if already checked in
    if (invitation.checkIn) {
      return errorResponse(res, "Guest has already been checked in.", 409, {
        alreadyCheckedIn: true,
        checkInDetails: {
          checkedInAt: invitation.checkIn.checkedInAt,
          method: invitation.checkIn.method,
        },
      });
    }

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        method: "OTP",
        notes: notes || null,
        eventId,
        guestId: guest.id,
        invitationId: invitation.id,
        staffId: req.user.id,
      },
      include: {
        guest: {
          select: { id: true, name: true, phone: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });

    return successResponse(res, "Guest checked in successfully via OTP.", {
      checkIn: {
        id: checkIn.id,
        method: checkIn.method,
        checkedInAt: checkIn.checkedInAt,
      },
      guest: {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        category: guest.category,
      },
      event: guest.event,
      checkedInBy: checkIn.staff.name,
    });

  } catch (error) {
    console.error("Verify OTP and check-in error:", error);
    return errorResponse(res, "Failed to verify OTP and check in.", 500);
  }
};