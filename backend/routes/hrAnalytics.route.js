import express from "express";
import {
  getHRAnalytics,
  getEmployeeSelfServiceData,
} from "../controllers/hrAnalytics.controller.js";

const router = express.Router();

router.get("/", getHRAnalytics);
router.get("/employee/:employeeId", getEmployeeSelfServiceData);

export default router;

