  
import prisma from "../config/prisma.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response.js";

// ==========================================
// GET ALL EVENT OWNERS
// ==========================================

export const getAllEventOwners = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [eventOwners, total] = await Promise.all([
      prisma.eventOwner.findMany({
        where,
        include: {
          _count: {
            select: { events: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.eventOwner.count({ where }),
    ]);

    return paginatedResponse(res, "Event owners retrieved successfully.", eventOwners, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });

  } catch (error) {
    console.error("Get all event owners error:", error);
    return errorResponse(res, "Failed to retrieve event owners.", 500);
  }
};

// ==========================================
// GET EVENT OWNER BY ID
// ==========================================

export const getEventOwnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const eventOwner = await prisma.eventOwner.findUnique({
      where: { id },
      include: {
        events: {
          select: {
            id: true,
            eventReference: true,
            name: true,
            type: true,
            eventDate: true,
            status: true,
            contributionTarget: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { events: true },
        },
      },
    });

    if (!eventOwner) {
      return errorResponse(res, "Event owner not found.", 404);
    }

    return successResponse(res, "Event owner retrieved successfully.", eventOwner);

  } catch (error) {
    console.error("Get event owner by id error:", error);
    return errorResponse(res, "Failed to retrieve event owner.", 500);
  }
};

// ==========================================
// CREATE EVENT OWNER
// ==========================================

export const createEventOwner = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email || !phone) {
      return errorResponse(res, "Name, email and phone are required.");
    }

    const existingOwner = await prisma.eventOwner.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingOwner) {
      return errorResponse(res, "An event owner with this email already exists.");
    }

    const eventOwner = await prisma.eventOwner.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        address: address || null,
        isActive: true,
      },
    });

    return successResponse(res, "Event owner created successfully.", eventOwner, 201);

  } catch (error) {
    console.error("Create event owner error:", error);
    return errorResponse(res, "Failed to create event owner.", 500);
  }
};

// ==========================================
// UPDATE EVENT OWNER
// ==========================================

export const updateEventOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const existingOwner = await prisma.eventOwner.findUnique({
      where: { id },
    });

    if (!existingOwner) {
      return errorResponse(res, "Event owner not found.", 404);
    }

    if (email && email !== existingOwner.email) {
      const emailConflict = await prisma.eventOwner.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (emailConflict) {
        return errorResponse(res, "Email already in use.");
      }
    }

    const updatedOwner = await prisma.eventOwner.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(address !== undefined && { address }),
      },
    });

    return successResponse(res, "Event owner updated successfully.", updatedOwner);

  } catch (error) {
    console.error("Update event owner error:", error);
    return errorResponse(res, "Failed to update event owner.", 500);
  }
};

// ==========================================
// TOGGLE EVENT OWNER STATUS
// ==========================================

export const toggleEventOwnerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const eventOwner = await prisma.eventOwner.findUnique({
      where: { id },
    });

    if (!eventOwner) {
      return errorResponse(res, "Event owner not found.", 404);
    }

    const updatedOwner = await prisma.eventOwner.update({
      where: { id },
      data: { isActive: !eventOwner.isActive },
    });

    const message = updatedOwner.isActive
      ? "Event owner activated successfully."
      : "Event owner deactivated successfully.";

    return successResponse(res, message, updatedOwner);

  } catch (error) {
    console.error("Toggle event owner status error:", error);
    return errorResponse(res, "Failed to update event owner status.", 500);
  }
};

// ==========================================
// DELETE EVENT OWNER
// ==========================================

export const deleteEventOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const eventOwner = await prisma.eventOwner.findUnique({
      where: { id },
      include: {
        _count: { select: { events: true } },
      },
    });

    if (!eventOwner) {
      return errorResponse(res, "Event owner not found.", 404);
    }

    if (eventOwner._count.events > 0) {
      return errorResponse(
        res,
        "Cannot delete event owner with existing events. Deactivate instead."
      );
    }

    await prisma.eventOwner.delete({ where: { id } });

    return successResponse(res, "Event owner deleted successfully.");

  } catch (error) {
    console.error("Delete event owner error:", error);
    return errorResponse(res, "Failed to delete event owner.", 500);
  }
};