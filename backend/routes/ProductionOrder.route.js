import express from "express";
import {
  getProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder,
  updateProductionOrderStatus,
  deleteProductionOrder,
} from "../controllers/ProductionOrder.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get all production orders
router.get("/", getProductionOrders);

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

