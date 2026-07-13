import express from "express";
import {
  getProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder,
  updateProductionOrderStatus,
  deleteProductionOrder,
  recheckAvailability,
  createProcurementFromMissingComponents,
  getAllMissingComponents,
  createProcurementFromMultipleMissingComponents,
} from "../controllers/ProductionOrder.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get all missing components (must be before /:id)
router.get("/missing-components", getAllMissingComponents);

// Create procurement from multiple missing components (must be before /:id)
router.post("/missing-components/create-procurement", createProcurementFromMultipleMissingComponents);

// Get all production orders
router.get("/", getProductionOrders);

// Recheck availability (must be before /:id)
router.post("/:id/recheck-availability", recheckAvailability);

// Create procurement from missing components (must be before /:id)
router.post("/:id/create-procurement", createProcurementFromMissingComponents);

// Get production order by ID
router.get("/:id", getProductionOrderById);

// Create production order
router.post("/", createProductionOrder);

// Update production order
router.put("/:id", updateProductionOrder);

// Update production order status
router.put("/:id/status", updateProductionOrderStatus);

// Delete production order
router.delete("/:id", deleteProductionOrder);

export default router;

