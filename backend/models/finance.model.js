import mongoose from "mongoose";

const financeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Income", "Expense", "Transfer"],
      required: true,
    },
    transactionAmount: {
      type: Number,
      required: true,
    },
    transactionCurrency: {
      type: String,
      required: true,
    },
    transactionDescription: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: true,
    },
    bankAccount: {
      type: String,
      required: true,
    },
    transactionStatus: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      required: true,
    },
    // שדה לשמירת סוג הרשומה (ספק, עובד, לקוח, אחר)
    recordType: {
      type: String,
      enum: ["supplier", "employee", "customer", "other"],
      required: true,
    },
    // שדה חדש לאיחוד המזהה של הצד הנבחר (ספק, עובד, לקוח)
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    attachmentURL: [
      {
        type: String,
        required: false,
      },
    ],
    invoiceNumber: {
      type: String,
      required: false,
    },
    // Reference to Invoice
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: false,
    },
    // Reference to CustomerOrder
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerOrder",
      required: false,
    },
    // Reference to Budget
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: false,
      index: true,
    },
    budgetCategory: {
      type: String,
      trim: true, // שם הקטגוריה מהתקציב (אם רלוונטי)
    },
    // מועד תשלום
    paymentTerms: {
      type: String,
      enum: ["Immediate", "Net 30", "Net 45", "Net 60", "Net 90"],
      default: "Net 30",
    },
    // תאריך תשלום צפוי (מחושב אוטומטית לפי transactionDate + paymentTerms)
    dueDate: {
      type: Date,
      required: false,
    },
    // האם נשלחה התראה על מועד תשלום קרוב
    paymentReminderSent: {
      type: Boolean,
      default: false,
    },
    otherDetails: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate dueDate based on paymentTerms
financeSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("transactionDate") || this.isModified("paymentTerms")) {
    if (this.transactionDate && this.paymentTerms) {
      if (this.paymentTerms === "Immediate") {
        this.dueDate = this.transactionDate instanceof Date ? this.transactionDate : new Date(this.transactionDate);
      } else {
        const daysToAdd = this.paymentTerms === "Net 30" ? 30 :
                          this.paymentTerms === "Net 45" ? 45 :
                          this.paymentTerms === "Net 60" ? 60 :
                          this.paymentTerms === "Net 90" ? 90 : 30;
        
        const transactionDate = this.transactionDate instanceof Date ? this.transactionDate : new Date(this.transactionDate);
        const dueDate = new Date(transactionDate);
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        this.dueDate = dueDate;
      }
    }
  }
  next();
});

// Index for budgetId
financeSchema.index({ companyId: 1, budgetId: 1 });
financeSchema.index({ companyId: 1, transactionType: 1, transactionDate: -1 });

const Finance = mongoose.model("Finance", financeSchema);

export default Finance;
