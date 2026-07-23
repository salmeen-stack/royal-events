  
import express from "express";
import {
  getAllReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  sendContributionReminders,
  sendEventReminders,
} from "../controllers/reminder.controller.js";
import { authenticate, isStaff, isEventOwner } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(isEventOwner);

router.get("/", getAllReminders);
router.get("/:id", getReminderById);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);
router.post("/send-contribution-reminders", sendContributionReminders);
router.post("/send-event-reminders", sendEventReminders);

export default router;