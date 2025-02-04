// controllers/department.controller.js
import Department from "../models/department.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

/**
 * Create a new Department
 */
export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
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

    const department = new Department({ companyId, name, description });
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
    const departments = await Department.find(query);
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
