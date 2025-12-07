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
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    departmentManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    teamMembers: [
      {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      },
    ],
    projects: [
      {
        _id: false, // מבטל יצירת _id עבור כל מסמך משנה
        projectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
          // אפשר להוסיף גם required: true אם רוצים שחובה לספק ערך
        },
      },
    ],
    budgets: [
      {
        budgetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Budget",
        },
      },
    ],
    // לידים קשורים למחלקה
    leadIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],
  },
  {
    timestamps: true,
  }
);

DepartmentSchema.index({ companyId: 1, name: 1 }, { unique: true });

const Department =
  mongoose.models.Department || mongoose.model("Department", DepartmentSchema);

export default Department;
