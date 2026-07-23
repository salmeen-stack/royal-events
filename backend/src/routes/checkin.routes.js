  
import express from "express";
import {
  getAllCheckIns,
  getCheckInById,
  verifyQRToken,
  verifySMSToken,
  checkInByQR,
  checkInBySMSToken,
  manualCheckIn,
  getEventCheckInStats,
  requestOTPForCheckIn,
  verifyOTPAndCheckIn,
} from "../controllers/checkin.controller.js";
import { authenticate, isStaff, isEventOwner } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(isEventOwner);

router.get("/", getAllCheckIns);
router.get("/event/:eventId/stats", getEventCheckInStats);
router.get("/:id", getCheckInById);
router.post("/verify/qr", verifyQRToken);
router.post("/verify/token", verifySMSToken);
router.post("/qr", checkInByQR);
router.post("/token", checkInBySMSToken);
router.post("/manual", manualCheckIn);
router.post("/otp/request", requestOTPForCheckIn);
router.post("/otp/verify", verifyOTPAndCheckIn);

export default router;