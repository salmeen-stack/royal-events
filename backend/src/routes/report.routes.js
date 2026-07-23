  
import express from "express";
import {
  getEventFinancialReport,
  getEventGuestReport,
  getEventInvitationReport,
  getEventAttendanceReport,
  getSystemReport,
  getCompleteEventReport,
} from "../controllers/report.controller.js";
import { authenticate, isStaff, isSuperAdmin, isEventOwner } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/system", isStaff, getSystemReport);
router.get("/event/:eventId/financial", isEventOwner, getEventFinancialReport);
router.get("/event/:eventId/guests", isEventOwner, getEventGuestReport);
router.get("/event/:eventId/invitations", isEventOwner, getEventInvitationReport);
router.get("/event/:eventId/attendance", isEventOwner, getEventAttendanceReport);
router.get("/event/:eventId/complete", isEventOwner, getCompleteEventReport);

export default router;