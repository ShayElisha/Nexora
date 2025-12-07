import mongoose from "mongoose";

const inventoryQualitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    qualityCheckNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    // סוג בדיקה
    checkType: {
      type: String,
      enum: [
        "Incoming", // בדיקת כניסה
        "Outgoing", // בדיקת יציאה
        "Periodic", // בדיקה תקופתית
        "Random", // בדיקה אקראית
        "Complaint", // בדיקה בעקבות תלונה
        "Return", // בדיקת החזרה
      ],
      required: true,
    },
    checkDate: {
      type: Date,
      required: true,
      index: true,
    },
    // כמות שנבדקה
    quantityChecked: {
      type: Number,
      required: true,
    },
    // תוצאות בדיקה
    passed: {
      type: Number,
      default: 0, // כמות שעברה
    },
    rejected: {
      type: Number,
      default: 0, // כמות שנדחתה
    },
    // סיבת דחייה
    rejectionReasons: [
      {
        reason: {
          type: String,
          enum: [
            "Defective", // פגום
            "Damaged", // ניזוק
            "Expired", // פג תוקף
            "Wrong Specification", // מפרט שגוי
            "Contamination", // זיהום
            "Packaging Issue", // בעיית אריזה
            "Quantity Mismatch", // אי התאמה בכמות
            "Other", // אחר
          ],
        },
        quantity: { type: Number },
        description: { type: String },
      },
    ],
    // סטטוס
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    // תוצאה כללית
    overallResult: {
      type: String,
      enum: ["Pass", "Fail", "Conditional"],
    },
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // מי ביצע
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // אישור
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedAt: {
      type: Date,
    },
    // החזרות
    returns: [
      {
        quantity: { type: Number, required: true },
        reason: { type: String },
        returnDate: { type: Date, default: Date.now },
        returnedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Supplier",
        },
        status: {
          type: String,
          enum: ["Pending", "Returned", "Refunded", "Replaced"],
          default: "Pending",
        },
      },
    ],
    // קבצים מצורפים
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
inventoryQualitySchema.index({ companyId: 1, inventoryId: 1, checkDate: -1 });
inventoryQualitySchema.index({ companyId: 1, checkType: 1 });
inventoryQualitySchema.index({ companyId: 1, status: 1 });
inventoryQualitySchema.index({ companyId: 1, overallResult: 1 });

const InventoryQuality =
  mongoose.models.InventoryQuality ||
  mongoose.model("InventoryQuality", inventoryQualitySchema);

export default InventoryQuality;

