import mongoose from "mongoose";

const bankTransactionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    valueDate: {
      type: Date, // תאריך ערך
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      trim: true, // מספר הפניה מהבנק
    },
    transactionType: {
      type: String,
      enum: ["Debit", "Credit", "Transfer"],
      required: true,
    },
    // קישור לרישום פיננסי/יומן
    journalEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
    },
    financeRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Finance",
    },
    // סטטוס התאמה
    reconciliationStatus: {
      type: String,
      enum: ["Unreconciled", "Reconciled", "Cleared"],
      default: "Unreconciled",
      index: true,
    },
    reconciledAt: {
      type: Date,
    },
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    // קטגוריזציה
    category: {
      type: String,
      trim: true,
    },
    // תגיות
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // מקור הנתונים
    source: {
      type: String,
      enum: ["Manual", "Import", "API", "Bank Statement"],
      default: "Manual",
    },
    // נתונים מיובאים
    importedData: {
      originalDescription: { type: String },
      originalReference: { type: String },
      importDate: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bankTransactionSchema.index({ companyId: 1, bankAccountId: 1, transactionDate: -1 });
bankTransactionSchema.index({ companyId: 1, reconciliationStatus: 1 });
bankTransactionSchema.index({ journalEntryId: 1 });
bankTransactionSchema.index({ financeRecordId: 1 });

const BankTransaction =
  mongoose.models.BankTransaction ||
  mongoose.model("BankTransaction", bankTransactionSchema);

export default BankTransaction;

