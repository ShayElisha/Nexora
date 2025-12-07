import mongoose from "mongoose";

const stockCountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    countNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    countType: {
      type: String,
      enum: [
        "Full", // ספירה מלאה
        "Partial", // ספירה חלקית
        "Cycle", // ספירה מחזורית
        "Spot", // ספירה נקודתית
        "Random", // ספירה אקראית
      ],
      default: "Full",
    },
    countDate: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
    },
    // פריטים בספירה
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
        productName: { type: String, required: true },
        location: {
          type: String,
          trim: true, // מיקום במחסן
        },
        // כמויות
        systemQuantity: {
          type: Number,
          required: true, // כמות במערכת
        },
        countedQuantity: {
          type: Number,
          default: 0, // כמות שנספרה
        },
        variance: {
          type: Number,
          default: 0, // הבדל (counted - system)
        },
        variancePercentage: {
          type: Number,
          default: 0,
        },
        // מחיר
        unitCost: {
          type: Number,
          default: 0,
        },
        varianceValue: {
          type: Number,
          default: 0, // ערך ההבדל
        },
        // הערות
        notes: {
          type: String,
          trim: true,
        },
        // מי ספר
        countedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        countedAt: {
          type: Date,
        },
      },
    ],
    // סטטוס
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Reviewed", "Adjusted", "Cancelled"],
      default: "Scheduled",
      index: true,
    },
    // סטטיסטיקות
    statistics: {
      totalItems: { type: Number, default: 0 },
      itemsCounted: { type: Number, default: 0 },
      itemsWithVariance: { type: Number, default: 0 },
      totalVarianceValue: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }, // אחוז דיוק
    },
    // מי ביצע
    performedBy: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        role: {
          type: String,
          enum: ["Counter", "Supervisor", "Reviewer"],
        },
      },
    ],
    // סקירה
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    // התאמה
    adjusted: {
      type: Boolean,
      default: false,
    },
    adjustedAt: {
      type: Date,
    },
    adjustedBy: {
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
stockCountSchema.index({ companyId: 1, warehouseId: 1, countDate: -1 });
stockCountSchema.index({ companyId: 1, status: 1 });
stockCountSchema.index({ companyId: 1, countType: 1 });

const StockCount =
  mongoose.models.StockCount || mongoose.model("StockCount", stockCountSchema);

export default StockCount;

