import mongoose from "mongoose";

const ProjectRiskSchema = new mongoose.Schema(
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
    title: {
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
      enum: [
        "Technical",
        "Financial",
        "Schedule",
        "Resource",
        "Quality",
        "External",
        "Other",
      ],
      default: "Other",
    },
    // הסתברות (Probability)
    probability: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    // השפעה (Impact)
    impact: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    // רמת סיכון מחושבת (Probability × Impact)
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    // סטטוס
    status: {
      type: String,
      enum: ["Open", "In Progress", "Mitigated", "Resolved", "Closed"],
      default: "Open",
    },
    // תוכנית התמודדות
    mitigationPlan: {
      type: String,
      default: "",
    },
    // פעולות מניעה
    preventiveActions: [
      {
        action: { type: String, required: true },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        dueDate: { type: Date },
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Completed"],
          default: "Pending",
        },
      },
    ],
    // בעלים (Owner)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    // תאריך זיהוי
    identifiedDate: {
      type: Date,
      default: Date.now,
    },
    // תאריך יעד לפתרון
    targetResolutionDate: {
      type: Date,
    },
    // תאריך פתרון בפועל
    actualResolutionDate: {
      type: Date,
    },
    // הערות והיסטוריה
    notes: [
      {
        text: { type: String, required: true },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // האם הסיכון התממש
    hasOccurred: {
      type: Boolean,
      default: false,
    },
    // תוצאות אם התממש
    actualImpact: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// חישוב רמת סיכון אוטומטי
ProjectRiskSchema.pre("save", function (next) {
  const probabilityMap = { Low: 1, Medium: 2, High: 3 };
  const impactMap = { Low: 1, Medium: 2, High: 3 };
  
  const riskScore = probabilityMap[this.probability] * impactMap[this.impact];
  
  if (riskScore <= 2) {
    this.riskLevel = "Low";
  } else if (riskScore <= 4) {
    this.riskLevel = "Medium";
  } else if (riskScore <= 6) {
    this.riskLevel = "High";
  } else {
    this.riskLevel = "Critical";
  }
  
  next();
});

// אינדקסים
ProjectRiskSchema.index({ companyId: 1, projectId: 1 });
ProjectRiskSchema.index({ companyId: 1, status: 1 });
ProjectRiskSchema.index({ companyId: 1, riskLevel: 1 });
ProjectRiskSchema.index({ projectId: 1, status: 1 });

const ProjectRisk = mongoose.model("ProjectRisk", ProjectRiskSchema);

export default ProjectRisk;

