import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  departmentOrProjectName: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  amount: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  period: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["Draft", "Approved", "Rejected"],
    default: "Draft",
  },
  categories: [
    {
      name: { type: String, required: true },
      allocatedAmount: { type: Number, required: true },
    },
  ],
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: { type: Number },
      unitPrice: { type: Number },
      totalPrice: { type: Number },
      addedAt: { type: Date, default: Date.now },
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
    },
  ],
  notes: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "employee",
    required: true,
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
  approvals: [
    {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
      approvedAt: { type: Date },
      comment: { type: String },
    },
  ],
  currentSignatures: { type: Number, default: 0 },
  currentSignerIndex: { type: Number, default: 0 },
  signers: [
    {
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
      name: { type: String, required: true },
      role: { type: String, required: true },
      order: { type: Number, required: true, default: 0 },
      hasSigned: { type: Boolean, default: false },
      timeStamp: { type: Date, default: Date.now },
      signatureUrl: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Budget = mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);

export default Budget;
