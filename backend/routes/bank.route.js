import express from "express";
import multer from "multer";
import {
  // Bank Accounts
  createBankAccount,
  getAllBankAccounts,
  getBankAccountById,
  updateBankAccount,
  // Bank Transactions
  createBankTransaction,
  getBankTransactions,
  importBankTransactions,
  reconcileBankTransactions,
  transferBetweenAccounts,
} from "../controllers/bank.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Bank Account Routes
router.post("/accounts", createBankAccount);
router.get("/accounts", getAllBankAccounts);
router.get("/accounts/:id", getBankAccountById);
router.put("/accounts/:id", updateBankAccount);

// Bank Transaction Routes
router.post("/transactions", createBankTransaction);
router.get("/transactions", getBankTransactions);
router.post("/transactions/import", upload.single("file"), importBankTransactions);
router.post("/transactions/reconcile", reconcileBankTransactions);
router.post("/transfers", transferBetweenAccounts);

export default router;

