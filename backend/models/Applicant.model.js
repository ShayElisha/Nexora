import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    jobPostingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: false,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    resume: {
      type: String, // URL to resume file
      default: "",
    },
    coverLetter: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "applied",
        "screening",
        "interview_scheduled",
        "interviewed",
        "offer_extended",
        "offer_accepted",
        "offer_declined",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
    },
    stage: {
      type: String,
      enum: [
        "application",
        "phone_screen",
        "technical_interview",
        "final_interview",
        "offer",
        "hired",
      ],
      default: "application",
    },
    source: {
      type: String,
      enum: [
        "website",
        "job_board",
        "referral",
        "social_media",
        "recruitment_agency",
        "other",
      ],
      default: "website",
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    notes: [
      {
        note: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    interviews: [
      {
        type: {
          type: String,
          enum: ["phone", "video", "in_person", "technical", "final"],
        },
        scheduledAt: Date,
        interviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        location: String,
        notes: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        status: {
          type: String,
          enum: ["scheduled", "completed", "cancelled", "no_show"],
          default: "scheduled",
        },
      },
    ],
    skills: [String],
    experience: {
      years: Number,
      description: String,
    },
    education: [
      {
        degree: String,
        institution: String,
        field: String,
        graduationYear: Number,
      },
    ],
    salaryExpectation: {
      type: Number,
      required: false,
    },
    availability: {
      type: String,
      enum: ["immediate", "2_weeks", "1_month", "2_months", "3_months", "other"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    tags: [String],
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    hiredDate: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
applicantSchema.index({ companyId: 1, status: 1 });
applicantSchema.index({ companyId: 1, jobPostingId: 1 });
applicantSchema.index({ email: 1 });

const Applicant = mongoose.model("Applicant", applicantSchema);

export default Applicant;

