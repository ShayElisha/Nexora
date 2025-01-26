import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    customerType: {
      type: String,
      enum: ["Business", "Private", "Public"],
      required: true,
    },
    industry: {
      type: String,
      required: false,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    LastContactDate: {
      type: Date,
      required: false,
    },
    Status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active",
    },
    Notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
