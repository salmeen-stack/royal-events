  
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// GENERATE QR CODE AS DATA URL
// ==========================================

export const generateQRCodeDataURL = async (token) => {
  try {
    const qrData = `${process.env.FRONTEND_URL}/checkin/verify/${token}`;

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 300,
    });

    return {
      success: true,
      dataURL: qrCodeDataURL,
      qrData,
    };

  } catch (error) {
    console.error("Generate QR code error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// GENERATE QR CODE AS BASE64 STRING
// ==========================================

export const generateQRCodeBase64 = async (token) => {
  try {
    const qrData = `${process.env.FRONTEND_URL}/checkin/verify/${token}`;

    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      width: 300,
      margin: 1,
    });

    // Remove the data:image/png;base64, prefix
    const base64 = qrCodeBase64.replace(/^data:image\/png;base64,/, "");

    return {
      success: true,
      base64,
      qrData,
    };

  } catch (error) {
    console.error("Generate QR code base64 error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// GENERATE QR CODE AS SVG STRING
// ==========================================

export const generateQRCodeSVG = async (token) => {
  try {
    const qrData = `${process.env.FRONTEND_URL}/checkin/verify/${token}`;

    const svgString = await QRCode.toString(qrData, {
      type: "svg",
      errorCorrectionLevel: "H",
      width: 300,
      margin: 1,
    });

    return {
      success: true,
      svg: svgString,
      qrData,
    };

  } catch (error) {
    console.error("Generate QR code SVG error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};