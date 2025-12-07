import express from "express";
import {
  cancelCompanySubscription,
  getAllPlans,
  getCompanyInvoices,
  createPaymentSession,
  savePayment,
  pauseCompanySubscription,
  resumeCompanySubscription,
  updateCompanyPlan,
  updateCompanyPlanFromAdmin,
  getLatestPayment,
  syncSubscriptionsWithStripe,
  getAllPaymentsForSuperAdmin,
  retryPayment,
} from "../controllers/payment.controller.js";

import { protectRoute, protectCompanyOrUserRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Note: Webhook route is handled directly in server.js before express.json() middleware
// This is required for Stripe signature verification

router.get("/plans", getAllPlans);
router.post("/create-subscription", protectCompanyOrUserRoute, createPaymentSession);
router.post("/save-payment", protectCompanyOrUserRoute, savePayment);
router.post("/retry-payment", protectCompanyOrUserRoute, retryPayment);
router.get("/get-invoices", protectRoute, getCompanyInvoices);
router.put("/update-subscription", protectRoute, updateCompanyPlan);
router.put("/update-subscription-admin", updateCompanyPlanFromAdmin); // Admin route without protection
router.post("/cancel-subscription", protectRoute, cancelCompanySubscription);
router.post("/resume-subscription", protectRoute, resumeCompanySubscription);
router.post("/pause-subscription", protectRoute, pauseCompanySubscription);
router.get("/get-latest-payment/current", protectCompanyOrUserRoute, getLatestPayment); // For company_jwt token
router.get("/get-latest-payment/:companyId", protectCompanyOrUserRoute, getLatestPayment);
router.post("/sync-subscriptions", syncSubscriptionsWithStripe); // Manual sync endpoint (optional, for testing)

// SuperAdmin endpoint - get all payments from all companies
router.get("/superadmin/all", getAllPaymentsForSuperAdmin);

export default router;
