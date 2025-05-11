import express from "express";
const router = express.Router();
import {
  createTaxConfig,
  updateTaxConfig,
  deleteTaxConfig,
  getTaxConfig,
  getAllTaxConfigs,
} from "../controllers/TaxConfig.controller.js";

// Routes for TaxConfig management
router.post("/", createTaxConfig);
router.put("/:id", updateTaxConfig);
router.delete("/:id", deleteTaxConfig);
router.get("/:id", getTaxConfig);
router.get("/", getAllTaxConfigs);

export default router;
