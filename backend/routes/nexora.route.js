import express from "express";
import {
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  getCompanyById,
  deleteCompany,
  getAllCompanies,
  searchCompanies,
  getCompaniesWithPagination,
  getCompaniesWithOverdueInvoices,
  forceUpdateCompanyStatus,
  getCompanyStatistics,
} from "../controllers/Nexora.controller.js";

const router = express.Router();

router.get("/pending", getPendingCompanies);
router.put("/approve", approveCompany);
router.put("/reject", rejectCompany);
router.get("/search", searchCompanies);
router.get("/paginated", getCompaniesWithPagination);
router.get("/overdue", getCompaniesWithOverdueInvoices);
router.put("/:id/status", forceUpdateCompanyStatus);
router.get("/statistics", getCompanyStatistics);
router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.delete("/:id", deleteCompany);

export default router;
