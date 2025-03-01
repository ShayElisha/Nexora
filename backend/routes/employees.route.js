import express from "express";
import {
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
} from "../controllers/employees.controller.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router.get("/", getAllEmployees);
router.get("/me", getEmployeeById);
router.put("/:id", upload.single("profileImage"), updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
