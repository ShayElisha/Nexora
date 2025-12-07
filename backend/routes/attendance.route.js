import express from "express";
import {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceStatistics,
} from "../controllers/attendance.controller.js";

const router = express.Router();

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/", getAttendance);
router.get("/:id", getAttendanceById);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);
router.get("/statistics/overview", getAttendanceStatistics);

export default router;

