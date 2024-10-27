import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../controllers/suppliersController.js";

const router = express.Router();

router.get("/", getAll); // קבלת כל הספקים
router.get("/:id", getById); // קבלת ספק לפי ID
router.post("/", create); // יצירת ספק חדש
router.put("/:id", update); // עדכון פרטי ספק
router.delete("/:id", remove); // מחיקת ספק

export default router;
