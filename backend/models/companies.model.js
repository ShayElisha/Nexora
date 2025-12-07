import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    // Core Company Information
    name: { type: String, required: [true, "Name is required"], unique: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      // email validation
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
    },
    website: {
      type: String,
      default: "",
      match: [
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
        "Please enter a valid website URL",
      ],
    },
    logo: { type: String, default: "" },

    // Address Information
    address: {
      street: { type: String, required: [true, "Street is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, default: "" },
      postalCode: {
        type: String,
        default: "",
        required: [true, "Postal Code is required"],
      },
      country: { type: String, required: [true, "Country is required"] },
    },

    // Company Status
    status: {
      type: String,
      enum: ["Active", "Pending", "Inactive"],
      default: "Pending",
    },

    // Subscription and Billing
    stripeCustomerId: { type: String },
    endDate: { type: Date },
    subscription: {
      plan: {
        type: String,
        enum: ["Basic", "Pro", "Enterprise", "Free"],
        default: "Free",
      },
      paymentStatus: {
        type: String,
        enum: [
          "Pending",
          "Paid",
          "Failed",
          "Pending Cancel",
          "Canceled",
          "Paused",
        ],
        default: "Pending",
      },
      subscriptionId: { type: String },
      lastPaymentAttempt: { type: Date },
      failedAttempts: { type: Number, default: 0 },
    },
    industry: {
      type: String,
      enum: [
        "Technology",
        "Retail",
        "Finance",
        "Healthcare",
        "Education",
        "Real Estate",
        "Manufacturing",
        "Hospitality",
        "Transportation",
        "Entertainment",
        "Energy",
        "Construction",
        "Agriculture",
        "Telecommunications",
        "Aerospace",
        "Nonprofit",
        "Consulting",
        "Government",
        "Fashion",
        "Food & Beverage",
        "Sports",
        "E-commerce",
        "Media",
        "Legal Services",
        "Software Development",
        "Hardware Development",
        "Biotechnology",
        "Pharmaceuticals",
        "Automotive",
        "Logistics",
        "Gaming",
        "Public Relations",
        "Event Management",
        "Advertising",
        "Tourism",
        "Mining",
        "Chemical Industry",
        "Art & Design",
        "Publishing",
        "Music & Performing Arts",
        "Environmental Services",
        "Security Services",
        "Research & Development",
        "Wholesale",
        "Human Resources",
        "Insurance",
        "Digital Marketing",
        "Data Analytics",
        "Waste Management",
        "Marine Industry",
        "Electronics",
        "Medical Devices",
        "Architecture",
        "Fitness & Wellness",
        "Agritech",
        "Fintech",
        "Edtech",
        "Healthtech",
        "Proptech",
        "SaaS",
        "Cybersecurity",
        "Nanotechnology",
        "Blockchain",
        "Artificial Intelligence",
        "Other",
      ],
      required: [true, "Industry is required"],
    },
    taxId: {
      type: String,
      required: [true, "Tax ID is required"],
      unique: true,
      match: [/^\d{9}$/, "Please enter a valid tax ID"],
    },

    // Employees
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    numberOfEmployees: { type: Number, default: 0 },

    // Compliance and Documents
    compliance: {
      isCompliant: { type: Boolean, default: true },
      documents: [
        {
          name: { type: String },
          url: { type: String }, // Link to document storage
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
    // Invoice Settings
    invoiceSettings: {
      // Invoice number prefix (e.g., "INV-2024-")
      invoiceNumberPrefix: {
        type: String,
        default: "INV",
        trim: true,
      },
      // Invoice number format pattern
      invoiceNumberFormat: {
        type: String,
        default: "YYYY-####", // Year followed by sequence number
        enum: ["YYYY-####", "YY-####", "####-YYYY", "PREFIX-YYYY-####"],
      },
      // Default currency for invoices
      defaultCurrency: {
        type: String,
        default: "USD",
        uppercase: true,
        match: /^[A-Z]{3}$/, // ISO 4217 currency code
      },
      // Base currency for the company
      baseCurrency: {
        type: String,
        default: "USD",
        uppercase: true,
        match: /^[A-Z]{3}$/,
      },
    },
    // Payroll Automation Settings
    payrollAutomationSettings: {
      enabled: { type: Boolean, default: false },
      calculationDate: { type: Number, default: 25, min: 1, max: 31 },
      approvalDate: { type: Number, default: 27, min: 1, max: 31 },
      paymentDate: { type: Number, default: 1, min: 1, max: 31 },
      autoApprove: { type: Boolean, default: false },
      autoSendPayslips: { type: Boolean, default: true },
      notificationDays: { type: Number, default: 3, min: 0, max: 7 },
      nextMonthApprovalDate: { type: Date }, // תאריך אישור ספציפי לחודש הבא
      defaultTaxConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "TaxConfig" }, // תצורת מס ברירת מחדש לאוטומציה
    },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);

export default Company;
