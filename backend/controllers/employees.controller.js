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

  // Log req.file safely
  console.log("req file:", req.file ? req.file.path : "No file uploaded");
  console.log("Updates:", updates);

  // List of allowed fields for updates
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
    "profileImage",
    "projects",
    "status", // Added to allow status updates
  ];

  // Flatten the updates object to handle nested fields like address
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

  // Validate that all update fields are allowed
  const isValidUpdate = Object.keys(flattenedUpdates).every((key) =>
    allowedUpdates.includes(key)
  );
  if (!isValidUpdate) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid update fields." });
  }

  try {
    // Find the existing employee
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Handle password update
    if (flattenedUpdates.password) {
      flattenedUpdates.password = await bcrypt.hash(
        flattenedUpdates.password,
        10
      );
    }

    // Handle profile image update only if a file is provided
    if (req.file) {
      // Delete the old image from Cloudinary if it exists
      if (employee.profileImage) {
        const publicId = extractPublicId(employee.profileImage);
        console.log("publicId:", publicId);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Upload the new image to Cloudinary
      const result = await uploadToCloudinary(req.file);
      flattenedUpdates.profileImage = result.secure_url;
    }

    // Update the employee in the database
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
