import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    // פרטי הליד
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    // Pipeline Management
    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Closed Won",
        "Closed Lost",
      ],
      default: "New",
    },
    // מקור הליד
    source: {
      type: String,
      enum: [
        "Website",
        "Referral",
        "Social Media",
        "Email Campaign",
        "Trade Show",
        "Cold Call",
        "Partner",
        "Other",
      ],
      default: "Other",
    },
    // הערכת ערך
    estimatedValue: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "ILS",
    },
    // הסתברות לסגירה (%)
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    // תאריך סגירה צפוי
    expectedCloseDate: {
      type: Date,
    },
    // ניקוד ליד (Lead Scoring)
    leadScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // מי אחראי על הליד (מערך - יכול להיות כמה עובדים)
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    // קישור למחלקה
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    // קישור לפרויקט (אם הליד הומר לפרויקט)
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    // משימות קשורות לליד
    taskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    // תגיות
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // פרטי קשר נוספים
    preferredContactMethod: {
      type: String,
      enum: ["Email", "Phone", "Meeting", "Other"],
      default: "Email",
    },
    lastContacted: {
      type: Date,
    },
    nextFollowUp: {
      type: Date,
    },
    // קישור ללקוח (אם הליד הפך ללקוח)
    convertedToCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    convertedAt: {
      type: Date,
    },
    // מי יצר/עדכן
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    // סיבת איבוד (אם סגור כ-Lost)
    lostReason: {
      type: String,
      trim: true,
    },
    // נתונים להזמנה (כשהליד נסגר בהצלחה)
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        unitPrice: {
          type: Number,
          default: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    deliveryDate: {
      type: Date,
    },
    globalDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderNotes: {
      type: String,
      trim: true,
    },
    // מועד תשלום
    paymentTerms: {
      type: String,
      enum: ["Immediate", "Net 30", "Net 45", "Net 60", "Net 90"],
      default: "Net 30",
    },
    // קישור להזמנה שנוצרה
    createdOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerOrder",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
leadSchema.index({ companyId: 1, status: 1 });
leadSchema.index({ companyId: 1, assignedTo: 1 });
leadSchema.index({ companyId: 1, source: 1 });
leadSchema.index({ companyId: 1, createdAt: -1 });
leadSchema.index({ email: 1 });

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
export default Lead;

