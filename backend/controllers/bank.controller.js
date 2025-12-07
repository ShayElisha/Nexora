import BankAccount from "../models/BankAccount.model.js";
import BankTransaction from "../models/BankTransaction.model.js";
import JournalEntry from "../models/JournalEntry.model.js";
import Account from "../models/Account.model.js";
import jwt from "jsonwebtoken";
import csv from "csv-parser";
import { Readable } from "stream";

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

// ========== BANK ACCOUNT MANAGEMENT ==========

// Create Bank Account
export const createBankAccount = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const {
      accountName,
      bankName,
      accountNumber,
      branchNumber,
      accountType,
      currency,
      openingBalance,
      accountId,
      bankContact,
      importSettings,
      notes,
    } = req.body;

    if (!accountName || !bankName || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Account name, bank name, and account number are required",
      });
    }

    const bankAccount = new BankAccount({
      companyId: decoded.companyId,
      accountName,
      bankName,
      accountNumber,
      branchNumber,
      accountType: accountType || "Checking",
      currency: currency || "ILS",
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      reconciledBalance: openingBalance || 0,
      accountId: accountId || null,
      bankContact: bankContact || null,
      importSettings: importSettings || null,
      notes,
    });

    await bankAccount.save();

    res.status(201).json({
      success: true,
      message: "Bank account created successfully",
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error creating bank account:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating bank account",
    });
  }
};

// Get All Bank Accounts
export const getAllBankAccounts = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { isActive } = req.query;

    const filter = { companyId: decoded.companyId };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const bankAccounts = await BankAccount.find(filter)
      .populate("accountId", "accountNumber accountName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bankAccounts,
    });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching bank accounts",
    });
  }
};

// Get Bank Account by ID
export const getBankAccountById = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const bankAccount = await BankAccount.findOne({
      _id: id,
      companyId: decoded.companyId,
    }).populate("accountId", "accountNumber accountName");

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error fetching bank account:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching bank account",
    });
  }
};

// Update Bank Account
export const updateBankAccount = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const updateData = req.body;

    const bankAccount = await BankAccount.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bank account updated successfully",
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating bank account",
    });
  }
};

// ========== BANK TRANSACTION MANAGEMENT ==========

// Create Bank Transaction
export const createBankTransaction = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const {
      bankAccountId,
      transactionDate,
      valueDate,
      amount,
      currency,
      description,
      reference,
      transactionType,
      category,
      tags,
      notes,
    } = req.body;

    if (!bankAccountId || !transactionDate || !amount || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Bank account, transaction date, amount, and description are required",
      });
    }

    const transaction = new BankTransaction({
      companyId: decoded.companyId,
      bankAccountId,
      transactionDate,
      valueDate: valueDate || transactionDate,
      amount,
      currency: currency || "ILS",
      description,
      reference,
      transactionType: transactionType || (amount >= 0 ? "Credit" : "Debit"),
      category,
      tags: tags || [],
      notes,
      source: "Manual",
    });

    await transaction.save();

    // Update bank account balance
    const bankAccount = await BankAccount.findById(bankAccountId);
    if (bankAccount) {
      bankAccount.currentBalance += amount;
      await bankAccount.save();
    }

    res.status(201).json({
      success: true,
      message: "Bank transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error creating bank transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating bank transaction",
    });
  }
};

// Get Bank Transactions
export const getBankTransactions = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const {
      bankAccountId,
      startDate,
      endDate,
      reconciliationStatus,
      category,
    } = req.query;

    const filter = { companyId: decoded.companyId };
    if (bankAccountId) filter.bankAccountId = bankAccountId;
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }
    if (reconciliationStatus) filter.reconciliationStatus = reconciliationStatus;
    if (category) filter.category = category;

    const transactions = await BankTransaction.find(filter)
      .populate("bankAccountId", "accountName accountNumber")
      .populate("journalEntryId", "entryNumber")
      .populate("financeRecordId")
      .sort({ transactionDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching bank transactions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching bank transactions",
    });
  }
};

// Import Bank Transactions (CSV/Excel)
export const importBankTransactions = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { bankAccountId, format, dateFormat, delimiter } = req.body;

    if (!bankAccountId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Bank account ID and file are required",
      });
    }

    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }

    const transactions = [];
    const fileBuffer = req.file.buffer;
    const fileStream = Readable.from(fileBuffer.toString());

    return new Promise((resolve, reject) => {
      fileStream
        .pipe(csv({ separator: delimiter || "," }))
        .on("data", (row) => {
          // Parse CSV row (adjust based on your CSV format)
          const transaction = {
            companyId: decoded.companyId,
            bankAccountId,
            transactionDate: new Date(row.date || row.transactionDate),
            valueDate: row.valueDate ? new Date(row.valueDate) : undefined,
            amount: parseFloat(row.amount || row.credit || -row.debit || 0),
            currency: row.currency || bankAccount.currency,
            description: row.description || row.narrative || "",
            reference: row.reference || row.ref || "",
            transactionType:
              parseFloat(row.amount || row.credit || -row.debit || 0) >= 0
                ? "Credit"
                : "Debit",
            category: row.category || "",
            source: "Import",
            importedData: {
              originalDescription: row.description || row.narrative || "",
              originalReference: row.reference || row.ref || "",
              importDate: new Date(),
            },
          };
          transactions.push(transaction);
        })
        .on("end", async () => {
          try {
            // Insert transactions
            const inserted = await BankTransaction.insertMany(transactions);

            // Update bank account balance
            const totalAmount = transactions.reduce(
              (sum, t) => sum + t.amount,
              0
            );
            bankAccount.currentBalance += totalAmount;
            await bankAccount.save();

            res.status(200).json({
              success: true,
              message: `${inserted.length} transactions imported successfully`,
              data: {
                imported: inserted.length,
                transactions: inserted,
              },
            });
            resolve();
          } catch (error) {
            console.error("Error importing transactions:", error);
            res.status(500).json({
              success: false,
              message: error.message || "Error importing transactions",
            });
            reject(error);
          }
        })
        .on("error", (error) => {
          console.error("Error parsing CSV:", error);
          res.status(500).json({
            success: false,
            message: "Error parsing CSV file",
          });
          reject(error);
        });
    });
  } catch (error) {
    console.error("Error importing bank transactions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error importing bank transactions",
    });
  }
};

// Reconcile Bank Transactions
export const reconcileBankTransactions = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { bankAccountId, transactionIds, reconciledBalance, asOfDate } =
      req.body;

    if (!bankAccountId || !transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({
        success: false,
        message: "Bank account ID and transaction IDs array are required",
      });
    }

    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }

    // Update transactions
    const updated = await BankTransaction.updateMany(
      {
        _id: { $in: transactionIds },
        companyId: decoded.companyId,
        bankAccountId,
      },
      {
        reconciliationStatus: "Reconciled",
        reconciledAt: new Date(),
        reconciledBy: decoded.employeeId || decoded.userId,
      }
    );

    // Update bank account reconciled balance
    if (reconciledBalance !== undefined) {
      bankAccount.reconciledBalance = reconciledBalance;
      bankAccount.lastReconciledDate = asOfDate || new Date();
      await bankAccount.save();
    }

    res.status(200).json({
      success: true,
      message: `${updated.modifiedCount} transactions reconciled successfully`,
      data: {
        reconciled: updated.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error reconciling transactions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error reconciling transactions",
    });
  }
};

// Transfer Between Bank Accounts
export const transferBetweenAccounts = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const {
      fromBankAccountId,
      toBankAccountId,
      amount,
      transferDate,
      description,
      reference,
    } = req.body;

    if (!fromBankAccountId || !toBankAccountId || !amount || !transferDate) {
      return res.status(400).json({
        success: false,
        message:
          "From account, to account, amount, and transfer date are required",
      });
    }

    if (fromBankAccountId === toBankAccountId) {
      return res.status(400).json({
        success: false,
        message: "From and to accounts must be different",
      });
    }

    const fromAccount = await BankAccount.findById(fromBankAccountId);
    const toAccount = await BankAccount.findById(toBankAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({
        success: false,
        message: "One or both bank accounts not found",
      });
    }

    if (fromAccount.currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in source account",
      });
    }

    // Create debit transaction
    const debitTransaction = new BankTransaction({
      companyId: decoded.companyId,
      bankAccountId: fromBankAccountId,
      transactionDate: transferDate,
      amount: -amount,
      currency: fromAccount.currency,
      description: description || `Transfer to ${toAccount.accountName}`,
      reference,
      transactionType: "Debit",
      category: "Transfer",
      notes: `Transfer to ${toAccount.accountName}`,
    });

    // Create credit transaction
    const creditTransaction = new BankTransaction({
      companyId: decoded.companyId,
      bankAccountId: toBankAccountId,
      transactionDate: transferDate,
      amount: amount,
      currency: toAccount.currency,
      description: description || `Transfer from ${fromAccount.accountName}`,
      reference,
      transactionType: "Credit",
      category: "Transfer",
      notes: `Transfer from ${fromAccount.accountName}`,
    });

    await debitTransaction.save();
    await creditTransaction.save();

    // Update balances
    fromAccount.currentBalance -= amount;
    toAccount.currentBalance += amount;
    await fromAccount.save();
    await toAccount.save();

    res.status(201).json({
      success: true,
      message: "Transfer completed successfully",
      data: {
        debitTransaction,
        creditTransaction,
      },
    });
  } catch (error) {
    console.error("Error transferring between accounts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error transferring between accounts",
    });
  }
};

