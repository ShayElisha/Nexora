import express from "express";
import {
  cancelCompanySubscription,
  getAllPlans,
  getCompanyInvoices,
  handlePayment,
  pauseCompanySubscription,
  resumeCompanySubscription,
  updateCompanyPlan,
} from "../controllers/payment.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/plans", getAllPlans);
router.post("/create-subscription", handlePayment);
// middleware to get the company id from the authenticated user
router.use(protectRoute);
router.get("/get-invoices", getCompanyInvoices);
router.put("/update-subscription", updateCompanyPlan);
router.post("/cancel-subscription", cancelCompanySubscription);
router.post("/resume-subscription", resumeCompanySubscription);
router.post("/pause-subscription", pauseCompanySubscription);

export default router;
