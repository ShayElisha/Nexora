// models/Department.model.js
import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Department =
  mongoose.models.Department || mongoose.model("Department", DepartmentSchema);

export default Department;
