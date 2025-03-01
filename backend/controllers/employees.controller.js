import Employee from "../models/employees.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary, { uploadToCloudinary } from "../config/lib/cloudinary.js";
// Pull all employees
export const getAllEmployees = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken?.companyId;
    const employees = await Employee.find({ companyId }).populate(
      "projects.projectId",
      "name"
    );
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving employees",
      error: error.message,
    });
  }
};

// Pull employee by id
export const getEmployeeById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const employeeId = decodedToken.employeeId; // לקבלת מזהה העובד מתוך הטוקן
    const employee = await Employee.findById({ _id: employeeId })
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("projects.projectId", "name");

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving employee",
      error: error.message,
    });
  }
};
export const extractPublicId = (url) => {
  // מוצאים את החלק לאחר "/upload/"
  const start = url.indexOf("/upload/") + 8;
  let publicIdWithExtension = url.substring(start);
  const versionRegex = /^v\d+\//;
  if (versionRegex.test(publicIdWithExtension)) {
    publicIdWithExtension = publicIdWithExtension.replace(versionRegex, "");
  }
  // מסירים את הסיומת
  return publicIdWithExtension.replace(/\.[^/.]+$/, "");
};
export const updateEmployee = async (req, res) => {
  const updates = req.body;
  console.log("req file" + req.file.path);
  console.log(updates);

  // רשימת השדות המותרים לעדכון (עבור כתובת – תתי שדות)
  const allowedUpdates = [
    "name",
    "lastName",
    "email",
    "password",
    "address.city",
    "address.street",
    "address.country",
    "address.postalCode",
    "phone",
    "role",
    "profileImage", // הקישור לתמונה החדשה
    // אם אין אפשרות לשמור את public_id בנפרד, נשתמש בחילוץ מה־URL
    "projects",
  ];

  // "מפלסים" את האובייקט כדי לאפשר עדכונים חלקיים עבור שדות מקוננים כמו address
  let flattenedUpdates = {};
  for (let key in updates) {
    if (key === "address" && typeof updates[key] === "object") {
      Object.keys(updates.address).forEach((subKey) => {
        flattenedUpdates[`address.${subKey}`] = updates.address[subKey];
      });
    } else {
      flattenedUpdates[key] = updates[key];
    }
  }

  // בדיקה שכל השדות בעדכון הם מאושרים
  const isValidUpdate = Object.keys(flattenedUpdates).every((key) =>
    allowedUpdates.includes(key)
  );
  if (!isValidUpdate) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid update fields." });
  }

  try {
    // מציאת העובד הקיים
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // טיפול בשינוי סיסמה
    if (flattenedUpdates.password) {
      flattenedUpdates.password = await bcrypt.hash(
        flattenedUpdates.password,
        10
      );
    }

    // טיפול בעדכון תמונת הפרופיל
    if (req.file) {
      // אם קיימת תמונה ישנה, ננסה לחלץ את ה־public id מתוך ה־URL שלה
      if (employee.profileImage) {
        const publicId = extractPublicId(employee.profileImage);
        console.log("publicId", publicId);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // העלאת התמונה החדשה
      const result = await uploadToCloudinary(req.file);

      // שמירת הקישור לתמונה החדשה
      flattenedUpdates.profileImage = result.secure_url;
    }

    // עדכון העובד בבסיס הנתונים
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: flattenedUpdates },
      { new: true, runValidators: true }
    )
      .populate("companyId", "name")
      .populate("projects.projectId", "name");

    if (!updatedEmployee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating employee",
      error: error.message,
    });
  }
};

// Delete employee by id
export const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting employee",
      error: error.message,
    });
  }
};
