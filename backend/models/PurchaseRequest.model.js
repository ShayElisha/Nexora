import mongoose from "mongoose";

const purchaseRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // בקשות רכש
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    // פריטים
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, default: 0 },
        totalPrice: { type: Number, default: 0 },
        // למה נדרש
        reason: { type: String },
        // תאריך נדרש
        requiredDate: { type: Date },
        // העדפות
        preferredSupplier: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Suppliers",
        },
        specifications: { type: String },
      },
    ],
    // תאריכים
    requestDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    requiredDate: {
      type: Date,
      index: true,
    },
    // תקציב
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
    },
    estimatedTotal: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    // תהליך אישור
    approvalWorkflow: [
      {
        approverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        approverName: { type: String },
        role: { type: String },
        level: { type: Number, required: true }, // רמת אישור
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected", "Skipped"],
          default: "Pending",
        },
        approvedAt: { type: Date },
        rejectedAt: { type: Date },
        comments: { type: String },
      },
    ],
    currentApprovalLevel: {
      type: Number,
      default: 0,
    },
    // סטטוס
    status: {
      type: String,
      enum: [
        "Draft", // טיוטה
        "Submitted", // הוגש
        "Pending Approval", // ממתין לאישור
        "Approved", // אושר
        "Rejected", // נדחה
        "Converted to PO", // הומר להזמנת רכש
        "Cancelled", // בוטל
      ],
      default: "Draft",
      index: true,
    },
    // קישור להזמנת רכש
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Procurement",
    },
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // עדיפות
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
purchaseRequestSchema.index({ companyId: 1, status: 1, requestDate: -1 });
purchaseRequestSchema.index({ companyId: 1, requestedBy: 1 });
purchaseRequestSchema.index({ companyId: 1, departmentId: 1 });
purchaseRequestSchema.index({ companyId: 1, requiredDate: 1 });

const PurchaseRequest =
  mongoose.models.PurchaseRequest ||
  mongoose.model("PurchaseRequest", purchaseRequestSchema);

export default PurchaseRequest;

