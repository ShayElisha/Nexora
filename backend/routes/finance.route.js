import express from "express";
import {
  createFinanceRecord,
  getAllFinanceRecords,
  updateFinanceRecord,
  deleteFinanceRecord,
} from "../controllers/finance.controller.js";
//import { restrictToCompany } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-finance", /*restrictToCompany*/ createFinanceRecord);
router.get("/", getAllFinanceRecords);
router.put("/:id", /*restrictToCompany*/ updateFinanceRecord);
router.delete("/:id", /*restrictToCompany*/ deleteFinanceRecord);

export default router;
