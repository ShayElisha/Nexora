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
    otherDetails: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Finance = mongoose.model("Finance", financeSchema);

export default Finance;
