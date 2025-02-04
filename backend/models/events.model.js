import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    // מזהה החברה שאליה האירוע שייך
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    // כותרת האירוע
    title: {
      type: String,
      required: [true, "Event title is required"],
    },
    // תיאור מפורט של האירוע
    description: {
      type: String,
      required: false,
    },
    // תאריך התחלת האירוע
    startDate: {
      type: Date,
      required: [true, "Event start date is required"],
    },
    endDate: {
      type: Date,
      required: false,
    },
    startTime: {
      type: String,
      required: false,
    },
    // שעת סיום (לדוגמה: "17:00")
    endTime: {
      type: String,
      required: false,
    },
    // האם האירוע מתרחש לאורך כל היום
    allDay: {
      type: Boolean,
      default: false,
    },
    // מיקום האירוע (כתובת, חדר, אולם או אפילו קישור לפגישה וירטואלית)
    location: {
      type: String,
      required: false,
    },
    // קישור לפגישה וירטואלית, במידה וקיים
    meetingUrl: {
      type: String,
      required: false,
    },
    // סוג האירוע – לדוגמה: ישיבה, חופשה, תזכורת, וכו'
    eventType: {
      type: String,
      enum: ["meeting", "holiday", "reminder", "other"],
      default: "other",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    externalParticipants: [
      {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
      },
    ],
    // אפשרות להגדיר חזרה מחזורית של האירוע (לדוגמה: daily, weekly, monthly, yearly)
    recurrence: {
      type: String,
      required: false,
    },
    // קבצים מצורפים לאירוע (כגון מסמכים או מצגות)
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    dayReminderSent: {
      type: Boolean,
      default: false,
    },
    twoHoursReminderSent: {
      type: Boolean,
      default: false,
    },
    // מי יצר את האירוע (יכול להיות עובד או מנהל)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // הערות נוספות לאירוע
    notes: {
      type: String,
      required: false,
    },
  },
  {
    // יצירת שדות timestamps (createdAt, updatedAt) באופן אוטומטי
    timestamps: true,
  }
);

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;
