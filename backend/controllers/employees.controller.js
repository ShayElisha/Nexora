import Employee from "../models/employees.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
    const employees = await Employee.find({ companyId });
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
    const employee = await Employee.findById(req.params.id)
      .populate("companyId", "CompanyName")
      .populate("projectsList.projectId", "projectName");
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

// Update employee by allowed fields
export const updateEmployee = async (req, res) => {
  const updates = req.body;
  const allowedUpdates = [
    "fullName",
    "email",
    "password",
    "address",
    "city",
    "phone",
    "role",
    "profileImageURL",
    "projectsList",
  ];

  // בדיקת ולידציה לשדות מותרים לעדכון
  const isValidUpdate = Object.keys(updates).every((key) =>
    allowedUpdates.includes(key)
  );
  if (!isValidUpdate) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid update fields." });
  }

  try {
    // הצפנת סיסמה במקרה שהיא מעודכנת
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("companyId", "CompanyName")
      .populate("projectsList.projectId", "projectName");

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
