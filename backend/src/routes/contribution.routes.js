  
import express from "express";
import {
  getAllContributions,
  getContributionById,
  updateContribution,
  regenerateContributionLink,
  getEventContributionSummary,
  sendContributionRequest,
  sendBulkContributionRequests,
} from "../controllers/contribution.controller.js";
import { authenticate, isStaff } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(isStaff);

router.get("/", getAllContributions);
router.get("/:id", getContributionById);
router.put("/:id", updateContribution);
router.patch("/:id/regenerate-link", regenerateContributionLink);
router.get("/event/:eventId/summary", getEventContributionSummary);
router.post("/:contributionId/send-request", sendContributionRequest);
router.post("/send-bulk-requests", sendBulkContributionRequests);

export default router;