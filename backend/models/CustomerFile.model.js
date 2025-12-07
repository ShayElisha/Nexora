import mongoose from "mongoose";

const CustomerFileSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["Contract", "Invoice", "Document", "Image", "Other"],
      default: "Document",
    },
    description: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CustomerFileSchema.index({ companyId: 1, customerId: 1 });
CustomerFileSchema.index({ companyId: 1, category: 1 });
CustomerFileSchema.index({ companyId: 1, createdAt: -1 });

const CustomerFile = mongoose.models.CustomerFile || mongoose.model("CustomerFile", CustomerFileSchema);
export default CustomerFile;

