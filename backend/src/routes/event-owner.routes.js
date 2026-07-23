  
import express from "express";
import {
  getAllEventOwners,
  getEventOwnerById,
  createEventOwner,
  updateEventOwner,
  toggleEventOwnerStatus,
  deleteEventOwner,
} from "../controllers/event-owner.controller.js";
import { authenticate, isStaff } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(isStaff);

router.get("/", getAllEventOwners);
router.get("/:id", getEventOwnerById);
router.post("/", createEventOwner);
router.put("/:id", updateEventOwner);
router.patch("/:id/toggle-status", toggleEventOwnerStatus);
router.delete("/:id", deleteEventOwner);

export default router;