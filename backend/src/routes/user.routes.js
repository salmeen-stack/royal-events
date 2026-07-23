 
import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from "../controllers/user.controller.js";
import { authenticate, isSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// All user routes require authentication and Super Admin role
router.use(authenticate);
router.use(isSuperAdmin);

router.get("", getAllUsers);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("", createUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/toggle-status", toggleUserStatus);
router.patch("/:id/reset-password", resetUserPassword);
router.delete("/:id", deleteUser);

export default router;