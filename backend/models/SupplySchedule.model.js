import mongoose from "mongoose";

const supplyScheduleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    scheduleNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Procurement",
      required: true,
      index: true,
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
    // פריטים
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number },
        totalPrice: { type: Number },
      },
    ],
    // לוח זמנים
    schedule: [
      {
        deliveryDate: {
          type: Date,
          required: true,
          index: true,
        },
        items: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
            },
            productName: { type: String },
            quantity: { type: Number, required: true },
            receivedQuantity: { type: Number, default: 0 },
            status: {
              type: String,
              enum: ["Scheduled", "In Transit", "Delivered", "Delayed", "Cancelled"],
              default: "Scheduled",
            },
          },
        ],
        // מעקב משלוח
        tracking: {
          carrier: { type: String },
          trackingNumber: { type: String },
          estimatedDelivery: { type: Date },
          actualDelivery: { type: Date },
          status: {
            type: String,
            enum: ["Pending", "In Transit", "Delivered", "Delayed", "Lost"],
            default: "Pending",
          },
        },
        // התראות
        alerts: [
          {
            type: {
              type: String,
              enum: ["Upcoming", "Delayed", "Delivered", "Issue"],
            },
            date: { type: Date },
            message: { type: String },
            sent: { type: Boolean, default: false },
          },
        ],
      },
    ],
    // סטטוס כללי
    status: {
      type: String,
      enum: [
        "Scheduled", // מתוכנן
        "In Progress", // בתהליך
        "Partially Delivered", // נמסר חלקית
        "Delivered", // נמסר
        "Delayed", // התעכב
        "Cancelled", // בוטל
      ],
      default: "Scheduled",
      index: true,
    },
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
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // מי יצר/מנהל
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
supplyScheduleSchema.index({ companyId: 1, supplierId: 1, startDate: 1 });
supplyScheduleSchema.index({ companyId: 1, status: 1 });
supplyScheduleSchema.index({ "schedule.deliveryDate": 1 });

const SupplySchedule =
  mongoose.models.SupplySchedule ||
  mongoose.model("SupplySchedule", supplyScheduleSchema);

export default SupplySchedule;

