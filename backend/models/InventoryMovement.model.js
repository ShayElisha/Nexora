import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    movementNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: [
        "Internal", // תנועה פנימית (העברה בין מחסנים)
        "External", // תנועה חיצונית (כניסה/יציאה)
        "Production", // תנועת ייצור
        "Service", // תנועת שירות
        "Adjustment", // התאמה
        "Return", // החזרה
        "Damage", // נזק
        "Expiration", // פקיעת תוקף
      ],
      required: true,
      index: true,
    },
    movementDate: {
      type: Date,
      required: true,
      index: true,
    },
    // מוצר
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    // מחסנים
    fromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    toWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    // קישור למסמך מקור
    sourceDocument: {
      type: {
        type: String,
        enum: [
          "Procurement",
          "CustomerOrder",
          "ProductionOrder",
          "Transfer",
          "Adjustment",
          "Return",
          "Service",
          "Manual",
        ],
      },
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      documentNumber: {
        type: String,
      },
    },
    // קישור ישיר להזמנת ייצור
    productionOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionOrder",
      required: false,
      index: true,
    },
    // הערות
    description: {
      type: String,
      trim: true,
    },
    // מי ביצע
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    // אישור
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedAt: {
      type: Date,
    },
    // סטטוס
    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
inventoryMovementSchema.index({ companyId: 1, movementType: 1, movementDate: -1 });
inventoryMovementSchema.index({ companyId: 1, productId: 1, movementDate: -1 });
inventoryMovementSchema.index({ companyId: 1, fromWarehouseId: 1 });
inventoryMovementSchema.index({ companyId: 1, toWarehouseId: 1 });
inventoryMovementSchema.index({ companyId: 1, status: 1 });
inventoryMovementSchema.index({ companyId: 1, productionOrderId: 1 });

const InventoryMovement =
  mongoose.models.InventoryMovement ||
  mongoose.model("InventoryMovement", inventoryMovementSchema);

export default InventoryMovement;

