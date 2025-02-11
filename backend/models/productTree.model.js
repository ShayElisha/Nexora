import mongoose from "mongoose";

const productTreeSchema = new mongoose.Schema(
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
    components: [
      {
        componentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Component ID is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        unitCost: {
          type: Number,
          required: false,
        },
      },
    ],
    totalCost: {
      type: Number,
      required: false,
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

const productTree =
  mongoose.models.productTree ||
  mongoose.model("productTree", productTreeSchema);

export default productTree;
