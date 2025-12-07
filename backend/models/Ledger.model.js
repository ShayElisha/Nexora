import mongoose from "mongoose";

const ledgerEntrySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    journalEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: true,
      index: true,
    },
    entryDate: {
      type: Date,
      required: true,
      index: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0, // יתרה מצטברת
    },
    description: {
      type: String,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    // קישור למסמך מקור
    sourceDocument: {
      type: {
        type: String,
        enum: [
          "Invoice",
          "Payment",
          "Receipt",
          "Purchase",
          "Expense",
          "Transfer",
          "Adjustment",
          "Manual",
        ],
      },
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ledgerEntrySchema.index({ companyId: 1, accountId: 1, entryDate: -1 });
ledgerEntrySchema.index({ companyId: 1, entryDate: -1 });
ledgerEntrySchema.index({ journalEntryId: 1 });

const Ledger =
  mongoose.models.Ledger || mongoose.model("Ledger", ledgerEntrySchema);

export default Ledger;

