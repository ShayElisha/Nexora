import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: [
        "Asset", // נכסים
        "Liability", // התחייבויות
        "Equity", // הון
        "Revenue", // הכנסות
        "Expense", // הוצאות
        "Cost of Goods Sold", // עלות מוצרים שנמכרו
        "Other Income", // הכנסות אחרות
        "Other Expense", // הוצאות אחרות
      ],
      required: true,
    },
    parentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // קישור לחשבון בנק אם רלוונטי
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
    },
    // הגדרות נוספות
    allowTransactions: {
      type: Boolean,
      default: true,
    },
    taxCategory: {
      type: String,
      enum: ["Taxable", "Non-Taxable", "Exempt", "Reverse Charge"],
      default: "Taxable",
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

// Indexes
accountSchema.index({ companyId: 1, accountNumber: 1 }, { unique: true });
accountSchema.index({ companyId: 1, accountType: 1 });
accountSchema.index({ companyId: 1, isActive: 1 });

const Account =
  mongoose.models.Account || mongoose.model("Account", accountSchema);

export default Account;

