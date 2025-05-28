import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    identity: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    profileImage: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      required: false,
      enum: ["Admin", "Manager", "Employee", ""],
    },
    phone: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
      unique: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    projects: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
        role: { type: String, enum: ["Leader", "Contributor"] },
      },
    ],
    benefits: {
      type: Array, // Example: ["Health Insurance", "401k"]
    },
    performanceReviews: [
      {
        reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
        score: { type: Number },
      },
    ],
    attendance: [
      {
        date: { type: Date },
        status: { type: String, enum: ["Present", "Absent", "On Leave"] },
      },
    ],
    address: {
      city: { type: String, required: true },
      street: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "deleted"],
    },
    lastLogin: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    hourlySalary: {
      type: Number,
      min: 0,
      required: false, // Only required if paymentType is "Hourly"
    },
    globalSalary: {
      type: Number,
      min: 0,
      required: false, // Only required if paymentType is "Global"
    },
    expectedHours: {
      type: Number,
      min: 0,
      required: false, // Only required if paymentType is "Global"
    },
    paymentType: {
      type: String,
      enum: ["Hourly", "Global", "Commission-Based"],
      default: "Global", // Default to Global for existing employees
      required: true,
    },

    vacationBalance: {
      type: Number,
      default: 0, // יתרת ימי חופשה
      min: 0,
    },
    vacationHistory: [
      {
        month: { type: String }, // פורמט: MM/YYYY
        daysAdded: { type: Number },
        newBalance: { type: Number },
        country: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sickBalance: {
      type: Number,
      default: 0, // יתרת ימי חופשה
      min: 0,
    },
    sickHistory: [
      {
        month: { type: String }, // פורמט: MM/YYYY
        daysAdded: { type: Number },
        newBalance: { type: Number },
        country: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    bankDetails: {
      accountNumber: { type: String },
      bankNumber: { type: String },
      branchCode: { type: String },
    },
  },

  { timestamps: true }
);

// Validation to ensure salary fields are provided based on paymentType
employeeSchema.pre("save", function (next) {
  if (this.paymentType === "Hourly") {
    if (this.hourlySalary == null || this.hourlySalary < 0) {
      return next(
        new Error(
          "hourlySalary is required and must be non-negative for Hourly payment type"
        )
      );
    }
    // Clear globalSalary and expectedHours for Hourly
    this.globalSalary = null;
    this.expectedHours = null;
  } else if (this.paymentType === "Global") {
    if (this.globalSalary == null || this.globalSalary < 0) {
      return next(
        new Error(
          "globalSalary is required and must be non-negative for Global payment type"
        )
      );
    }
    if (this.expectedHours == null || this.expectedHours < 0) {
      return next(
        new Error(
          "expectedHours is required and must be non-negative for Global payment type"
        )
      );
    }
    // Clear hourlySalary for Global
    this.hourlySalary = null;
  } else if (this.paymentType === "Commission-Based") {
    // Clear all salary fields for Commission-Based
    this.hourlySalary = null;
    this.globalSalary = null;
    this.expectedHours = null;
  }
  next();
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
