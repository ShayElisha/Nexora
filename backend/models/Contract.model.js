import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
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
      trim: true,
      index: true,
    },
    contractName: {
      type: String,
      required: true,
      trim: true,
    },
    contractType: {
      type: String,
      enum: [
        "Customer", // חוזה עם לקוח
        "Supplier", // חוזה עם ספק
        "Employee", // חוזה עבודה
        "Service", // חוזה שירות
        "Lease", // חוזה שכירות
        "Partnership", // הסכם שותפות
        "NDA", // הסכם סודיות
        "Other", // אחר
      ],
      required: true,
      index: true,
    },
    // צדדים לחוזה
    parties: [
      {
        type: {
          type: String,
          enum: ["Customer", "Supplier", "Employee", "Partner", "Other"],
        },
        entityId: {
          type: mongoose.Schema.Types.ObjectId,
          // ref will be determined dynamically
        },
        entityType: {
          type: String,
          enum: ["Customer", "Supplier", "Employee", "Partner"],
        },
        name: { type: String, required: true },
        role: {
          type: String,
          enum: ["Client", "Vendor", "Contractor", "Partner"],
        },
      },
    ],
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
    // האם החוזה אוטומטי לחידוש
    autoRenew: {
      type: Boolean,
      default: false,
    },
    renewalPeriod: {
      type: String,
      enum: ["Monthly", "Quarterly", "Semi-Annual", "Annual"],
    },
    // תאריך חידוש הבא
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
    paymentSchedule: [
      {
        dueDate: { type: Date },
        amount: { type: Number },
        status: {
          type: String,
          enum: ["Pending", "Paid", "Overdue"],
        },
      },
    ],
    // תנאי החוזה
    terms: {
      type: String,
      trim: true,
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
contractSchema.index({ companyId: 1, contractType: 1 });
contractSchema.index({ companyId: 1, status: 1 });
contractSchema.index({ companyId: 1, endDate: 1 });
contractSchema.index({ companyId: 1, nextRenewalDate: 1 });

const Contract =
  mongoose.models.Contract || mongoose.model("Contract", contractSchema);

export default Contract;

