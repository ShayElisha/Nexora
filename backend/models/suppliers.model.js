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
    },
    Contact: {
      type: String,
      required: false,
    },
    Phone: {
      type: String,
      required: false,
    },
    Email: {
      type: String,
      required: false,
    },
    Address: {
      type: String,
      required: false,
    },
    BankAccount: {
      type: String,
      required: false,
    },
    Rating: [{
      type: Number,
      min: 1,
      max: 5,
      required: false,
    }],
    baseCurrency: {
      type: String,
      required: [true, "BaseCurrency is required"],
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    ConfirmationAccount: {
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
    ProductsSupplied: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: false,
        },
        productName: {
          type: String,
          required: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Suppliers = mongoose.model("suppliers", suppliersSchema);

export default Suppliers;
