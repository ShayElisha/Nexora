// controllers/department.controller.js
import Department from "../models/department.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Project from "../models/project.model.js";

/**
 * Create a new Department
 */
export const createDepartment = async (req, res) => {
  try {
    const { name, description, departmentManager, teamMembers } = req.body;
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    if (!companyId || !name) {
      return res
        .status(400)
        .json({ success: false, error: "companyId and name are required." });
    }

    const department = new Department({
      companyId,
      departmentManager,
      name,
      description,
      teamMembers,
    });
    await department.save();
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const { companyId } = req.query;
    const query = companyId ? { companyId } : {};
    const departments = await Department.find(query).populate(
      "teamMembers.employeeId",
      "name lastName"
    );
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get Department by ID
 */
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid department id." });
    }
    const department = await Department.findById(id);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, error: "Department not found." });
    }
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    console.error("Error fetching department by id:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update Department by ID
 */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid department id." });
    }
    const updatedDepartment = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedDepartment) {
      return res
        .status(404)
        .json({ success: false, error: "Department not found." });
    }
    res.status(200).json({ success: true, data: updatedDepartment });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete Department by ID
 */
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid department id." });
    }
    const deletedDepartment = await Department.findByIdAndDelete(id);
    if (!deletedDepartment) {
      return res
        .status(404)
        .json({ success: false, error: "Department not found." });
    }
    res.status(200).json({
      success: true,
      message: "Department deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const projectNameByDepartment = async (req, res) => {
  const departmentId = req.params.id;

  // בדיקת תקינות המזהה
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid department id" });
  }

  try {
    // מציאת המחלקה כולל populate של מערך הפרוייקטים (מביאים את השדות name ו-endDate)
    const department = await Department.findById(departmentId).populate(
      "projects.projectId",
      "name endDate"
    );
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    // חילוץ שמות הפרוייקטים יחד עם המזהה ותאריך הסיום שלהם
    const projectNames = department.projects
      .map((proj) => {
        if (proj.projectId && proj.projectId.name) {
          return {
            id: proj.projectId._id,
            name: proj.projectId.name,
            endDate: proj.projectId.endDate, // כולל גם את תאריך הסיום
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    res.status(200).json({ success: true, data: projectNames });
  } catch (error) {
    console.error("Error fetching project by department id:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
