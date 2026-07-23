import prisma from "../config/prisma.js";
import { hashPassword } from "../utils/hash.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";

// ==========================================
// GET ALL USERS
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(res, "Users retrieved successfully.", users, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all users error:", error);
    return errorResponse(res, "Failed to retrieve users.", 500);
  }
};

// ==========================================
// GET USER BY ID
// ==========================================

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, "User not found.", 404);
    }

    return successResponse(res, "User retrieved successfully.", user);

  } catch (error) {
    console.error("Get user by id error:", error);
    return errorResponse(res, "Failed to retrieve user.", 500);
  }
};

// ==========================================
// CREATE USER
// ==========================================

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate input
    if (!name || !email) {
      return errorResponse(res, "Name and email are required.");
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return errorResponse(res, "Email already exists.");
    }

    // Validate role
    const validRoles = ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"];
    if (role && !validRoles.includes(role)) {
      return errorResponse(res, "Invalid role.");
    }

    // Use provided password or default
    const userPassword = password || "royalevent123";
    const passwordHash = await hashPassword(userPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        passwordHash,
        role: role || "STAFF",
        isActive: true,
      },
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

    const message = password 
      ? "User created successfully." 
      : "User created successfully. Default password: royalevent123";

    return successResponse(res, message, user, 201);

  } catch (error) {
    console.error("Create user error:", error);
    return errorResponse(res, "Failed to create user.", 500);
  }
};

// ==========================================
// UPDATE USER
// ==========================================

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return errorResponse(res, "User not found.", 404);
    }

    // Check email conflict
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (emailConflict) {
        return errorResponse(res, "Email already in use.");
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(phone && { phone }),
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return successResponse(res, "User updated successfully.", updatedUser);

  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse(res, "Failed to update user.", 500);
  }
};

// ==========================================
// TOGGLE USER STATUS
// ==========================================

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return errorResponse(res, "User not found.", 404);
    }

    // Prevent deactivating own account
    if (user.id === req.user.id) {
      return errorResponse(res, "You cannot deactivate your own account.");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    const message = updatedUser.isActive
      ? "User activated successfully."
      : "User deactivated successfully.";

    return successResponse(res, message, updatedUser);

  } catch (error) {
    console.error("Toggle user status error:", error);
    return errorResponse(res, "Failed to update user status.", 500);
  }
};

// ==========================================
// RESET USER PASSWORD
// ==========================================

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return errorResponse(res, "New password must be at least 8 characters.");
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return errorResponse(res, "User not found.", 404);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return successResponse(res, "Password reset successfully.");

  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse(res, "Failed to reset password.", 500);
  }
};

// ==========================================
// DELETE USER
// ==========================================

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return errorResponse(res, "User not found.", 404);
    }

    if (user.id === req.user.id) {
      return errorResponse(res, "You cannot delete your own account.");
    }

    await prisma.user.delete({
      where: { id },
    });

    return successResponse(res, "User deleted successfully.");

  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse(res, "Failed to delete user.", 500);
  }
};