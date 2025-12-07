import express from "express";
import {
  createInventoryItem,
  getAllInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
  getProductsBySupplier,
  getInventoryandItem,
  getInventoryByProductId,
  getInventoryHistory,
  getInventoryAlerts,
  getInventoryStatistics,
  getInventoryByWarehouse,
  getProductInventoryTotal,
  transferInventory,
  getInventoryItemById,
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.post("/", createInventoryItem);
router.get("/", getAllInventoryItems);
router.put("/:id", /*restrictToCompany,*/ updateInventoryItem);
router.delete("/:id", /*restrictToCompany,*/ deleteInventoryItem);
router.get("/products", getProductsBySupplier);
router.get("/productsInfo", getInventoryandItem);
router.get("/history", getInventoryHistory);
router.get("/alerts", getInventoryAlerts);
router.get("/statistics", getInventoryStatistics);
router.get("/warehouse/:warehouseId", getInventoryByWarehouse);
router.get("/product/:productId/total", getProductInventoryTotal);
router.get("/item/:id", getInventoryItemById);
router.post("/transfer", transferInventory);
router.get("/:productId", getInventoryByProductId);

export default router;
