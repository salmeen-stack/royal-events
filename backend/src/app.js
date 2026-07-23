import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// IMPORT ROUTES
// ==========================================

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import eventOwnerRoutes from "./routes/event-owner.routes.js";
import eventRoutes from "./routes/event.routes.js";
import guestRoutes from "./routes/guest.routes.js";
import contributionRoutes from "./routes/contribution.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reminderRoutes from "./routes/reminder.routes.js";
import checkinRoutes from "./routes/checkin.routes.js";
import payoutRoutes from "./routes/payout.routes.js";
import reportRoutes from "./routes/report.routes.js";
import auditRoutes from "./routes/audit.routes.js";

// ==========================================
// IMPORT ERROR HANDLERS
// ==========================================

import { globalErrorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();

// ==========================================
// CORS - Must be first
// ==========================================

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
}));


// ==========================================
// GENERAL MIDDLEWARE
// ==========================================

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Royal Events API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/event-owners", eventOwnerRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit", auditRoutes);

// ==========================================
// ERROR HANDLERS
// ==========================================

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;