import mongoose from "mongoose";

const suppliersSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    SupplierName: {
      type: String,
      required: true,
      trim: true,
    },
    Contact: {
      type: String,
      trim: true,
    },
    Phone: {
      type: String,
      trim: true,
    },
    Email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    Address: {
      type: String,
      trim: true,
    },
    BankAccount: {
      type: String,
    },
    Rating: [
      {
        type: Number,
        min: 1,
        max: 5,
      },
    ],
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    baseCurrency: {
      type: String,
      required: [true, "BaseCurrency is required"],
      uppercase: true,
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    ConfirmationAccount: {
      type: String,
    },
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    ProductsSupplied: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

suppliersSchema.index({ companyId: 1, SupplierName: 1 }, { unique: true });

const Suppliers =
  mongoose.models.Suppliers || mongoose.model("Suppliers", suppliersSchema);

export default Suppliers;

