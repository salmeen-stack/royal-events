 
import multer from "multer";
import path from "path";
import fs from "fs";

// ==========================================
// CREATE UPLOAD DIRECTORY
// ==========================================

const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP images and Excel/CSV files are allowed."
      ),
      false
    );
  }
};

// ==========================================
// MULTER UPLOAD INSTANCES
// ==========================================

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadExcel = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel and CSV files are allowed."), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ==========================================
// PARSE EXCEL/CSV FILE
// ==========================================

export const parseExcelFile = async (filePath) => {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Clean up file after parsing
    fs.unlinkSync(filePath);

    return {
      success: true,
      data,
      count: data.length,
    };

  } catch (error) {
    console.error("Parse Excel file error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// PARSE CSV FILE
// ==========================================

export const parseCSVFile = async (filePath) => {
  return new Promise((resolve) => {
    const results = [];

    import("csv-parser").then((csvParser) => {
      fs.createReadStream(filePath)
        .pipe(csvParser.default())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          // Clean up file after parsing
          fs.unlinkSync(filePath);
          resolve({
            success: true,
            data: results,
            count: results.length,
          });
        })
        .on("error", (error) => {
          resolve({
            success: false,
            error: error.message,
          });
        });
    });
  });
};

// ==========================================
// IMPORT GUESTS FROM FILE
// ==========================================

export const importGuestsFromFile = async (filePath, mimetype) => {
  let parseResult;

  if (mimetype === "text/csv") {
    parseResult = await parseCSVFile(filePath);
  } else {
    parseResult = await parseExcelFile(filePath);
  }

  if (!parseResult.success) {
    return parseResult;
  }

  // Map and validate data
  const guests = parseResult.data.map((row) => ({
    name: row.name || row.Name || row.NAME || "",
    phone: String(row.phone || row.Phone || row.PHONE || ""),
    email: row.email || row.Email || row.EMAIL || "",
    category: row.category || row.Category || row.CATEGORY || "",
    expectedContribution:
      parseFloat(
        row.expectedContribution ||
          row.expected_contribution ||
          row["Expected Contribution"] ||
          0
      ) || 0,
    notes: row.notes || row.Notes || row.NOTES || "",
  }));

  const validGuests = guests.filter((g) => g.name && g.phone);
  const invalidGuests = guests.filter((g) => !g.name || !g.phone);

  return {
    success: true,
    validGuests,
    invalidGuests,
    totalRows: parseResult.count,
    validCount: validGuests.length,
    invalidCount: invalidGuests.length,
  };
};