  
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

router.get("/", isSuperAdmin, getAllPayouts);
router.get("/event/:eventId/summary", isSuperAdmin, getEventPayoutSummary);
router.get("/:id", isSuperAdmin, getPayoutById);
router.post("/", isSuperAdmin, createPayout);
router.patch("/:id/status", isSuperAdmin, updatePayoutStatus);

export default router;