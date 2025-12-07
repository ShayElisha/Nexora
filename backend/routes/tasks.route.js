// routes/task.route.js
import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDepartmentTasksWithoutProject,
} from "../controllers/tasks.controller.js";

const router = express.Router();

// יצירת משימה חדשה
router.post("/", createTask);

// קבלת כל המשימות
router.get("/", getTasks);

// Route for department tasks without project - MUST be before /:id route
router.get(
  "/department-tasks-without-project",
  getDepartmentTasksWithoutProject
);

// קבלת משימה לפי מזהה
router.get("/:id", getTaskById);

// עדכון משימה לפי מזהה
router.put("/:id", updateTask);

// מחיקת משימה לפי מזהה
router.delete("/:id", deleteTask);

export default router;
