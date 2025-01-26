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
    gender:{
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
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
      required: true,
      enum: ["Admin", "Manager", "Employee"],
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
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
