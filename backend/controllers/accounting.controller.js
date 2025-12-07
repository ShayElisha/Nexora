import Account from "../models/Account.model.js";
import JournalEntry from "../models/JournalEntry.model.js";
import Ledger from "../models/Ledger.model.js";
import BankAccount from "../models/BankAccount.model.js";
import BankTransaction from "../models/BankTransaction.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Helper function to verify token
const verifyToken = (req) => {
  const token = req.cookies?.auth_token;
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
};

// ========== ACCOUNT MANAGEMENT ==========

// Create Account
export const createAccount = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const {
      accountNumber,
      accountName,
      accountType,
      parentAccount,
      currency,
      description,
      bankAccountId,
      taxCategory,
      notes,
    } = req.body;

    if (!accountNumber || !accountName || !accountType) {
      return res.status(400).json({
        success: false,
        message: "Account number, name, and type are required",
      });
    }

    const account = new Account({
      companyId: decoded.companyId,
      accountNumber,
      accountName,
      accountType,
      parentAccount: parentAccount || null,
      currency: currency || "ILS",
      description,
      bankAccountId: bankAccountId || null,
      taxCategory: taxCategory || "Taxable",
      notes,
    });

    await account.save();

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating account",
    });
  }
};

// Get All Accounts
export const getAllAccounts = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { accountType, isActive } = req.query;

    const filter = { companyId: decoded.companyId };
    if (accountType) filter.accountType = accountType;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const accounts = await Account.find(filter)
      .populate("parentAccount", "accountNumber accountName")
      .populate("bankAccountId", "accountName accountNumber")
      .sort({ accountNumber: 1 });

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching accounts",
    });
  }
};

// Get Account by ID
export const getAccountById = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const account = await Account.findOne({
      _id: id,
      companyId: decoded.companyId,
    })
      .populate("parentAccount")
      .populate("bankAccountId");

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching account",
    });
  }
};

// Update Account
export const updateAccount = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const updateData = req.body;

    const account = await Account.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating account",
    });
  }
};

// Delete Account
export const deleteAccount = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const account = await Account.findOneAndDelete({
      _id: id,
      companyId: decoded.companyId,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting account",
    });
  }
};

// ========== JOURNAL ENTRY MANAGEMENT ==========

// Generate Entry Number
const generateEntryNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `JE-${year}-`;
  
  const lastEntry = await JournalEntry.findOne({
    companyId,
    entryNumber: new RegExp(`^${prefix}`),
  })
    .sort({ entryNumber: -1 })
    .limit(1);

  let sequence = 1;
  if (lastEntry) {
    const lastSeq = parseInt(lastEntry.entryNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

// Create Journal Entry
export const createJournalEntry = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const {
      entryDate,
      description,
      reference,
      entries,
      currency,
      sourceDocument,
      notes,
    } = req.body;

    if (!entryDate || !description || !entries || entries.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Entry date, description, and at least 2 entries are required",
      });
    }

    // Validate entries
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Total debit must equal total credit",
      });
    }

    // Get account details for entries
    const entryPromises = entries.map(async (entry) => {
      const account = await Account.findById(entry.accountId);
      if (!account) {
        throw new Error(`Account ${entry.accountId} not found`);
      }
      return {
        ...entry,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
      };
    });

    const processedEntries = await Promise.all(entryPromises);

    const entryNumber = await generateEntryNumber(decoded.companyId);

    const journalEntry = new JournalEntry({
      companyId: decoded.companyId,
      entryNumber,
      entryDate,
      description,
      reference,
      entries: processedEntries,
      totalDebit,
      totalCredit,
      currency: currency || "ILS",
      sourceDocument: sourceDocument || null,
      createdBy: decoded.employeeId || decoded.userId,
      notes,
    });

    await journalEntry.save();

    res.status(201).json({
      success: true,
      message: "Journal entry created successfully",
      data: journalEntry,
    });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating journal entry",
    });
  }
};

// Post Journal Entry (create ledger entries)
export const postJournalEntry = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const journalEntry = await JournalEntry.findOne({
      _id: id,
      companyId: decoded.companyId,
    });

    if (!journalEntry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    if (journalEntry.status === "Posted") {
      return res.status(400).json({
        success: false,
        message: "Journal entry already posted",
      });
    }

    // Validate balance
    const totalDebit = journalEntry.entries.reduce(
      (sum, e) => sum + (e.debit || 0),
      0
    );
    const totalCredit = journalEntry.entries.reduce(
      (sum, e) => sum + (e.credit || 0),
      0
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Total debit must equal total credit",
      });
    }

    // Create ledger entries
    const ledgerEntries = [];
    for (const entry of journalEntry.entries) {
      // Get current balance for account
      const lastLedgerEntry = await Ledger.findOne({
        companyId: decoded.companyId,
        accountId: entry.accountId,
      })
        .sort({ entryDate: -1, createdAt: -1 })
        .limit(1);

      const previousBalance = lastLedgerEntry?.balance || 0;
      const newBalance =
        entry.accountType === "Asset" || entry.accountType === "Expense"
          ? previousBalance + entry.debit - entry.credit
          : previousBalance + entry.credit - entry.debit;

      const ledgerEntry = new Ledger({
        companyId: decoded.companyId,
        accountId: entry.accountId,
        accountNumber: entry.accountNumber,
        accountName: entry.accountName,
        journalEntryId: journalEntry._id,
        entryDate: journalEntry.entryDate,
        debit: entry.debit,
        credit: entry.credit,
        balance: newBalance,
        description: entry.description || journalEntry.description,
        reference: journalEntry.reference,
        sourceDocument: journalEntry.sourceDocument,
      });

      await ledgerEntry.save();
      ledgerEntries.push(ledgerEntry);

      // Update account balance
      await Account.findByIdAndUpdate(entry.accountId, {
        $inc: {
          balance:
            entry.accountType === "Asset" || entry.accountType === "Expense"
              ? entry.debit - entry.credit
              : entry.credit - entry.debit,
        },
      });
    }

    // Update journal entry status
    journalEntry.status = "Posted";
    journalEntry.postedBy = decoded.employeeId || decoded.userId;
    journalEntry.postedAt = new Date();
    journalEntry.totalDebit = totalDebit;
    journalEntry.totalCredit = totalCredit;
    await journalEntry.save();

    res.status(200).json({
      success: true,
      message: "Journal entry posted successfully",
      data: {
        journalEntry,
        ledgerEntries,
      },
    });
  } catch (error) {
    console.error("Error posting journal entry:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error posting journal entry",
    });
  }
};

// Get All Journal Entries
export const getAllJournalEntries = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { startDate, endDate, status } = req.query;

    const filter = { companyId: decoded.companyId };
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate) filter.entryDate.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const journalEntries = await JournalEntry.find(filter)
      .populate("createdBy", "name lastName")
      .populate("postedBy", "name lastName")
      .populate("entries.accountId", "accountNumber accountName accountType")
      .sort({ entryDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: journalEntries,
    });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching journal entries",
    });
  }
};

// Get Journal Entry by ID
export const getJournalEntryById = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const journalEntry = await JournalEntry.findOne({
      _id: id,
      companyId: decoded.companyId,
    })
      .populate("createdBy", "name lastName")
      .populate("postedBy", "name lastName")
      .populate("entries.accountId", "accountNumber accountName accountType");

    if (!journalEntry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: journalEntry,
    });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching journal entry",
    });
  }
};

// ========== LEDGER MANAGEMENT ==========

// Get Ledger Entries
export const getLedgerEntries = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { accountId, startDate, endDate } = req.query;

    const filter = { companyId: decoded.companyId };
    if (accountId) filter.accountId = accountId;
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate) filter.entryDate.$lte = new Date(endDate);
    }

    const ledgerEntries = await Ledger.find(filter)
      .populate("accountId", "accountNumber accountName accountType")
      .populate("journalEntryId", "entryNumber description")
      .sort({ entryDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: ledgerEntries,
    });
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching ledger entries",
    });
  }
};

// Get Account Balance
export const getAccountBalance = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { accountId, asOfDate } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    const filter = {
      companyId: decoded.companyId,
      accountId,
    };

    if (asOfDate) {
      filter.entryDate = { $lte: new Date(asOfDate) };
    }

    const lastEntry = await Ledger.findOne(filter)
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(1);

    const account = await Account.findById(accountId);

    res.status(200).json({
      success: true,
      data: {
        accountId,
        accountNumber: account?.accountNumber,
        accountName: account?.accountName,
        balance: lastEntry?.balance || account?.balance || 0,
        asOfDate: asOfDate || new Date(),
      },
    });
  } catch (error) {
    console.error("Error fetching account balance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching account balance",
    });
  }
};

// ========== FINANCIAL REPORTS ==========

// Trial Balance
export const getTrialBalance = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { asOfDate } = req.query;

    const filter = {
      companyId: decoded.companyId,
    };

    if (asOfDate) {
      filter.entryDate = { $lte: new Date(asOfDate) };
    }

    // Get all accounts
    const accounts = await Account.find({
      companyId: decoded.companyId,
      isActive: true,
    });

    const trialBalance = [];

    for (const account of accounts) {
      const lastLedgerEntry = await Ledger.findOne({
        ...filter,
        accountId: account._id,
      })
        .sort({ entryDate: -1, createdAt: -1 })
        .limit(1);

      const balance = lastLedgerEntry?.balance || account.balance || 0;

      if (balance !== 0) {
        const isDebit =
          account.accountType === "Asset" ||
          account.accountType === "Expense" ||
          account.accountType === "Cost of Goods Sold";

        trialBalance.push({
          accountId: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          accountType: account.accountType,
          debit: isDebit ? Math.abs(balance) : 0,
          credit: !isDebit ? Math.abs(balance) : 0,
        });
      }
    }

    const totalDebit = trialBalance.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = trialBalance.reduce((sum, t) => sum + t.credit, 0);

    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOfDate || new Date(),
        accounts: trialBalance,
        totals: {
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit,
        },
      },
    });
  } catch (error) {
    console.error("Error generating trial balance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error generating trial balance",
    });
  }
};

// Profit & Loss Statement
export const getProfitAndLoss = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const filter = {
      companyId: decoded.companyId,
      entryDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Revenue accounts
    const revenueAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: "Revenue",
      isActive: true,
    });

    // Expense accounts
    const expenseAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: "Expense",
      isActive: true,
    });

    // COGS accounts
    const cogsAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: "Cost of Goods Sold",
      isActive: true,
    });

    const calculateTotal = async (accounts) => {
      let total = 0;
      for (const account of accounts) {
        const entries = await Ledger.find({
          ...filter,
          accountId: account._id,
        });
        const accountTotal = entries.reduce(
          (sum, e) => sum + e.credit - e.debit,
          0
        );
        total += accountTotal;
      }
      return total;
    };

    const revenue = await calculateTotal(revenueAccounts);
    const expenses = await calculateTotal(expenseAccounts);
    const cogs = await calculateTotal(cogsAccounts);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        revenue: {
          total: revenue,
          accounts: revenueAccounts.map((a) => ({
            accountId: a._id,
            accountNumber: a.accountNumber,
            accountName: a.accountName,
          })),
        },
        costOfGoodsSold: {
          total: cogs,
          accounts: cogsAccounts.map((a) => ({
            accountId: a._id,
            accountNumber: a.accountNumber,
            accountName: a.accountName,
          })),
        },
        grossProfit,
        expenses: {
          total: expenses,
          accounts: expenseAccounts.map((a) => ({
            accountId: a._id,
            accountNumber: a.accountNumber,
            accountName: a.accountName,
          })),
        },
        netProfit,
      },
    });
  } catch (error) {
    console.error("Error generating profit and loss:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error generating profit and loss",
    });
  }
};

// Balance Sheet
export const getBalanceSheet = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { asOfDate } = req.query;

    const filter = {
      companyId: decoded.companyId,
    };

    if (asOfDate) {
      filter.entryDate = { $lte: new Date(asOfDate) };
    }

    const getAccountBalance = async (accountId) => {
      const lastEntry = await Ledger.findOne({
        ...filter,
        accountId,
      })
        .sort({ entryDate: -1, createdAt: -1 })
        .limit(1);
      return lastEntry?.balance || 0;
    };

    // Assets
    const assetAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: "Asset",
      isActive: true,
    });

    const assets = [];
    let totalAssets = 0;
    for (const account of assetAccounts) {
      const balance = await getAccountBalance(account._id);
      if (balance !== 0) {
        assets.push({
          accountId: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          balance: Math.abs(balance),
        });
        totalAssets += Math.abs(balance);
      }
    }

    // Liabilities
    const liabilityAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: "Liability",
      isActive: true,
    });

    const liabilities = [];
    let totalLiabilities = 0;
    for (const account of liabilityAccounts) {
      const balance = await getAccountBalance(account._id);
      if (balance !== 0) {
        liabilities.push({
          accountId: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          balance: Math.abs(balance),
        });
        totalLiabilities += Math.abs(balance);
      }
    }

    // Equity
    const equityAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: "Equity",
      isActive: true,
    });

    const equity = [];
    let totalEquity = 0;
    for (const account of equityAccounts) {
      const balance = await getAccountBalance(account._id);
      if (balance !== 0) {
        equity.push({
          accountId: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          balance: Math.abs(balance),
        });
        totalEquity += Math.abs(balance);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOfDate || new Date(),
        assets: {
          accounts: assets,
          total: totalAssets,
        },
        liabilities: {
          accounts: liabilities,
          total: totalLiabilities,
        },
        equity: {
          accounts: equity,
          total: totalEquity,
        },
        total: totalAssets,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      },
    });
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error generating balance sheet",
    });
  }
};

// Cash Flow Statement
export const getCashFlowStatement = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const filter = {
      companyId: decoded.companyId,
      entryDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Operating Activities (Revenue - Expenses)
    const operatingAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: { $in: ["Revenue", "Expense"] },
      isActive: true,
    });

    let operatingCashFlow = 0;
    for (const account of operatingAccounts) {
      const entries = await Ledger.find({
        ...filter,
        accountId: account._id,
      });
      const accountFlow =
        account.accountType === "Revenue"
          ? entries.reduce((sum, e) => sum + e.credit - e.debit, 0)
          : entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
      operatingCashFlow +=
        account.accountType === "Revenue" ? accountFlow : -accountFlow;
    }

    // Investing Activities (Asset purchases/sales)
    const investingAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: "Asset",
      isActive: true,
    });

    let investingCashFlow = 0;
    for (const account of investingAccounts) {
      const entries = await Ledger.find({
        ...filter,
        accountId: account._id,
      });
      const accountFlow = entries.reduce(
        (sum, e) => sum + e.debit - e.credit,
        0
      );
      investingCashFlow -= accountFlow; // Asset purchases are negative
    }

    // Financing Activities (Liabilities and Equity)
    const financingAccounts = await Account.find({
      companyId: decoded.companyId,
      accountType: { $in: ["Liability", "Equity"] },
      isActive: true,
    });

    let financingCashFlow = 0;
    for (const account of financingAccounts) {
      const entries = await Ledger.find({
        ...filter,
        accountId: account._id,
      });
      const accountFlow = entries.reduce(
        (sum, e) => sum + e.credit - e.debit,
        0
      );
      financingCashFlow += accountFlow;
    }

    const netCashFlow =
      operatingCashFlow + investingCashFlow + financingCashFlow;

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        operatingActivities: {
          cashFlow: operatingCashFlow,
        },
        investingActivities: {
          cashFlow: investingCashFlow,
        },
        financingActivities: {
          cashFlow: financingCashFlow,
        },
        netCashFlow,
      },
    });
  } catch (error) {
    console.error("Error generating cash flow statement:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error generating cash flow statement",
    });
  }
};

