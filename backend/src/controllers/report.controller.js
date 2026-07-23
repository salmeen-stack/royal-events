  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";

// ==========================================
// EVENT FINANCIAL REPORT
// ==========================================

export const getEventFinancialReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventOwner: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      contributionSummary,
      contributionByStatus,
      transactionSummary,
      transactionByStatus,
      transactionByMethod,
      topContributors,
      recentTransactions,
    ] = await Promise.all([
      prisma.contribution.aggregate({
        where: { eventId },
        _sum: {
          expectedAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
        _count: true,
      }),
      prisma.contribution.groupBy({
        by: ["status"],
        where: { eventId },
        _count: true,
        _sum: {
          expectedAmount: true,
          paidAmount: true,
        },
      }),
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
      prisma.transaction.groupBy({
        by: ["paymentMethod"],
        where: { eventId, status: "SUCCESSFUL" },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.contribution.findMany({
        where: { eventId, status: "PAID" },
        include: {
          guest: {
            select: { id: true, name: true, phone: true, category: true },
          },
        },
        orderBy: { paidAmount: "desc" },
        take: 10,
      }),
      prisma.transaction.findMany({
        where: { eventId, status: "SUCCESSFUL" },
        include: {
          guest: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { paidAt: "desc" },
        take: 10,
      }),
    ]);

    const targetAchievement =
      event.contributionTarget > 0
        ? (
            (parseFloat(contributionSummary._sum.paidAmount || 0) /
              parseFloat(event.contributionTarget)) *
            100
          ).toFixed(2)
        : 0;

    return successResponse(res, "Financial report retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        eventReference: event.eventReference,
        eventDate: event.eventDate,
        venue: event.venue,
        contributionTarget: event.contributionTarget,
        status: event.status,
        eventOwner: event.eventOwner,
      },
      contributions: {
        total: contributionSummary._count,
        totalExpected: contributionSummary._sum.expectedAmount || 0,
        totalPaid: contributionSummary._sum.paidAmount || 0,
        totalBalance: contributionSummary._sum.balanceAmount || 0,
        targetAchievement: `${targetAchievement}%`,
        byStatus: contributionByStatus,
      },
      transactions: {
        total: transactionSummary._count,
        totalAmount: transactionSummary._sum.amount || 0,
        byStatus: transactionByStatus,
        byPaymentMethod: transactionByMethod,
      },
      topContributors,
      recentTransactions,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get financial report error:", error);
    return errorResponse(res, "Failed to generate financial report.", 500);
  }
};

// ==========================================
// EVENT GUEST REPORT
// ==========================================

export const getEventGuestReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      totalGuests,
      guestsByCategory,
      guestsByContributionStatus,
      unpaidGuests,
      partialGuests,
      paidGuests,
    ] = await Promise.all([
      prisma.guest.count({ where: { eventId } }),
      prisma.guest.groupBy({
        by: ["category"],
        where: { eventId },
        _count: true,
      }),
      prisma.contribution.groupBy({
        by: ["status"],
        where: { eventId },
        _count: true,
      }),
      prisma.contribution.findMany({
        where: { eventId, status: "PENDING" },
        include: {
          guest: {
            select: { id: true, name: true, phone: true, category: true },
          },
        },
        orderBy: { expectedAmount: "desc" },
      }),
      prisma.contribution.findMany({
        where: { eventId, status: "PARTIAL" },
        include: {
          guest: {
            select: { id: true, name: true, phone: true, category: true },
          },
        },
        orderBy: { balanceAmount: "desc" },
      }),
      prisma.contribution.findMany({
        where: { eventId, status: "PAID" },
        include: {
          guest: {
            select: { id: true, name: true, phone: true, category: true },
          },
        },
        orderBy: { paidAmount: "desc" },
      }),
    ]);

    return successResponse(res, "Guest report retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        eventReference: event.eventReference,
        eventDate: event.eventDate,
      },
      summary: {
        totalGuests,
        paid: paidGuests.length,
        partial: partialGuests.length,
        unpaid: unpaidGuests.length,
      },
      guestsByCategory,
      guestsByContributionStatus,
      unpaidGuests,
      partialGuests,
      paidGuests,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get guest report error:", error);
    return errorResponse(res, "Failed to generate guest report.", 500);
  }
};

// ==========================================
// EVENT INVITATION REPORT
// ==========================================

export const getEventInvitationReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      totalInvitations,
      invitationsByStatus,
      invitationsByChannel,
      failedInvitations,
      pendingInvitations,
    ] = await Promise.all([
      prisma.invitation.count({ where: { eventId } }),
      prisma.invitation.groupBy({
        by: ["status"],
        where: { eventId },
        _count: true,
      }),
      prisma.invitation.groupBy({
        by: ["channel"],
        where: { eventId },
        _count: true,
      }),
      prisma.invitation.findMany({
        where: { eventId, status: "FAILED" },
        include: {
          guest: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      prisma.invitation.findMany({
        where: { eventId, status: "PENDING" },
        include: {
          guest: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
    ]);

    return successResponse(res, "Invitation report retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        eventReference: event.eventReference,
        eventDate: event.eventDate,
      },
      summary: {
        totalInvitations,
        byStatus: invitationsByStatus,
        byChannel: invitationsByChannel,
      },
      failedInvitations,
      pendingInvitations,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get invitation report error:", error);
    return errorResponse(res, "Failed to generate invitation report.", 500);
  }
};

// ==========================================
// EVENT ATTENDANCE REPORT
// ==========================================

export const getEventAttendanceReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      totalGuests,
      totalCheckIns,
      checkInsByMethod,
      checkedInGuests,
      notCheckedInGuests,
      checkInTimeline,
    ] = await Promise.all([
      prisma.guest.count({ where: { eventId } }),
      prisma.checkIn.count({ where: { eventId } }),
      prisma.checkIn.groupBy({
        by: ["method"],
        where: { eventId },
        _count: true,
      }),
      prisma.checkIn.findMany({
        where: { eventId },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              phone: true,
              category: true,
              expectedContribution: true,
            },
          },
          staff: { select: { id: true, name: true } },
          invitation: { select: { channel: true, smsToken: true } },
        },
        orderBy: { checkedInAt: "asc" },
      }),
      prisma.guest.findMany({
        where: {
          eventId,
          checkIns: { none: {} },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          category: true,
          expectedContribution: true,
        },
      }),
      prisma.checkIn.findMany({
        where: { eventId },
        select: { checkedInAt: true },
        orderBy: { checkedInAt: "asc" },
      }),
    ]);

    return successResponse(res, "Attendance report retrieved successfully.", {
      event: {
        id: event.id,
        name: event.name,
        eventReference: event.eventReference,
        eventDate: event.eventDate,
        venue: event.venue,
      },
      summary: {
        totalGuests,
        totalCheckIns,
        notCheckedIn: totalGuests - totalCheckIns,
        attendanceRate:
          totalGuests > 0
            ? ((totalCheckIns / totalGuests) * 100).toFixed(2) + "%"
            : "0%",
        byMethod: checkInsByMethod,
      },
      checkedInGuests,
      notCheckedInGuests,
      checkInTimeline,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get attendance report error:", error);
    return errorResponse(res, "Failed to generate attendance report.", 500);
  }
};

// ==========================================
// SYSTEM WIDE REPORT (SUPER ADMIN)
// ==========================================

export const getSystemReport = async (req, res) => {
  try {
    const [
      totalEvents,
      eventsByStatus,
      eventsByType,
      totalGuests,
      totalContributions,
      totalTransactions,
      totalRevenue,
      totalInvitations,
      totalCheckIns,
      recentEvents,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.event.groupBy({
        by: ["type"],
        _count: true,
      }),
      prisma.guest.count(),
      prisma.contribution.aggregate({
        _sum: {
          expectedAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESSFUL" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESSFUL" },
        _sum: { amount: true },
      }),
      prisma.invitation.count(),
      prisma.checkIn.count(),
      prisma.event.findMany({
        include: {
          eventOwner: {
            select: { name: true },
          },
          _count: {
            select: {
              guests: true,
              checkIns: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return successResponse(res, "System report retrieved successfully.", {
      overview: {
        totalEvents,
        totalGuests,
        totalInvitations,
        totalCheckIns,
      },
      events: {
        total: totalEvents,
        byStatus: eventsByStatus,
        byType: eventsByType,
        recent: recentEvents,
      },
      financial: {
        totalContributions: totalContributions._count,
        totalExpected: totalContributions._sum.expectedAmount || 0,
        totalPaid: totalContributions._sum.paidAmount || 0,
        totalBalance: totalContributions._sum.balanceAmount || 0,
        successfulTransactions: totalTransactions._count,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get system report error:", error);
    return errorResponse(res, "Failed to generate system report.", 500);
  }
};

// ==========================================
// COMPLETE EVENT REPORT
// ==========================================

export const getCompleteEventReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventOwner: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!event) {
      return errorResponse(res, "Event not found.", 404);
    }

    const [
      guestStats,
      financialStats,
      invitationStats,
      checkInStats,
      notificationStats,
    ] = await Promise.all([
      prisma.guest.count({ where: { eventId } }),
      prisma.contribution.aggregate({
        where: { eventId },
        _sum: {
          expectedAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
        _count: true,
      }),
      prisma.invitation.count({ where: { eventId } }),
      prisma.checkIn.count({ where: { eventId } }),
      prisma.notification.count({ where: { eventId } }),
    ]);

    return successResponse(res, "Complete event report retrieved successfully.", {
      event,
      stats: {
        totalGuests: guestStats,
        financial: {
          totalContributions: financialStats._count,
          totalExpected: financialStats._sum.expectedAmount || 0,
          totalPaid: financialStats._sum.paidAmount || 0,
          totalBalance: financialStats._sum.balanceAmount || 0,
        },
        totalInvitations: invitationStats,
        totalCheckIns: checkInStats,
        totalNotifications: notificationStats,
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get complete event report error:", error);
    return errorResponse(res, "Failed to generate complete event report.", 500);
  }
};