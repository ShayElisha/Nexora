import express from "express";
import {
  createCompany,
  updateCompany,
  getAllCompanies,
  sendSignUpLink,
  getCompanyById,
  getCurrentCompany
} from "../controllers/companies.controller.js";
import {
  bulkUpdateCompanyStatus,
  bulkUpdateCompanyPlan,
} from "../controllers/Nexora.controller.js";
import { validateCompany } from "../middleware/validateFields.js";
import {
  protectAdminsRoute,
  protectRoute,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", validateCompany, createCompany);
router.put("/update", protectRoute, validateCompany, updateCompany);
// TODO: Add delete route and controller
router.put("/delete", protectRoute, validateCompany, updateCompany);
router.get("/get-companies", protectAdminsRoute, getAllCompanies);
router.get("/get-company", getCompanyById);
router.get("/current", protectRoute, getCurrentCompany);
router.post("/sendSignUp", sendSignUpLink);

// Bulk Actions
router.post("/bulk-status", protectAdminsRoute, bulkUpdateCompanyStatus);
router.post("/bulk-plan", protectAdminsRoute, bulkUpdateCompanyPlan);

export default router;
