import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "in progress", "completed", "cancelled"],
      default: "pending",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      required: false,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    comments: [
      {
        text: {
          type: String,
          required: [true, "Comment text is required"],
        },
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // שדה בוליאני לאישור ביצוע המשימה
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    // יצירת שדות timestamps (createdAt, updatedAt) אוטומטית
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
