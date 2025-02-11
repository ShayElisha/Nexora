// controllers/task.controller.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Task from "../models/tasks.model.js";
import Project from "../models/project.model.js";

/**
 * Create Task
 * יוצר משימה חדשה עבור החברה של המשתמש.
 */
export const createTask = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // חילוץ השדות מהבקשה
    const {
      projectId, // שדה חובה
      departmentId, // שדה אופציונלי
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
    } = req.body;

    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "Project id is required" });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    const dueDateObj = new Date(dueDate);
    if (project.endDate < dueDateObj) {
      console.log("Due date must be before project end date");
      return res.status(400).json({
        success: false,
        message: "Due date must be before project end date",
      });
    }

    // יצירת המשימה במסד הנתונים
    const task = await Task.create({
      companyId,
      projectId,
      departmentId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
    });

    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

/**
 * Get Tasks
 * מחזיר את כל המשימות של החברה.
 */
export const getTasks = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // שליפת המשימות של החברה בלבד
    const tasks = await Task.find({ companyId })
      .populate("companyId", "name") // מילוי שם החברה
      .populate("projectId", "name") // מילוי שם הפרויקט
      .populate("departmentId", "name") // מילוי שם המחלקה
      .populate("assignedTo", "name email role") // מילוי פרטי העובדים שהוקצו
      .populate("comments.commentedBy", "name email") // מילוי פרטי הכותבים של התגובות
      .sort({ dueDate: 1, priority: 1 });

    if (!tasks || tasks.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No tasks found" });
    }

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Get Task By ID
 * מחזיר משימה בודדת לפי מזהה.
 */
export const getTaskById = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    // שליפת המשימה ובדיקה שהיא שייכת לחברה
    const task = await Task.findOne({ _id: id, companyId })
      .populate("companyId", "name")
      .populate("projectId", "name")
      .populate("departmentId", "name")
      .populate("assignedTo", "name email role")
      .populate("comments.commentedBy", "name email");

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: error.message,
    });
  }
};

/**
 * Update Task
 * מעדכן משימה קיימת לפי מזהה.
 */
export const updateTask = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    // מניעת עדכון שדה companyId אם נשלח בבקשה
    if (req.body.companyId) delete req.body.companyId;

    // עדכון המשימה רק אם היא שייכת לחברה של המשתמש
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, companyId },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized",
      });
    }

    return res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

/**
 * Delete Task
 * מוחק משימה לפי מזהה.
 */
export const deleteTask = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    const deletedTask = await Task.findOneAndDelete({ _id: id, companyId });
    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};
