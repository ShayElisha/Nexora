import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
    },
    barcode: {
      type: String,
      required: [true, "Barcode is required"],
      trim: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
    },
    productDescription: {
      type: String,
      required: false,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    length: {
      type: Number,
      require: false,
    },
    width: {
      type: Number,
      require: false,
    },
    height: {
      type: Number,
      require: false,
    },
    volume: {
      type: Number,
      required: false,
    },
    supplierName: {
      type: String,
    },
    productImage: {
      type: String,
      required: false,
    },
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    productType: {
      type: String,
      enum: ["purchase", "sale", "both"],
      default: "purchase",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// אם המודל כבר קיים, נשתמש בו; אם לא, ניצור אותו.
productSchema.index({ companyId: 1, sku: 1 }, { unique: true });
productSchema.index({ companyId: 1, barcode: 1 }, { unique: true });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
