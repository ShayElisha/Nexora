import mongoose from "mongoose";

const priceListSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    priceListName: {
      type: String,
      required: true,
      trim: true,
    },
    priceListNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // סוג תמחור
    priceListType: {
      type: String,
      enum: [
        "Customer", // תמחור ללקוחות
        "Supplier", // תמחור מספקים
        "Internal", // תמחור פנימי
        "Promotional", // תמחור מבצעי
      ],
      required: true,
    },
    // קישור ללקוח/ספק
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suppliers",
    },
    // תאריכים
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },
    // סטטוס
    status: {
      type: String,
      enum: ["Draft", "Active", "Expired", "Cancelled"],
      default: "Draft",
      index: true,
    },
    // מטבע
    currency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    // פריטים
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true },
        sku: { type: String },
        // תמחור בסיסי
        basePrice: {
          type: Number,
          required: true,
          min: 0,
        },
        // תמחור לפי כמות
        quantityBreaks: [
          {
            minQuantity: { type: Number, required: true },
            maxQuantity: { type: Number },
            price: { type: Number, required: true },
            discount: { type: Number }, // אחוז הנחה
          },
        ],
        // תמחור לפי תקופה
        periodPricing: [
          {
            startDate: { type: Date, required: true },
            endDate: { type: Date },
            price: { type: Number, required: true },
            discount: { type: Number },
          },
        ],
        // מחיר מינימום/מקסימום
        minPrice: { type: Number },
        maxPrice: { type: Number },
        // הערות
        notes: { type: String },
      },
    ],
    // כללי הנחה
    discountRules: [
      {
        type: {
          type: String,
          enum: ["Percentage", "Fixed Amount", "Free Shipping"],
        },
        condition: {
          type: String,
          enum: [
            "Minimum Order Value",
            "Minimum Quantity",
            "Customer Type",
            "Product Category",
            "All",
          ],
        },
        value: { type: Number },
        description: { type: String },
      },
    ],
    // הערות
    notes: {
      type: String,
      trim: true,
    },
    // מי יצר/עדכן
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
priceListSchema.index({ companyId: 1, priceListType: 1, status: 1 });
priceListSchema.index({ companyId: 1, customerId: 1 });
priceListSchema.index({ companyId: 1, supplierId: 1 });
priceListSchema.index({ companyId: 1, startDate: 1, endDate: 1 });

const PriceList =
  mongoose.models.PriceList || mongoose.model("PriceList", priceListSchema);

export default PriceList;

