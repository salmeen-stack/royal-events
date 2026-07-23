  
import express from "express";
import {
  getAllInvitations,
  getInvitationById,
  generateGuestInvitation,
  sendGuestInvitation,
  releaseInvitation,
  bulkGenerateEventInvitations,
  verifyByQRToken,
  verifyBySMSToken,
  getInvitationQRCode,
} from "../controllers/invitation.controller.js";
import { authenticate, isStaff, isEventOwner } from "../middleware/auth.js";

const router = express.Router();

// Public routes - for check-in verification
router.get("/verify/qr/:token", verifyByQRToken);
router.post("/verify/token", verifyBySMSToken);

// Protected routes
router.use(authenticate);
router.use(isEventOwner);

router.get("/", getAllInvitations);
router.get("/:id", getInvitationById);
router.get("/:id/qrcode", getInvitationQRCode);
router.post("/generate", generateGuestInvitation);
router.post("/bulk-generate", bulkGenerateEventInvitations);
router.post("/release", releaseInvitation);
router.post("/:id/send", sendGuestInvitation);

export default router;