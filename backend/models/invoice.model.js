import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: false,
    trim: true,
    default: "",
  },
  quantity: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
  },
  unitPrice: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100, // Percentage discount
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100, // Percentage tax (VAT)
  },
  total: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    invoiceNumber: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    // Optional link to customer order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerOrder",
      required: false,
    },
    // Reference to Procurement (for supplier invoices)
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Procurement",
      required: false,
      index: true,
    },
    // Invoice dates
    issueDate: {
      type: Date,
      required: false,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: false,
    },
    // Invoice status
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"],
      default: "Draft",
    },
    // Invoice items
    items: {
      type: [invoiceItemSchema],
      required: false,
      default: [],
    },
    // Subtotal (before tax and discount)
    subtotal: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    // Global discount (percentage or fixed amount)
    globalDiscount: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      value: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tax information
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Total amount
    totalAmount: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    // Currency
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    // Payment information
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentDate: {
      type: Date,
    },
    // Link to payment record if paid via Stripe
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    // Notes and terms
    notes: {
      type: String,
      trim: true,
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: "Net 30", // Default payment terms
    },
    // Additional fields
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false, // Allow null for SuperAdmin created invoices
    },
    // Sent date
    sentDate: {
      type: Date,
    },
    // Last reminder sent
    lastReminderDate: {
      type: Date,
    },
    // Number of reminders sent
    remindersSent: {
      type: Number,
      default: 0,
      min: 0,
    },
    // PDF URL (stored in Cloudinary)
    pdfUrl: {
      type: String,
      default: null,
    },
    // PDF status
    pdfStatus: {
      type: String,
      enum: ["pending", "generated", "failed"],
      default: "pending",
    },
    // PDF generated date
    pdfGeneratedAt: {
      type: Date,
    },
    // Exchange rate (if currency is different from base currency)
    exchangeRate: {
      type: Number,
      default: 1,
    },
    // Amount in base currency (calculated at invoice creation)
    baseCurrencyAmount: {
      type: Number,
      default: null,
    },
    // Base currency
    baseCurrency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    // History of changes (Audit Trail)
    history: [
      {
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changes: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
        },
        reason: {
          type: String,
        },
        action: {
          type: String,
          enum: ["created", "updated", "sent", "paid", "cancelled", "status_changed"],
        },
      },
    ],
    // Email history
    emailHistory: [
      {
        sentAt: {
          type: Date,
          default: Date.now,
        },
        recipient: {
          type: String,
        },
        status: {
          type: String,
          enum: ["sent", "failed", "pending"],
        },
        messageId: {
          type: String,
        },
        type: {
          type: String,
          enum: ["invoice", "reminder"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
invoiceSchema.index({ companyId: 1, status: 1 });
invoiceSchema.index({ companyId: 1, issueDate: -1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ procurementId: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 }); // For finding overdue invoices
invoiceSchema.index({ status: 1, paymentStatus: 1 }); // For finding unpaid invoices
invoiceSchema.index({ pdfUrl: 1 }); // For finding invoices with PDFs
invoiceSchema.index({ "history.changedAt": -1 }); // For audit trail queries

// Pre-save hook to calculate totals
invoiceSchema.pre("save", function (next) {
  try {
    // Calculate subtotal from items
    if (!this.items || this.items.length === 0) {
      this.subtotal = 0;
      this.discountAmount = 0;
      this.taxAmount = 0;
      this.totalAmount = 0;
      this.paymentStatus = "Unpaid";
      return next();
    }
    
    this.subtotal = this.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = quantity * unitPrice;
      const discountPercent = parseFloat(item.discount) || 0;
      const itemDiscount = discountPercent > 0 ? (itemTotal * discountPercent) / 100 : 0;
      return sum + itemTotal - itemDiscount;
    }, 0);

    // Ensure subtotal is a number
    this.subtotal = parseFloat(this.subtotal) || 0;

    // Calculate global discount
    if (this.globalDiscount && this.globalDiscount.type === "percentage") {
      const discountValue = parseFloat(this.globalDiscount.value) || 0;
      this.discountAmount = (this.subtotal * discountValue) / 100;
    } else if (this.globalDiscount) {
      this.discountAmount = parseFloat(this.globalDiscount.value) || 0;
    } else {
      this.discountAmount = 0;
    }

    // Ensure discountAmount is a number
    this.discountAmount = parseFloat(this.discountAmount) || 0;

    // Calculate amount after discount
    const amountAfterDiscount = this.subtotal - this.discountAmount;

    // Calculate tax
    const taxRate = parseFloat(this.taxRate) || 0;
    this.taxAmount = (amountAfterDiscount * taxRate) / 100;
    this.taxAmount = parseFloat(this.taxAmount) || 0;

    // Calculate total
    this.totalAmount = amountAfterDiscount + this.taxAmount;
    this.totalAmount = parseFloat(this.totalAmount) || 0;

    // Update payment status
    const paidAmount = parseFloat(this.paidAmount) || 0;
    if (paidAmount >= this.totalAmount && this.totalAmount > 0) {
      this.paymentStatus = "Paid";
      if (!this.paymentDate) {
        this.paymentDate = new Date();
      }
    } else if (paidAmount > 0) {
      this.paymentStatus = "Partially Paid";
    } else {
      this.paymentStatus = "Unpaid";
    }

    // Update status to Overdue if past due date and not paid
    if (
      this.status !== "Cancelled" &&
      this.status !== "Paid" &&
      this.dueDate &&
      new Date(this.dueDate) < new Date() &&
      this.paymentStatus !== "Paid"
    ) {
      this.status = "Overdue";
    }

    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error);
    next(error);
  }
});

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;

