import mongoose from "mongoose";

const courseEnrollmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    enrollmentType: {
      type: String,
      enum: ["self", "assigned", "required"],
      default: "self",
    },
    status: {
      type: String,
      enum: ["enrolled", "in_progress", "completed", "dropped", "failed"],
      default: "enrolled",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startedAt: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    lessonsCompleted: [
      {
        moduleId: String,
        lessonId: String,
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    assessment: {
      taken: {
        type: Boolean,
        default: false,
      },
      score: Number,
      maxScore: Number,
      passed: Boolean,
      takenAt: Date,
      answers: [
        {
          questionId: String,
          answer: mongoose.Schema.Types.Mixed,
          isCorrect: Boolean,
          points: Number,
        },
      ],
    },
    certificate: {
      issued: {
        type: Boolean,
        default: false,
      },
      issuedAt: Date,
      certificateUrl: String,
    },
    notes: String,
  },
  { timestamps: true }
);

// Indexes
courseEnrollmentSchema.index({ companyId: 1, employeeId: 1 });
courseEnrollmentSchema.index({ courseId: 1, status: 1 });
courseEnrollmentSchema.index({ employeeId: 1, status: 1 });

// Ensure unique enrollment per employee per course
courseEnrollmentSchema.index({ courseId: 1, employeeId: 1 }, { unique: true });

const CourseEnrollment = mongoose.model("CourseEnrollment", courseEnrollmentSchema);

export default CourseEnrollment;

