import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getDefaultRoles,
  assignRoleToEmployee,
} from "../controllers/role.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get default roles
router.get("/defaults", protectRoute, getDefaultRoles);

// Get all roles (with optional companyId query for Admin)
router.get("/", protectRoute, getAllRoles);

// Get role by ID
router.get("/:id", protectRoute, getRoleById);

// Create role (Admin only for cross-company, otherwise any authenticated user for their company)
router.post("/", protectRoute, createRole);

// Update role
router.put("/:id", protectRoute, updateRole);

// Delete role
router.delete("/:id", protectRoute, deleteRole);

// Assign role to employee
router.put("/assign/:employeeId", protectRoute, assignRoleToEmployee);

export default router;

