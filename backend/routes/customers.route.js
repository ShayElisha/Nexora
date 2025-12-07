import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersForSuperAdmin,
} from "../controllers/customers.controller.js";
import {
  getCustomer360,
  getCustomerSegments,
  createCustomerSegment,
  updateCustomerSegment,
  deleteCustomerSegment,
  getSegmentationAnalytics,
  getCustomerSatisfaction,
  createCustomerSatisfaction,
  getSatisfactionAnalytics,
  getCustomerRetention,
  calculateRetentionRisk,
  getRetentionAnalytics,
  addRetentionAction,
} from "../controllers/advancedCRM.controller.js";

const router = express.Router();

// יצירת לקוח חדש
router.post("/", createCustomer);

// שליפת כל הלקוחות
router.get("/", getAllCustomers);

// SuperAdmin endpoint - get customers by companyId
router.get("/superadmin/list", getCustomersForSuperAdmin);

// ==================== ADVANCED CRM ROUTES ====================

// Customer 360 View
router.get("/360/:customerId", getCustomer360);

// Customer Segmentation
router.get("/segments/all", getCustomerSegments);
router.post("/segments", createCustomerSegment);
router.put("/segments/:id", updateCustomerSegment);
router.delete("/segments/:id", deleteCustomerSegment);
router.get("/segments/analytics", getSegmentationAnalytics);

// Customer Satisfaction
router.get("/satisfaction/all", getCustomerSatisfaction);
router.post("/satisfaction", createCustomerSatisfaction);
router.get("/satisfaction/analytics", getSatisfactionAnalytics);

// Customer Retention
router.get("/retention/all", getCustomerRetention);
router.post("/retention/calculate", calculateRetentionRisk);
router.get("/retention/analytics", getRetentionAnalytics);
router.post("/retention/action", addRetentionAction);

// שליפת לקוח לפי מזהה (must be after all specific routes)
router.get("/:id", getCustomerById);

// עדכון לקוח לפי מזהה
router.put("/:id", updateCustomer);

// מחיקת לקוח לפי מזהה
router.delete("/:id", deleteCustomer);

export default router;
