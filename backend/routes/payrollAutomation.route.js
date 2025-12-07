import express from "express";
import * as payrollAutomationController from "../controllers/payrollAutomation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get automation settings
router.get("/settings", protectRoute, payrollAutomationController.getAutomationSettings);

// Update automation settings
router.post("/settings", protectRoute, payrollAutomationController.updateAutomationSettings);

// Calculate salaries for a month
router.post("/calculate", protectRoute, payrollAutomationController.calculateSalariesForMonth);

// Get pending approvals
router.get("/pending-approvals", protectRoute, payrollAutomationController.getPendingApprovals);

// Get pending payments
router.get("/pending-payments", protectRoute, payrollAutomationController.getPendingPayments);

// Approve salary
router.post("/approve/:id", protectRoute, payrollAutomationController.approveSalary);

// Reject salary
router.post("/reject/:id", protectRoute, payrollAutomationController.rejectSalary);

// Mark as paid
router.post("/mark-as-paid", protectRoute, payrollAutomationController.markAsPaid);

// Get statistics
router.get("/stats", protectRoute, payrollAutomationController.getPayrollStats);

// Recalculate salaries
router.post("/recalculate", protectRoute, payrollAutomationController.recalculateSalaries);

export default router;

