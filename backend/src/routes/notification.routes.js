  
import express from "express";
import {
  getAllNotifications,
  getNotificationById,
  sendManualSMS,
  sendManualWhatsApp,
  sendBulkContributionReminders,
  getEventNotificationStats,
} from "../controllers/notification.controller.js";
import { authenticate, isStaff, isEventOwner } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(isEventOwner);

router.get("/", getAllNotifications);
router.get("/event/:eventId/stats", getEventNotificationStats);
router.get("/:id", getNotificationById);
router.post("/send-sms", sendManualSMS);
router.post("/send-whatsapp", sendManualWhatsApp);
router.post("/bulk-reminders", sendBulkContributionReminders);

export default router;