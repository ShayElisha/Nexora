// routes/projectRoutes.js
import { Router } from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";

const router = Router();

// יצירת פרויקט
router.post("/", createProject);

// שליפת כל הפרויקטים
router.get("/", getAllProjects);

// שליפת פרויקט בודד
router.get("/:id", getProjectById);

// עדכון פרויקט
router.put("/:id", updateProject);

// מחיקת פרויקט
router.delete("/:id", deleteProject);

export default router;
