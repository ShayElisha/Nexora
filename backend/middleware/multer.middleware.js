import multer from "multer";

// סיווג סוגי קבצים מותרים לפי שדות
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const fileFilter = (req, file, cb) => {
  const { fieldname, mimetype } = file;

  if (["profileImage", "productImage"].includes(fieldname)) {
    // רק תמונות מותרות
    if (imageMimeTypes.includes(mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type for ${fieldname}. Only JPEG, PNG, GIF, and WEBP are allowed.`
        ),
        false
      );
    }
  } else if (fieldname === "attachments") {
    // לכל קובץ אחר – מותר הכל
    cb(null, true);
  } else {
    // ברירת מחדל – נאפשר רק תמונות
    if (imageMimeTypes.includes(mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type for ${fieldname}. Only JPEG, PNG, GIF, and WEBP are allowed.`
        ),
        false
      );
    }
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // עד 5MB
  },
  fileFilter,
});

export default upload;
