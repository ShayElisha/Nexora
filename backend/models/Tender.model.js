import mongoose from "mongoose";

const tenderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    tenderNumber: {
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
      required: true,
    },
    // תאריכים
    publishDate: {
      type: Date,
      required: true,
      index: true,
    },
    submissionDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    evaluationDeadline: {
      type: Date,
    },
    awardDate: {
      type: Date,
    },
    // סטטוס
    status: {
      type: String,
      enum: [
        "Draft", // טיוטה
        "Published", // פורסם
        "Open", // פתוח לקבלת הצעות
        "Closed", // נסגר
        "Under Evaluation", // בהערכה
        "Awarded", // הוענק
        "Cancelled", // בוטל
      ],
      default: "Draft",
      index: true,
    },
    // פריטים במכרז
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, required: true },
        specifications: { type: String },
        unit: { type: String },
      },
    ],
    // תקציב משוער
    estimatedBudget: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    // קריטריוני הערכה
    evaluationCriteria: [
      {
        criterion: { type: String, required: true },
        weight: { type: Number, min: 0, max: 100 }, // משקל באחוזים
        description: { type: String },
      },
    ],
    // הצעות
    bids: [
      {
        supplierId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Suppliers",
          required: true,
        },
        supplierName: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
        // פריטים בהצעה
        items: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
            },
            productName: { type: String },
            quantity: { type: Number },
            unitPrice: { type: Number },
            totalPrice: { type: Number },
            specifications: { type: String },
            deliveryTime: { type: String }, // זמן אספקה
            warranty: { type: String }, // אחריות
          },
        ],
        totalAmount: { type: Number, required: true },
        currency: { type: String, default: "ILS" },
        // תנאי תשלום
        paymentTerms: { type: String },
        // הערות
        notes: { type: String },
        // הערכה
        evaluation: {
          score: { type: Number, min: 0, max: 100 },
          criteriaScores: [
            {
              criterion: { type: String },
              score: { type: Number },
            },
          ],
          evaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
          },
          evaluatedAt: { type: Date },
          comments: { type: String },
        },
        // סטטוס
        status: {
          type: String,
          enum: ["Submitted", "Under Review", "Accepted", "Rejected", "Winner"],
          default: "Submitted",
        },
        // קבצים מצורפים
        attachments: [
          {
            fileName: { type: String },
            fileUrl: { type: String },
          },
        ],
      },
    ],
    // זוכה
    winner: {
      bidIndex: { type: Number },
      supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Suppliers",
      },
      supplierName: { type: String },
      awardedAt: { type: Date },
      awardedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      awardAmount: { type: Number },
    },
    // מי יצר/מנהל
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    // הערות
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
tenderSchema.index({ companyId: 1, status: 1, publishDate: -1 });
tenderSchema.index({ companyId: 1, submissionDeadline: 1 });
tenderSchema.index({ "bids.supplierId": 1 });

const Tender =
  mongoose.models.Tender || mongoose.model("Tender", tenderSchema);

export default Tender;

