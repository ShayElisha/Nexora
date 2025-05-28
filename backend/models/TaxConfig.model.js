import mongoose from "mongoose";
const TaxConfigSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: /^[A-Z]{2}$/,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  taxName: {
    type: String,
    default: "Income Tax",
    trim: true,
  },
  taxBrackets: [
    {
      limit: {
        type: Number,
        required: true,
        min: 0,
      },
      rate: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
    },
  ],
  otherTaxes: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      rate: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      fixedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  ],
  currency: {
    type: String,
    required: true,
    default: "USD",
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
TaxConfigSchema.index({ countryCode: 1, companyId: 1 });

// Update timestamp on save
TaxConfigSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const TaxConfig = mongoose.model("TaxConfig", TaxConfigSchema);
export default TaxConfig;
