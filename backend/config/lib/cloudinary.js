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
    const base64Data = file.startsWith("data:")
      ? file
      : `data:application/pdf;base64,${file}`;
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "filesCompany",
      resource_type: "auto",
    });
    console.log("Upload successful:", result);
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
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
