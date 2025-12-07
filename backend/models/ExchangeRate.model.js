import mongoose from "mongoose";

const exchangeRateSchema = new mongoose.Schema(
  {
    // Source currency (from)
    fromCurrency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/, // ISO 4217 currency code
    },
    // Target currency (to)
    toCurrency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },
    // Exchange rate (1 fromCurrency = rate toCurrency)
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    // Date of the exchange rate
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Source of the exchange rate (e.g., "manual", "api", "bank")
    source: {
      type: String,
      enum: ["manual", "api", "bank"],
      default: "manual",
    },
    // Company ID (optional, for company-specific rates)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    // Is this rate still valid?
    isActive: {
      type: Boolean,
      default: true,
    },
    // Notes about the rate
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
exchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1, date: -1 });
exchangeRateSchema.index({ companyId: 1, fromCurrency: 1, toCurrency: 1 });
exchangeRateSchema.index({ isActive: 1 });

// Ensure unique rate per currency pair per date per company
exchangeRateSchema.index(
  { fromCurrency: 1, toCurrency: 1, date: 1, companyId: 1 },
  { unique: true, partialFilterExpression: { companyId: { $exists: true } } }
);

// Ensure unique rate per currency pair per date (global rates)
exchangeRateSchema.index(
  { fromCurrency: 1, toCurrency: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { companyId: { $exists: false } },
  }
);

const ExchangeRate =
  mongoose.models.ExchangeRate ||
  mongoose.model("ExchangeRate", exchangeRateSchema);

export default ExchangeRate;

