 
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// JWT TOKENS
// ==========================================

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ==========================================
// UNIQUE TOKENS
// ==========================================

export const generateUUID = () => {
  return uuidv4();
};

export const generateEventReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EVT-${timestamp}-${random}`;
};

export const generateInvitationRef = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
};

export const generateTransactionRef = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

export const generateQRToken = () => {
  return uuidv4().replace(/-/g, "") + uuidv4().replace(/-/g, "");
};

export const generateSMSToken = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) token += "-";
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const generateLinkToken = () => {
  return uuidv4().replace(/-/g, "");
};