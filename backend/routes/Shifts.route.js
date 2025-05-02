import express from "express";
import jwt from "jsonwebtoken";
import {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getMyAllShifts,
} from "../controllers/Shifts.controller.js";

const router = express.Router();
router.post("/", createShift);
router.get("/", getAllShifts);
router.get("/my", getMyAllShifts);
router.get("/:id", getShiftById);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

export default router;
