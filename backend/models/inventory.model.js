import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: [true, "Minimum stock level is required"],
      default: 10,
    },
    reorderQuantity: {
      type: Number,
      required: [true, "Reorder quantity is required"],
      default: 20,
    },
    batchNumber: {
      type: String,
      required: false,
    },
    expirationDate: {
      type: Date,
      required: false,
    },
    shelfLocation: {
      type: String,
      required: false,
    },
    lastOrderDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
