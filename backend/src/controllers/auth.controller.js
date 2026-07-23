 
import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/token.js";
import { successResponse, errorResponse } from "../utils/response.js";

// ==========================================
// LOGIN
// ==========================================


export const login = async (req, res) => {
  try {
    console.log("Login attempt:", req.body);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, "Email and password are required.");
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return errorResponse(res, "Invalid email or password.", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Your account has been deactivated.", 401);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse(res, "Invalid email or password.", 401);
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return response
    return successResponse(res, "Login successful.", {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, "Login failed. Please try again.", 500);
  }
};

// ==========================================
// GET CURRENT USER (ME)
// ==========================================

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return successResponse(res, "User retrieved successfully.", user);

  } catch (error) {
    console.error("Get me error:", error);
    return errorResponse(res, "Failed to retrieve user.", 500);
  }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, "Current password and new password are required.");
    }

    if (newPassword.length < 8) {
      return errorResponse(res, "New password must be at least 8 characters.");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse(res, "Current password is incorrect.", 401);
    }

    const newHashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHashedPassword },
    });

    return successResponse(res, "Password changed successfully.");

  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse(res, "Failed to change password.", 500);
  }
};