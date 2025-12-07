import express from "express";
import {
  createFinanceRecord,
  getAllFinanceRecords,
  updateFinanceRecord,
  deleteFinanceRecord,
  getCashFlowAnalysis,
  getCashFlowByCategory,
  getCashFlowByBankAccount,
  getCumulativeCashFlow,
  getCashFlowForecast,
} from "../controllers/finance.controller.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); // או הגדרה אחרת של storage

// שימוש ב-upload.array לקבלת מספר קבצים (למשל עד 5 קבצים)
router.post(
  "/create-finance",
  upload.array("attachment", 5),
  createFinanceRecord
);
router.get("/", getAllFinanceRecords);
router.put("/:id", updateFinanceRecord);
router.delete("/:id", deleteFinanceRecord);

// Cash Flow Analysis Routes
router.get("/cash-flow/analysis", getCashFlowAnalysis);
router.get("/cash-flow/by-category", getCashFlowByCategory);
router.get("/cash-flow/by-bank-account", getCashFlowByBankAccount);
router.get("/cash-flow/cumulative", getCumulativeCashFlow);
router.get("/cash-flow/forecast", getCashFlowForecast);

export default router;
