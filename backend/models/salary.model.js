import mongoose from "mongoose";
const SalarySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
      index: true, // For efficient querying by period
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    totalHours: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPay: {
      type: Number,
      required: true,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    taxDeduction: {
      type: Number,
      default: 0, // Tax amount deducted
    },
    otherDeductions: [
      {
        description: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    netPay: {
      type: Number,
      required: true,
      default: 0, // Total pay after deductions
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Paid", "Canceled"],
      default: "Draft",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Index for efficient queries by employee and period
SalarySchema.index({ employeeId: 1, periodStart: 1 });

const Salary = mongoose.model("Salary", SalarySchema);
export default Salary;
