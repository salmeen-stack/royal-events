  
import express from "express";
import {
  getAllPayouts,
  getPayoutById,
  createPayout,
  updatePayoutStatus,
  getEventPayoutSummary,
} from "../controllers/payout.controller.js";
import { authenticate, isSuperAdmin, isStaff } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", isStaff, getAllPayouts);
router.get("/event/:eventId/summary", isStaff, getEventPayoutSummary);
router.get("/:id", isStaff, getPayoutById);
router.post("/", isSuperAdmin, createPayout);
router.patch("/:id/status", isSuperAdmin, updatePayoutStatus);

export default router;