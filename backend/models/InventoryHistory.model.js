import mongoose from "mongoose";

const inventoryHistorySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    oldQuantity: {
      type: Number,
      required: false,
    },
    newQuantity: {
      type: Number,
      required: false,
    },
    changeAmount: {
      type: Number,
      required: false, // Positive for additions, negative for subtractions
    },
    quantity: {
      type: Number,
      required: false, // For transfer type
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Order Confirmation",
        "Order Preparation",
        "Order Cancelled",
        "Order Returned",
        "Manual Update",
        "Procurement Received",
        "Stock Adjustment",
        "Transferred to warehouse",
        "Received from warehouse"
      ],
    },
    type: {
      type: String,
      enum: ["in", "out", "adjustment", "transfer"],
      default: "adjustment"
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerOrder",
      required: false,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
inventoryHistorySchema.index({ companyId: 1, productId: 1, timestamp: -1 });
inventoryHistorySchema.index({ orderId: 1 });
inventoryHistorySchema.index({ timestamp: -1 });

const InventoryHistory =
  mongoose.models.InventoryHistory ||
  mongoose.model("InventoryHistory", inventoryHistorySchema);

export default InventoryHistory;

