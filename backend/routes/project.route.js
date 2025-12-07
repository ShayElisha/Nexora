// routes/projectRoutes.js
import { Router } from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import {
  getProjectPortfolio,
  getResourceCapacity,
  getProjectTemplates,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
  createProjectFromTemplate,
  getProjectRisks,
  createProjectRisk,
  updateProjectRisk,
  deleteProjectRisk,
} from "../controllers/advancedProject.controller.js";

const router = Router();

// יצירת פרויקט
router.post("/", createProject);

// שליפת כל הפרויקטים
router.get("/", getAllProjects);

// ==================== ADVANCED PROJECT MANAGEMENT ====================

// Project Portfolio
router.get("/portfolio/overview", getProjectPortfolio);

// Resource Capacity Planning
router.get("/resources/capacity", getResourceCapacity);

// Project Templates
router.get("/templates", getProjectTemplates);
router.post("/templates", createProjectTemplate);
router.put("/templates/:id", updateProjectTemplate);
router.delete("/templates/:id", deleteProjectTemplate);
router.post("/templates/:id/create-project", createProjectFromTemplate);

// Project Risk Management
router.get("/risks", getProjectRisks);
router.post("/risks", createProjectRisk);
router.put("/risks/:id", updateProjectRisk);
router.delete("/risks/:id", deleteProjectRisk);

// ==================== BASIC PROJECT ROUTES ====================

// שליפת פרויקט בודד
router.get("/:id", getProjectById);

// עדכון פרויקט
router.put("/:id", updateProject);

// מחיקת פרויקט
router.delete("/:id", deleteProject);

export default router;
