import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    entryNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    entryDate: {
      type: Date,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      trim: true, // מספר מסמך/הזמנה/חשבונית
    },
    // רישומי יומן (Debit/Credit)
    entries: [
      {
        accountId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Account",
          required: true,
        },
        accountNumber: {
          type: String,
          required: true,
        },
        accountName: {
          type: String,
          required: true,
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
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    totalDebit: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCredit: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Posted", "Reversed", "Cancelled"],
      default: "Draft",
      index: true,
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
    // מי יצר/עדכן
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    postedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: Total Debit must equal Total Credit
journalEntrySchema.pre("save", function (next) {
  if (this.status === "Posted") {
    const totalDebit = this.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = this.entries.reduce(
      (sum, entry) => sum + entry.credit,
      0
    );
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return next(
        new Error("Total debit must equal total credit in a journal entry")
      );
    }
    this.totalDebit = totalDebit;
    this.totalCredit = totalCredit;
  }
  next();
});

// Indexes
journalEntrySchema.index({ companyId: 1, entryDate: -1 });
journalEntrySchema.index({ companyId: 1, status: 1 });
journalEntrySchema.index({ "sourceDocument.documentId": 1 });

const JournalEntry =
  mongoose.models.JournalEntry ||
  mongoose.model("JournalEntry", journalEntrySchema);

export default JournalEntry;

