import multer from "multer";

// Memory storage for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "productImage") {
      // עבור תמונה – רק סוגי תמונות מורשים
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Invalid file type for product image. Only JPEG, PNG, GIF, and WEBP are allowed."
          ),
          false
        );
      }
    } else if (file.fieldname === "attachments") {
      // עבור קבצים מצורפים – אפשר לאפשר כל סוג קובץ
      cb(null, true);
    } else {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."),
          false
        );
      }
    }
  },
});

export default upload;
