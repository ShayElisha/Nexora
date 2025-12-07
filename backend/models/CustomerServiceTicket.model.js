import mongoose from "mongoose";

const customerServiceTicketSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerOrder",
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
    category: {
      type: String,
      enum: [
        "Technical Support", // תמיכה טכנית
        "Billing", // חיוב
        "Product Issue", // בעיית מוצר
        "Delivery Issue", // בעיית משלוח
        "Return/Refund", // החזרה/החזר
        "Complaint", // תלונה
        "General Inquiry", // שאלה כללית
        "Feature Request", // בקשה לפיצ'ר
        "Other", // אחר
      ],
      required: true,
      default: "General Inquiry",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
    // SLA
    sla: {
      responseTime: {
        type: Number, // שעות
      },
      resolutionTime: {
        type: Number, // שעות
      },
      responseDeadline: {
        type: Date,
      },
      resolutionDeadline: {
        type: Date,
      },
      responseTimeActual: {
        type: Number, // שעות בפועל
      },
      resolutionTimeActual: {
        type: Number, // שעות בפועל
      },
      slaStatus: {
        type: String,
        enum: ["On Time", "At Risk", "Breached"],
        default: "On Time",
      },
    },
    // הקצאה
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    // תגובות/הודעות
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
        },
        comment: {
          type: String,
          required: true,
        },
        isInternal: {
          type: Boolean,
          default: false, // הערה פנימית (לא נראית ללקוח)
        },
        attachments: [
          {
            fileName: { type: String },
            fileUrl: { type: String },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // קבצים מצורפים
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // תאריכים
    openedAt: {
      type: Date,
      default: Date.now,
    },
    firstResponseAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    // פתרון
    resolution: {
      type: String,
      trim: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    // שביעות רצון
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    satisfactionFeedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customerServiceTicketSchema.index({ companyId: 1, status: 1, createdAt: -1 });
customerServiceTicketSchema.index({ companyId: 1, customerId: 1, createdAt: -1 });
customerServiceTicketSchema.index({ companyId: 1, assignedTo: 1, status: 1 });
customerServiceTicketSchema.index({ companyId: 1, priority: 1 });
customerServiceTicketSchema.index({ "sla.resolutionDeadline": 1 });

const CustomerServiceTicket =
  mongoose.models.CustomerServiceTicket ||
  mongoose.model("CustomerServiceTicket", customerServiceTicketSchema);

export default CustomerServiceTicket;

