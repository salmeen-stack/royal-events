  
import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
} from "../controllers/event.controller.js";
import { authenticate, isStaff } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", isStaff, getAllEvents);
router.get("/:id", getEventById);
router.get("/:id/stats", getEventStats);
router.post("/", isStaff, createEvent);
router.put("/:id", isStaff, updateEvent);
router.delete("/:id", isStaff, deleteEvent);

export default router;