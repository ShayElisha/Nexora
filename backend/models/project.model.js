import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  text: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const ProjectSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Project manager is required"],
    },
    // שם הפרויקט
    name: {
      type: String,
      required: true,
    },

    // תיאור הפרויקט
    description: {
      type: String,
    },

    // תאריך התחלה וסיום
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },

    // סטטוס הפרויקט
    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold", "Cancelled"],
      default: "On Hold",
    },

    // מחלקה (Department) האחראית לפרויקט
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    // חברי הצוות (משתמשים)
    teamMembers: [
      {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      },
    ],

    // תקציב הפרויקט
    budget: {
      type: Number,
      default: 0,
    },

    // עדיפות
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // משימות בפרויקט
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task", // נניח שיש לך מודל Task
      },
    ],

    // מסמכים/קבצים הקשורים לפרויקט
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document", // לדוגמה מודל Document
      },
    ],

    // מערך תגיות (strings) לסיווג הפרויקט
    tags: [
      {
        type: String,
      },
    ],

    // מערך הערות/תגובות על הפרויקט (CommentSchema)
    comments: [CommentSchema],

    // התקדמות הפרויקט באחוזים (0-100)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true, // מוסיף createdAt ו-updatedAt אוטומטית
  }
);

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
