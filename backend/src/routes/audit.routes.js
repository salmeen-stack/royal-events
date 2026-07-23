  
import express from "express";
import {
  getAllAuditLogs,
  getAuditLogById,
  getEventAuditLogs,
  getAuditLogStats,
} from "../controllers/audit.controller.js";
import { authenticate, isSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(isSuperAdmin);

router.get("/", getAllAuditLogs);
router.get("/stats", getAuditLogStats);
router.get("/event/:eventId", getEventAuditLogs);
router.get("/:id", getAuditLogById);

export default router;