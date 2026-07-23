  
import express from "express";
import {
  getAllTransactions,
  getTransactionById,
  initiatePayment,
  handlePaymentWebhook,
  getEventTransactionSummary,
} from "../controllers/transaction.controller.js";
import { authenticate, isStaff, isEventOwner } from "../middleware/auth.js";

const router = express.Router();

// Public webhook route - no auth needed
router.post("/webhook/snippe", handlePaymentWebhook);

// Public payment initiation - no auth needed (guest pays)
router.post("/initiate", initiatePayment);

// Protected routes
router.use(authenticate);
router.use(isEventOwner);

router.get("/", getAllTransactions);
router.get("/event/:eventId/summary", getEventTransactionSummary);
router.get("/:id", getTransactionById);

export default router;