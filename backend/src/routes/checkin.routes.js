  
import express from "express";
import {
  getAllCheckIns,
  getCheckInById,
  checkInByQR,
  checkInBySMSToken,
  manualCheckIn,
  getEventCheckInStats,
} from "../controllers/checkin.controller.js";
import { authenticate, isStaff } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(isStaff);

router.get("/", getAllCheckIns);
router.get("/event/:eventId/stats", getEventCheckInStats);
router.get("/:id", getCheckInById);
router.post("/qr", checkInByQR);
router.post("/token", checkInBySMSToken);
router.post("/manual", manualCheckIn);

export default router;