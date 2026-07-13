import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// פורמטים תקפים
const validImageFormats = ["jpg", "jpeg", "png", "gif", "webp"];
const validDocumentFormats = ["pdf", "docx", "txt"];
export const uploadToCloudinary = async (file, options = {}) => {
  try {
    // המרת ה-buffer ל-Buffer תקין אם הוא ArrayBuffer
    const fileBuffer = Buffer.isBuffer(file)
      ? file
      : Buffer.from(new Uint8Array(file));

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { ...options, resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};


const getFileExtension = (filename) => filename.split(".").pop().toLowerCase();

// פונקציה לזיהוי אם קובץ בפורמט Base64
const isBase64 = (str) => {
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch {
    return false;
  }
};

// פונקציה להעלאה ל-Cloudinary
export const uploadToCloudinaryFile = async (file) => {
  try {
    // בדיקה שהקובץ קיים
    if (!file || (typeof file === 'string' && file.trim().length === 0)) {
      throw new Error("File is empty or missing");
    }

    // בדיקת הגדרות Cloudinary
    const missingConfig = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingConfig.push("CLOUDINARY_CLOUD_NAME");
    if (!process.env.CLOUDINARY_API_KEY) missingConfig.push("CLOUDINARY_API_KEY");
    if (!process.env.CLOUDINARY_API_SECRET) missingConfig.push("CLOUDINARY_API_SECRET");
    
    if (missingConfig.length > 0) {
      const errorMsg = `Cloudinary configuration is missing: ${missingConfig.join(", ")}. Please check environment variables.`;
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }

    // הכנת base64 data
    let base64Data;
    if (file.startsWith("data:")) {
      base64Data = file;
    } else if (file.startsWith("data:application/pdf;base64,")) {
      base64Data = file;
    } else {
      // הסרת רווחים וקפיצות שורה
      const cleanBase64 = file.replace(/\s/g, '');
      base64Data = `data:application/pdf;base64,${cleanBase64}`;
    }

    // בדיקה שהנתונים לא ריקים
    if (base64Data.length < 100) {
      throw new Error(`Base64 data is too short or invalid (length: ${base64Data.length})`);
    }

    // בדיקה שהנתונים בפורמט base64 תקין
    const base64Pattern = /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/;
    if (!base64Pattern.test(base64Data)) {
      // נסה לתקן - אולי יש רווחים
      const cleaned = base64Data.replace(/\s/g, '');
      if (!base64Pattern.test(cleaned)) {
        throw new Error("Base64 data format is invalid");
      }
      base64Data = cleaned;
    }

    console.log("☁️ Uploading to Cloudinary... (data length:", base64Data.length, ")");
    
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "filesCompany",
      resource_type: "auto",
      timeout: 60000, // 60 seconds timeout
      chunk_size: 6000000, // 6MB chunks for large files
    });
    
    console.log("✅ Upload successful:", result.secure_url);
    return result;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      http_code: error.http_code,
      response: error.response
    });
    throw error;
  }
};

export const extractPublicId = (url) => {
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;

  const pathPart = parts[1];

  const pathParts = pathPart.split("/");
  const publicIdWithExtension = pathParts.slice(1).join("/"); // "products/iakkypbyrssngeqq5r02.png"

  const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

  return publicId;
};

export default cloudinary;
