import mongoose from "mongoose";
import addressSchema from "./subschemas/address.schema.js";

// סכימת פריט בהזמנה (Order Item)
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  // אחוז הנחה למוצר (אם לא נבחרת הנחה גלובלית, ניתן להשתמש בהנחה פרטנית)
  discount: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  isAllocated: {
    type: Boolean,
    default: false,
  },
});

// סכימת הזמנת לקוח עם שדה items המוגדר כמערך של OrderItemSchema
const CustomerOrderSchema = new mongoose.Schema(
  {
    // הפנייה ללקוח המבצע את ההזמנה
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    // הפנייה לחברה בה נמכרו המוצרים
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
    },
    items: {
      type: [OrderItemSchema],
      default: [],
    },
    // סכום ההזמנה הכולל (לאחר החלת ההנחות)
    orderTotal: {
      type: Number,
      required: true,
    },
    // הנחה כוללת לכל ההזמנה (במידה ומוגדרת, יש להתעלם מהנחות פרטניות)
    globalDiscount: {
      type: Number,
      default: 0,
    },
    // אחוז מס (VAT/מע"מ)
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // סכום המס
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
        "On Hold",
      ],
      default: "Pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    // מועד תשלום
    paymentTerms: {
      type: String,
      enum: ["Immediate", "Net 30", "Net 45", "Net 60", "Net 90"],
      default: "Net 30",
    },
    deliveryTrackingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryTracking",
    },
    shippingAddress: addressSchema,
    contactPhone: {
      type: String,
    },
    preparationStatus: {
      type: String,
      enum: ["Not Started", "In Progress", "Ready to Ship"],
      default: "Not Started",
    },
    confirmedAt: {
      type: Date,
    },
    preparationDate: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    // Flag to prevent double inventory deduction
    inventoryReserved: {
      type: Boolean,
      default: false,
    },
    inventoryReservedAt: {
      type: Date,
    },
    // קישור לליד (אם ההזמנה נוצרה מליד)
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
    },
    // קישור לפרויקט
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
  },
  {
    timestamps: true, // מוסיף createdAt ו-updatedAt באופן אוטומטי
  }
);

const CustomerOrder =
  mongoose.models.CustomerOrder ||
  mongoose.model("CustomerOrder", CustomerOrderSchema);

export default CustomerOrder;
