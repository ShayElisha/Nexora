import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    // סוג הפעילות
    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "Note", "Task", "SMS", "Other"],
      required: true,
    },
    // נושא הפעילות
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    // תיאור מפורט
    description: {
      type: String,
      trim: true,
    },
    // קישור לליד או לקוח
    relatedTo: {
      type: {
        type: String,
        enum: ["Lead", "Customer"],
        required: true,
      },
      leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    },
    // תאריך ושעה
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // משך זמן (לשיחות/פגישות)
    duration: {
      type: Number, // בדקות
      default: 0,
    },
    // תוצאה/מצב
    outcome: {
      type: String,
      enum: [
        "Successful",
        "No Answer",
        "Busy",
        "Left Message",
        "Follow Up Required",
        "Not Interested",
        "Completed",
        "Cancelled",
        "Other",
      ],
    },
    // פעולה הבאה
    nextAction: {
      type: String,
      trim: true,
    },
    // תאריך מעקב הבא
    nextFollowUp: {
      type: Date,
    },
    // מי ביצע את הפעילות
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // קבצים מצורפים
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // פרטים נוספים לפי סוג
    details: {
      // לשיחות
      callDirection: {
        type: String,
        enum: ["Inbound", "Outbound"],
      },
      phoneNumber: {
        type: String,
      },
      // לאימיילים
      emailTo: {
        type: String,
      },
      emailCc: {
        type: String,
      },
      emailBcc: {
        type: String,
      },
      // לפגישות
      meetingLocation: {
        type: String,
      },
      meetingType: {
        type: String,
        enum: ["In Person", "Video Call", "Phone Call"],
      },
      // למשימות
      taskPriority: {
        type: String,
        enum: ["Low", "Medium", "High", "Urgent"],
      },
      taskDueDate: {
        type: Date,
      },
      taskCompleted: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
activitySchema.index({ companyId: 1, date: -1 });
activitySchema.index({ "relatedTo.leadId": 1 });
activitySchema.index({ "relatedTo.customerId": 1 });
activitySchema.index({ performedBy: 1, date: -1 });
activitySchema.index({ type: 1, date: -1 });

const Activity =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);
export default Activity;

