  
import express from "express";
import {
  getAllGuests,
  getGuestById,
  createGuest,
  bulkImportGuests,
  updateGuest,
  deleteGuest,
  getContributionPage,
} from "../controllers/guest.controller.js";
import { authenticate, isStaff } from "../middleware/auth.js";

const router = express.Router();

// Public route - contribution page (no auth needed)
router.get("/contribute/:token", getContributionPage);

// Protected routes
router.use(authenticate);

router.get("/", isStaff, getAllGuests);
router.get("/:id", isStaff, getGuestById);
router.post("/", isStaff, createGuest);
router.post("/bulk-import", isStaff, bulkImportGuests);
router.put("/:id", isStaff, updateGuest);
router.delete("/:id", isStaff, deleteGuest);

export default router;