import express from "express";
import {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  addMaintenance,
  getMaintenanceHistory,
  calculateDepreciation,
  calculateAllDepreciations,
  calculatePerformance,
  getPerformanceReport,
  calculateTCO,
  addInsurancePolicy,
  updateInsurancePolicy,
  transferAsset,
  assignAsset,
  unassignAsset,
  updateLifecycleStage,
  getUpcomingMaintenance,
  getExpiringInsurance,
  getAssetsByDepartment,
} from "../controllers/asset.controller.js";
import { protectRoute, extractCompanyId } from "../middleware/auth.middleware.js";

const router = express.Router();

// CRUD Routes - protectRoute already extracts user and companyId
router.post("/", protectRoute, extractCompanyId, createAsset);
router.get("/", protectRoute, extractCompanyId, getAllAssets);
router.get("/:id", protectRoute, extractCompanyId, getAssetById);
router.put("/:id", protectRoute, extractCompanyId, updateAsset);
router.delete("/:id", protectRoute, extractCompanyId, deleteAsset);

// Maintenance Routes
router.post("/:id/maintenance", protectRoute, addMaintenance);
router.get("/:id/maintenance", protectRoute, getMaintenanceHistory);

// Depreciation Routes
router.post("/:id/depreciation", protectRoute, calculateDepreciation);
router.post("/depreciation/calculate-all", protectRoute, calculateAllDepreciations);

// Performance Routes
router.post("/:id/performance", protectRoute, calculatePerformance);
router.get("/performance/report", protectRoute, getPerformanceReport);

// Cost Management Routes
router.post("/:id/tco", protectRoute, calculateTCO);

// Insurance Routes
router.post("/:id/insurance", protectRoute, addInsurancePolicy);
router.put("/:id/insurance/:policyId", protectRoute, updateInsurancePolicy);

// Transfer Routes
router.post("/:id/transfer", protectRoute, transferAsset);

// Assignment Routes
router.post("/:id/assign", protectRoute, assignAsset);
router.post("/:id/unassign", protectRoute, unassignAsset);

// Lifecycle Routes
router.put("/:id/lifecycle", protectRoute, updateLifecycleStage);

// Reports Routes
router.get("/reports/upcoming-maintenance", protectRoute, getUpcomingMaintenance);
router.get("/reports/expiring-insurance", protectRoute, getExpiringInsurance);
router.get("/reports/by-department", protectRoute, getAssetsByDepartment);

export default router;

