 
import prisma from "../config/prisma.js";
import { hashPassword } from "./hash.js";
import dotenv from "dotenv";

dotenv.config();

const seed = async () => {
  try {
    console.log("🌱 Seeding database...");

    // Check if super admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@royalevents.com" },
    });

    if (existingAdmin) {
      console.log("✅ Super Admin already exists");
      await prisma.$disconnect();
      return;
    }

    // Create Super Admin
    const hashedPassword = await hashPassword("Admin@2026");

    const admin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@royalevents.com",
        phone: "+255700000000",
        passwordHash: hashedPassword,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("==========================================");
    console.log("✅ Super Admin created successfully");
    console.log("==========================================");
    console.log("📧 Email: admin@royalevents.com");
    console.log("🔑 Password: Admin@2026");
    console.log("==========================================");
    console.log("⚠️  Please change the password after first login");
    console.log("==========================================");

    await prisma.$disconnect();

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seed();