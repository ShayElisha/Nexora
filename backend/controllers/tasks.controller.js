// controllers/task.controller.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Task from "../models/tasks.model.js";

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
    const { title, description, status, priority, dueDate, assignedTo } =
      req.body;

    // יצירת המשימה במסד הנתונים
    const task = await Task.create({
      companyId,
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

    // שליפת המשימות של החברה
    const tasks = await Task.find()
      .populate("companyId", "name") // Populate company name
      .populate("assignedTo", "name email role") // Populate assigned employees with name, email, and position
      .populate("comments.commentedBy", "name email") // Populate comment authors with name & email
      .sort({ dueDate: 1, priority: 1 }); // Sort by due date and priority

    if (!tasks || tasks.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No tasks found" });
    }

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

/**
 * Get Task By ID
 * מחזיר משימה בודדת לפי מזהה.
 */
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    const task = await Task.findById(id);
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    // עדכון המשימה עם הנתונים החדשים (req.body)
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};
