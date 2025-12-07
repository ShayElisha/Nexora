import express from "express";
import {
  getEmployeeById,
  getEmployeeByIdParam,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
  createEmployee,
  updateEmployeeVacation,
  triggerMonthlyVacationUpdate,
  changePassword,
  addSickDay,
  useSickDay,
  useVacationDay,
} from "../controllers/employees.controller.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/", upload.single("profileImage"), createEmployee);
router.get("/", getAllEmployees);
router.get("/me", getEmployeeById);
router.get("/:id", getEmployeeByIdParam);
router.put("/:id", upload.single("profileImage"), updateEmployee);
router.put("/:id/vacation", updateEmployeeVacation);
router.post("/vacation/update", triggerMonthlyVacationUpdate);
router.delete("/:id", deleteEmployee);
router.put("/:id/add", addSickDay);
router.post("/change-password", changePassword);
router.put("/:id/use", useSickDay);
router.put("/:id/vacation/use", useVacationDay);

export default router;
