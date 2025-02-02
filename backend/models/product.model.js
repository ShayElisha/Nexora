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
      unique: true,
    },
    barcode: {
      type: String,
      required: [true, "Barcode is required"],
      unique: true,
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
      required: [true, "Supplier ID is required"],
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
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
