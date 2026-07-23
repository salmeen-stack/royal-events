import prisma from "./prisma.js";

// ==========================================
// TEST DATABASE CONNECTION
// ==========================================

export const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

// ==========================================
// DISCONNECT DATABASE
// ==========================================

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log("✅ Database disconnected");
  } catch (error) {
    console.error("❌ Database disconnect error:", error.message);
  }
};

// ==========================================
// GET DATABASE STATS
// ==========================================

export const getDatabaseStats = async () => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalGuests,
      totalContributions,
      totalTransactions,
      totalInvitations,
      totalCheckIns,
      totalNotifications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.guest.count(),
      prisma.contribution.count(),
      prisma.transaction.count(),
      prisma.invitation.count(),
      prisma.checkIn.count(),
      prisma.notification.count(),
    ]);

    return {
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalGuests,
        totalContributions,
        totalTransactions,
        totalInvitations,
        totalCheckIns,
        totalNotifications,
      },
    };

  } catch (error) {
    console.error("Get database stats error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default prisma;