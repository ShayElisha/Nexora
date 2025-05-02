import express from "express";
import {
  getPayRates,
  getPayRateById,
  createPayRate,
  updatePayRate,
  deletePayRate,
} from "../controllers/PayRate.controller.js";

const router = express.Router();

// שליפת כל התעריפים של חברה (עם אפשרות לסינון פעילים בלבד)
router.get("/", getPayRates);

// שליפת תעריף ספציפי לפי ID
router.get("/:id", getPayRateById);

// יצירת תעריף חדש
router.post("/", createPayRate);

// עדכון תעריף קיים
router.put("/:id", updatePayRate);

// מחיקת תעריף (Soft Delete)
router.delete("/:id", deletePayRate);

export default router;