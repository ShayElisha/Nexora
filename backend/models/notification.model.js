import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Reminder", "Info", "Warning", "Error", "Success", "Urgent"],
      default: "Info",
    },
    category: {
      type: String,
      enum: [
        "procurement",
        "finance",
        "hr",
        "inventory",
        "tasks",
        "projects",
        "customers",
        "system",
        "approval",
        "leads",
        "production",
        "warehouse",
        "suppliers",
        "invoices",
        "employees",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // שדות מקושרים - עבור כל סוגי הישויות
    relatedEntity: {
      entityType: {
        type: String,
        enum: [
          "PurchaseOrder",
          "Task",
          "Project",
          "Budget",
          "Invoice",
          "CustomerOrder",
          "Employee",
          "Event",
          "Inventory",
          "Supplier",
          "ProcurementProposal",
          "Finance",
          "Lead",
          "ProductionOrder",
          "Warehouse",
          "Shift",
          "Salary",
        ],
      },
      entityId: {
        type: String,
      },
    },
    actionUrl: {
      type: String,
    },
    actionLabel: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    expirationDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    // שדה ישן לתאימות לאחור
    PurchaseOrder: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
notificationSchema.index({ companyId: 1, employeeId: 1, isRead: 1 });
notificationSchema.index({ companyId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ expirationDate: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
