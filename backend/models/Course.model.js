import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    externalInstructor: {
      name: String,
      email: String,
      organization: String,
    },
    duration: {
      type: Number, // in hours
      required: true,
    },
    content: [
      {
        module: String,
        lessons: [
          {
            title: String,
            content: String,
            videoUrl: String,
            documentUrl: String,
            duration: Number, // in minutes
            order: Number,
          },
        ],
        order: Number,
      },
    ],
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    skills: [String],
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    enrollmentType: {
      type: String,
      enum: ["open", "assigned", "required"],
      default: "open",
    },
    maxEnrollments: {
      type: Number,
      required: false,
    },
    certificate: {
      enabled: {
        type: Boolean,
        default: false,
      },
      template: String,
    },
    assessment: {
      enabled: {
        type: Boolean,
        default: false,
      },
      passingScore: {
        type: Number,
        default: 70,
      },
      questions: [
        {
          question: String,
          type: {
            type: String,
            enum: ["multiple_choice", "true_false", "short_answer"],
          },
          options: [String],
          correctAnswer: mongoose.Schema.Types.Mixed,
          points: Number,
        },
      ],
    },
    completionCriteria: {
      type: String,
      enum: ["all_lessons", "assessment_passed", "both"],
      default: "all_lessons",
    },
    tags: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
courseSchema.index({ companyId: 1, status: 1 });
courseSchema.index({ category: 1 });

const Course = mongoose.model("Course", courseSchema);

export default Course;

