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
  getLatestPayment,
} from "../controllers/payment.controller.js";

import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/plans", getAllPlans);
router.post("/create-subscription", createPaymentSession);
router.post("/save-payment", savePayment); // middleware to get the company id from the authenticated user
router.get("/get-invoices", getCompanyInvoices);
router.put("/update-subscription", protectRoute, updateCompanyPlan);
router.post("/cancel-subscription", cancelCompanySubscription);
router.post("/resume-subscription", resumeCompanySubscription);
router.post("/pause-subscription", pauseCompanySubscription);
router.get("/get-latest-payment/:companyId", getLatestPayment);
export default router;
