import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema(
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [String],
    responsibilities: [String],
    location: {
      type: String,
      required: false,
    },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "temporary"],
      default: "full_time",
    },
    salaryRange: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "draft",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    closingDate: {
      type: Date,
      required: false,
    },
    numberOfPositions: {
      type: Number,
      default: 1,
    },
    experienceRequired: {
      type: String,
      enum: ["entry", "mid", "senior", "executive"],
    },
    skills: [String],
    benefits: [String],
    applicationDeadline: {
      type: Date,
      required: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  { timestamps: true }
);

// Indexes
jobPostingSchema.index({ companyId: 1, status: 1 });
jobPostingSchema.index({ department: 1 });

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);

export default JobPosting;

