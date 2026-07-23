 
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import prisma from "./config/prisma.js";
import { startAllJobs } from "./jobs/reminder.job.js";

const PORT = process.env.PORT || 5001;

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Start Express server
    const server = app.listen(PORT, "127.0.0.1", () => {
      console.log("==========================================");
      console.log("🚀 Royal Events API Server Started");
      console.log("==========================================");
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
      console.log("==========================================");
      console.log("📋 Available API Routes:");
      console.log("==========================================");
      console.log("  POST   /api/auth/login");
      console.log("  GET    /api/auth/me");
      console.log("  GET    /api/users");
      console.log("  GET    /api/event-owners");
      console.log("  GET    /api/events");
      console.log("  GET    /api/guests");
      console.log("  GET    /api/contributions");
      console.log("  GET    /api/transactions");
      console.log("  GET    /api/invitations");
      console.log("  GET    /api/notifications");
      console.log("  GET    /api/reminders");
      console.log("  GET    /api/checkins");
      console.log("  GET    /api/payouts");
      console.log("  GET    /api/reports");
      console.log("  GET    /api/audit");
      console.log("==========================================");
    });

    // Start background jobs
    startAllJobs();

    return server;

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  console.log("✅ Database disconnected");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  console.log("✅ Database disconnected");
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

startServer();