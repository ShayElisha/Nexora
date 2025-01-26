import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// פורמטים תקפים
const validImageFormats = ["jpg", "jpeg", "png", "gif"];
const validDocumentFormats = ["pdf", "docx", "txt"];
export const uploadToCloudinary = async (file) => {
  try {
    // If file is a buffer (from multer or similar middleware)
    if (file.buffer) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "profile_images" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    }

    // If file is a path
    if (file.path) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "profile_images",
      });

      // Optionally remove local file after upload
      fs.unlinkSync(file.path);

      return result;
    }

    throw new Error("Invalid file format");
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

export default cloudinary;
