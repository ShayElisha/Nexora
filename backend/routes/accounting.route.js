import express from "express";
import {
  // Accounts
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  // Journal Entries
  createJournalEntry,
  postJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  // Ledger
  getLedgerEntries,
  getAccountBalance,
  // Reports
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getCashFlowStatement,
} from "../controllers/accounting.controller.js";

const router = express.Router();

// Account Routes
router.post("/accounts", createAccount);
router.get("/accounts", getAllAccounts);
router.get("/accounts/:id", getAccountById);
router.put("/accounts/:id", updateAccount);
router.delete("/accounts/:id", deleteAccount);

// Journal Entry Routes
router.post("/journal-entries", createJournalEntry);
router.post("/journal-entries/:id/post", postJournalEntry);
router.get("/journal-entries", getAllJournalEntries);
router.get("/journal-entries/:id", getJournalEntryById);

// Ledger Routes
router.get("/ledger", getLedgerEntries);
router.get("/ledger/balance", getAccountBalance);

// Financial Reports Routes
router.get("/reports/trial-balance", getTrialBalance);
router.get("/reports/profit-loss", getProfitAndLoss);
router.get("/reports/balance-sheet", getBalanceSheet);
router.get("/reports/cash-flow", getCashFlowStatement);

export default router;

