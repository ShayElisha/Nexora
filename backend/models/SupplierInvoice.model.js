import mongoose from "mongoose";

const supplierInvoiceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    supplierInvoiceNumber: {
      type: String,
      trim: true, // מספר חשבונית מהספק
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
    invoiceDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
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
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        discount: { type: Number, default: 0 }, // אחוז
        tax: { type: Number, default: 0 }, // אחוז מע"מ
        totalPrice: { type: Number, required: true },
      },
    ],
    // סכומים
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    // קישור להזמנת רכש
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Procurement",
    },
    // תשלומים
    payments: [
      {
        paymentDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        paymentMethod: {
          type: String,
          enum: ["Cash", "Check", "Bank Transfer", "Credit Card", "Other"],
        },
        reference: { type: String },
        paidBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
      },
    ],
    totalPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    // סטטוס
    status: {
      type: String,
      enum: [
        "Pending", // ממתין לתשלום
        "Partially Paid", // שולם חלקית
        "Paid", // שולם
        "Overdue", // עבר מועד
        "Disputed", // במחלוקת
        "Cancelled", // בוטל
      ],
      default: "Pending",
      index: true,
    },
    // תשלומים מתוכננים
    scheduledPayments: [
      {
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        status: {
          type: String,
          enum: ["Scheduled", "Paid", "Overdue", "Cancelled"],
          default: "Scheduled",
        },
        paidAt: { type: Date },
      },
    ],
    // תנאי תשלום
    paymentTerms: {
      type: String,
      enum: ["Immediate", "Net 15", "Net 30", "Net 60", "Net 90", "Custom"],
    },
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // קבצים מצורפים
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
supplierInvoiceSchema.index({ companyId: 1, supplierId: 1, invoiceDate: -1 });
supplierInvoiceSchema.index({ companyId: 1, status: 1 });
supplierInvoiceSchema.index({ companyId: 1, dueDate: 1 });
supplierInvoiceSchema.index({ companyId: 1, procurementId: 1 });

const SupplierInvoice =
  mongoose.models.SupplierInvoice ||
  mongoose.model("SupplierInvoice", supplierInvoiceSchema);

export default SupplierInvoice;

