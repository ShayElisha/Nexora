import mongoose from "mongoose";

// סכמה של ביקורת ביצועים ממוקדת שאלות
const performanceReviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    // שאלות הביקורת
    questions: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          minlength: 5,
          maxlength: 300,
        },
        category: {
          type: String,
          enum: ["Skills", "Performance", "Teamwork", "Other"],
          default: "Other",
        },
        responseType: {
          type: String,
          enum: ["rating", "text"],
          required: true,
        },
        maxRating: {
          type: Number,
          min: 1,
          max: 10,
          default: 5,
          required: function () {
            return this.responseType === "rating";
          },
        },
      },
    ],
    // תשובות הביקורת
    responses: [
      {
        reviewerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        answers: [
          {
            questionId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            value: {
              type: mongoose.Schema.Types.Mixed, // טקסט או מספר
              required: true,
            },
          },
        ],
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// יצירת המודל
const PerformanceReview = mongoose.model(
  "PerformanceReview",
  performanceReviewSchema
);

export default PerformanceReview;
