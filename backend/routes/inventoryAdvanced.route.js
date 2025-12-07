import express from "express";
import {
  createStockCount,
  getAllStockCounts,
  createInventoryMovement,
  getAllInventoryMovements,
  createInventoryQuality,
  getAllInventoryQuality,
} from "../controllers/inventoryAdvanced.controller.js";

const router = express.Router();

// Stock Count Routes
router.post("/stock-counts", createStockCount);
router.get("/stock-counts", getAllStockCounts);

// Inventory Movement Routes
router.post("/movements", createInventoryMovement);
router.get("/movements", getAllInventoryMovements);

// Inventory Quality Routes
router.post("/quality", createInventoryQuality);
router.get("/quality", getAllInventoryQuality);

export default router;

