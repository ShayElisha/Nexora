import express from "express";
import { getSuperUnifiedReport } from "../controllers/reports.controller.js";

const router = express.Router();

// נתיב יחיד שמחזיר את "כל הנתונים"
router.get("/super-unified-report", getSuperUnifiedReport);

export default router;
