import express from "express";
import {
  checkPermission,
  getUserPermissions,
  getAllAvailablePermissions,
} from "../controllers/permission.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all available permissions (modules and actions)
router.get("/available", protectRoute, getAllAvailablePermissions);

// Check if user has specific permission
router.get("/check/:module/:action", protectRoute, checkPermission);

// Get all permissions for a user
router.get("/user/:userId", protectRoute, getUserPermissions);

// Get current user's permissions
router.get("/me", protectRoute, (req, res) => {
  const userId = req.user._id.toString();
  const modifiedReq = { ...req, params: { ...req.params, userId } };
  return getUserPermissions(modifiedReq, res);
});

export default router;

