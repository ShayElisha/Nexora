import mongoose from "mongoose";

const salesOpportunitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    opportunityName: {
      type: String,
      required: true,
      trim: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    // Pipeline Stage
    stage: {
      type: String,
      enum: [
        "Prospecting", // איתור לקוחות פוטנציאליים
        "Qualification", // אימות
        "Needs Analysis", // ניתוח צרכים
        "Proposal", // הצעה
        "Negotiation", // משא ומתן
        "Closed Won", // נסגר בהצלחה
        "Closed Lost", // נסגר ללא הצלחה
      ],
      default: "Prospecting",
      index: true,
    },
    // ערך ההזדמנות
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
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
      index: true,
    },
    // תאריך סגירה בפועל
    actualCloseDate: {
      type: Date,
    },
    // מוצרים/שירותים
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: { type: String },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
        totalPrice: { type: Number, default: 0 },
      },
    ],
    // אחראי מכירות
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    // מקור ההזדמנות
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
        "Existing Customer",
        "Other",
      ],
      default: "Other",
    },
    // סוג הזדמנות
    type: {
      type: String,
      enum: ["New Business", "Existing Business", "Renewal", "Upsell", "Cross-sell"],
      default: "New Business",
    },
    // תחרות
    competitors: [
      {
        name: { type: String },
        strength: { type: String, enum: ["Weak", "Medium", "Strong"] },
      },
    ],
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // היסטוריית פעילויות
    activities: [
      {
        type: {
          type: String,
          enum: ["Call", "Email", "Meeting", "Note", "Task"],
        },
        date: { type: Date, default: Date.now },
        description: { type: String },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
      },
    ],
    // סטטוס
    status: {
      type: String,
      enum: ["Open", "Won", "Lost", "Abandoned"],
      default: "Open",
      index: true,
    },
    // סיבת אובדן (אם נסגר ללא הצלחה)
    lossReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
salesOpportunitySchema.index({ companyId: 1, stage: 1 });
salesOpportunitySchema.index({ companyId: 1, assignedTo: 1 });
salesOpportunitySchema.index({ companyId: 1, expectedCloseDate: 1 });
salesOpportunitySchema.index({ companyId: 1, status: 1 });

const SalesOpportunity =
  mongoose.models.SalesOpportunity ||
  mongoose.model("SalesOpportunity", salesOpportunitySchema);

export default SalesOpportunity;

