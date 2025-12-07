import mongoose from "mongoose";

const supplierContractSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    contractNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contractName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suppliers",
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    // תאריכים
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },
    // האם אוטומטי לחידוש
    autoRenew: {
      type: Boolean,
      default: false,
    },
    renewalPeriod: {
      type: String,
      enum: ["Monthly", "Quarterly", "Semi-Annual", "Annual"],
    },
    nextRenewalDate: {
      type: Date,
      index: true,
    },
    // סטטוס
    status: {
      type: String,
      enum: ["Draft", "Active", "Expired", "Terminated", "Renewed"],
      default: "Draft",
      index: true,
    },
    // ערך החוזה
    contractValue: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    // תנאי תשלום
    paymentTerms: {
      type: String,
      enum: ["Immediate", "Net 15", "Net 30", "Net 60", "Net 90", "Custom"],
    },
    // מוצרים/שירותים
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: { type: String, required: true },
        unitPrice: { type: Number },
        minimumOrder: { type: Number },
        discount: { type: Number }, // אחוז הנחה
      },
    ],
    // תנאי החוזה
    terms: {
      type: String,
      trim: true,
    },
    // תנאים נוספים
    conditions: {
      deliveryTerms: { type: String },
      qualityStandards: { type: String },
      warranty: { type: String },
      penalties: { type: String },
      terminationClause: { type: String },
    },
    // קבצים מצורפים
    documents: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        documentType: {
          type: String,
          enum: ["Contract", "Amendment", "Addendum", "Termination", "Other"],
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // התראות
    alerts: [
      {
        type: {
          type: String,
          enum: ["Renewal", "Expiration", "Payment", "Milestone", "Custom"],
        },
        date: { type: Date },
        message: { type: String },
        sent: { type: Boolean, default: false },
      },
    ],
    // מעקב ביצוע
    performance: {
      totalOrders: { type: Number, default: 0 },
      totalValue: { type: Number, default: 0 },
      onTimeDelivery: { type: Number, default: 0 }, // אחוז
      qualityScore: { type: Number, default: 0 }, // ציון 0-100
      lastOrderDate: { type: Date },
    },
    // היסטוריית שינויים
    history: [
      {
        action: {
          type: String,
          enum: ["Created", "Updated", "Renewed", "Terminated", "Amended"],
        },
        date: { type: Date, default: Date.now },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        description: { type: String },
      },
    ],
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // מי יצר/עדכן
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
supplierContractSchema.index({ companyId: 1, supplierId: 1 });
supplierContractSchema.index({ companyId: 1, status: 1 });
supplierContractSchema.index({ companyId: 1, endDate: 1 });
supplierContractSchema.index({ companyId: 1, nextRenewalDate: 1 });

const SupplierContract =
  mongoose.models.SupplierContract ||
  mongoose.model("SupplierContract", supplierContractSchema);

export default SupplierContract;

