import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    branchNumber: {
      type: String,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["Checking", "Savings", "Credit", "Investment", "Other"],
      default: "Checking",
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    reconciledBalance: {
      type: Number,
      default: 0, // יתרה מוסכמת
    },
    lastReconciledDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // קישור לחשבון בספר החשבונות
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    // פרטי קשר בבנק
    bankContact: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    // הגדרות ייבוא
    importSettings: {
      format: {
        type: String,
        enum: ["CSV", "Excel", "OFX", "QIF", "MT940"],
      },
      dateFormat: { type: String },
      delimiter: { type: String },
      encoding: { type: String },
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
bankAccountSchema.index({ companyId: 1, accountNumber: 1 }, { unique: true });
bankAccountSchema.index({ companyId: 1, isActive: 1 });

const BankAccount =
  mongoose.models.BankAccount ||
  mongoose.model("BankAccount", bankAccountSchema);

export default BankAccount;

