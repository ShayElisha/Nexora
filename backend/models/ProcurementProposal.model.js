import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  receivedQuantity: { type: Number, default: 0 },
  total: { type: Number, required: true },
});
const ProcurementProposalSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // מערך של פריטים ברכישה
    items: [productSchema],
    totalEstimatedCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved","approved and waiting order", "rejected"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

// חישוב הסכום הכולל לפני שמירה
ProcurementProposalSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.totalEstimatedCost = this.items.reduce(
      (total, item) => total + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
  } else {
    this.totalEstimatedCost = 0;
  }
  next();
});

const ProcurementProposal = mongoose.model(
  "ProcurementProposal",
  ProcurementProposalSchema
);

export default ProcurementProposal;
