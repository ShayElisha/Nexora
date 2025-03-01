import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    // סיווג הלקוח
    status: {
      type: String,
      enum: ["Active", "Inactive", "Prospect"],
      default: "Prospect",
    },
    customerType: {
      type: String,
      enum: ["Individual", "Corporate"],
      default: "Corporate",
    },
    // פרטים אישיים (רלוונטיים לעסקים פרטיים)
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    // פרטי קשר נוספים
    preferredContactMethod: {
      type: String,
      enum: ["Email", "Phone", "Mail"],
    },
    lastContacted: {
      type: Date,
    },
    customerSince: {
      type: Date,
      default: Date.now,
    },
    // אנשי קשר – אם הלקוח כולל מספר אנשי קשר (לדוגמה, בחברות)
    contacts: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        position: {
          type: String,
          trim: true,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        phone: {
          type: String,
          trim: true,
        },
      },
    ],
    // הערות נוספות
    notes: {
      type: String,
      trim: true,
    },
    // פרטים על מי יצר/עדכן את הרישום (ניתן להרחיב לפי הצורך)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // מוסיף createdAt ו-updatedAt
  }
);

const Customer = mongoose.model("Customer", CustomerSchema);
export default Customer;
