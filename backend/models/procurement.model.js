import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  SKU: { type: String, required: true },
  category: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true }, // יחושב אוטומטית על בסיס unitPrice * quantity
});

const procurementSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "suppliers",
    required: true,
  },
  supplierName: { type: String, required: true },
  PurchaseOrder: { type: String, required: true },
  products: [productSchema], // מערך של מוצרים
  PaymentMethod: {
    type: String,
    required: true,
    enum: ["Cash", "Credit Card", "Debit Card", "Bank Transfer"],
  },
  PaymentTerms: {
    type: String,
    required: true,
    enum: ["Due on receipt", "Net 30 days", "Net 45 days", "Net 60 days"],
  },
  DeliveryAddress: { type: String, required: true },
  ShippingMethod: {
    type: String,
    required: false,
    enum: [
      "Air Freight",
      "Sea Freight",
      "Land Freight",
      "Truck Freight",
      "other",
    ],
  },
  purchaseDate: { type: Date, required: true },
  deliveryDate: { type: Date },
  orderStatus: {
    type: String,
    enum: ["Pending", "In Progress", "Delivered", "Cancelled"],
    default: "Pending",
  },
  approvalStatus: {
    type: String,
    enum: ["Approved", "Pending Approval", "Rejected"],
    default: "Pending Approval",
  },
  notes: { type: String },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Unpaid", "Partial"],
    default: "Unpaid",
  },
  shippingCost: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  requiresCustoms: { type: Boolean, default: false },
  warrantyExpiration: { type: Date },
  receivedDate: { type: Date },
  totalCost: { type: Number, required: true }, // סך הכל המחיר לכל המוצרים
  summeryProcurement: {
    type: String,
    required: [true, "Path `summeryProcurement` is required"], // שדה חובה
  },
  currentSignatures: { type: Number, default: 0 }, // מספר חתימות נוכחי
  currentSignerIndex: { type: Number, default: 0 }, // החותם הנוכחי בתור
  signers: [
    {
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
      name: { type: String, required: true },
      role: { type: String, required: true },
      order: { type: Number, required: true, default: 0 },
      hasSigned: { type: Boolean, default: false },
      timeStamp: { type: Date, default: Date.now },
      signatureUrl: { type: String }, // כתובת URL של החתימה
    },
  ],
  status: {
    type: String,
    enum: ["pending", "pending update", "completed"],
    default: "pending",
  }, // סטטוס
  statusUpdate: {
    type: String,
    enum: [null, "pending", "pending update", "completed"],
    default: null,
  }, // סטטוס
});

const Procurement = mongoose.model("Procurement", procurementSchema);

export default Procurement;
