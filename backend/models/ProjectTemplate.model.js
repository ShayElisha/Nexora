import mongoose from "mongoose";

const ProjectTemplateSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["Development", "Marketing", "Operations", "HR", "Finance", "Other"],
      default: "Other",
    },
    // תבנית משימות
    tasks: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        estimatedHours: { type: Number, default: 0 },
        dependencies: [{ type: String }], // משימות תלויות
      },
    ],
    // משאבים מומלצים
    recommendedResources: [
      {
        role: { type: String }, // תפקיד נדרש
        quantity: { type: Number, default: 1 }, // כמות
        skills: [{ type: String }], // כישורים נדרשים
      },
    ],
    // לוח זמנים מומלץ
    estimatedDuration: {
      type: Number, // ימים
      default: 0,
    },
    // תקציב מומלץ
    estimatedBudget: {
      type: Number,
      default: 0,
    },
    // מחלקה מומלצת
    recommendedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    // תגיות
    tags: [{ type: String }],
    // סטטיסטיקות שימוש
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },
    // דירוג
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    // יצר את התבנית
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // האם התבנית ציבורית (לכל החברה) או פרטית
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// אינדקסים
ProjectTemplateSchema.index({ companyId: 1, category: 1 });
ProjectTemplateSchema.index({ companyId: 1, name: 1 });
ProjectTemplateSchema.index({ usageCount: -1 });

const ProjectTemplate = mongoose.model("ProjectTemplate", ProjectTemplateSchema);

export default ProjectTemplate;

