  
import express from "express";
import {
  getEventFinancialReport,
  getEventGuestReport,
  getEventInvitationReport,
  getEventAttendanceReport,
  getSystemReport,
  getCompleteEventReport,
} from "../controllers/report.controller.js";
import { authenticate, isStaff, isSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/system", isStaff, getSystemReport);
router.get("/event/:eventId/financial", isStaff, getEventFinancialReport);
router.get("/event/:eventId/guests", isStaff, getEventGuestReport);
router.get("/event/:eventId/invitations", isStaff, getEventInvitationReport);
router.get("/event/:eventId/attendance", isStaff, getEventAttendanceReport);
router.get("/event/:eventId/complete", isStaff, getCompleteEventReport);

export default router;