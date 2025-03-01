import mongoose from "mongoose";

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
  },
  {
    timestamps: true, // מוסיף createdAt ו-updatedAt באופן אוטומטי
  }
);

const CustomerOrder =
  mongoose.models.CustomerOrder ||
  mongoose.model("CustomerOrder", CustomerOrderSchema);

export default CustomerOrder;
