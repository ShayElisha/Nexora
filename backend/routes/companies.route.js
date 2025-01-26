import express from "express";
import {
  createCompany,
  updateCompany,
  getAllCompanies,
} from "../controllers/companies.controller.js";
import { validateCompany } from "../middleware/validateFields.js";
import {
  protectAdminsRoute,
  protectRoute,
} from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/create", validateCompany, createCompany);
router.put("/update", protectRoute, validateCompany, updateCompany);
// TODO: Add delete route and controller
router.put("/delete", protectRoute, validateCompany, updateCompany);
router.get("/get-companies", protectAdminsRoute, getAllCompanies);

export default router;
