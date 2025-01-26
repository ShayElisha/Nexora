import express from "express";
import {
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
} from "../controllers/employees.controller.js";

const router = express.Router();

router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
