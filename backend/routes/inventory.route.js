import express from "express";
import {
  createInventoryItem,
  getAllInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
  getProductsBySupplier,
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.post("/", createInventoryItem);
router.get("/",  getAllInventoryItems);
router.put("/:id", /*restrictToCompany,*/ updateInventoryItem);
router.delete("/:id", /*restrictToCompany,*/ deleteInventoryItem);
router.get("/products", getProductsBySupplier);

export default router;
