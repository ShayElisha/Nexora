// routes/department.route.js
import express from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  projectNameByDepartment,
} from "../controllers/department.controller.js";

const router = express.Router();

// יצירת מחלקה חדשה
router.post("/", createDepartment);

// קבלת כל המחלקות (ניתן להעביר companyId כ-query parameter אם רוצים לסנן)
router.get("/", getDepartments);

// קבלת מחלקה לפי מזהה
router.get("/:id", getDepartmentById);

// עדכון מחלקה לפי מזהה
router.put("/:id", updateDepartment);

// מחיקת מחלקה לפי מזהה
router.delete("/:id", deleteDepartment);
router.get("/projectName/:id", projectNameByDepartment);

export default router;
