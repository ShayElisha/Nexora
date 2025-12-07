import express from "express";
import {
  createJobPosting,
  getJobPostings,
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
  createApplicant,
  getApplicants,
  getApplicantById,
  updateApplicant,
  addApplicantNote,
  scheduleInterview,
  updateInterview,
  deleteApplicant,
  getATSStatistics,
} from "../controllers/ats.controller.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Job Posting routes
router.post("/job-postings", createJobPosting);
router.get("/job-postings", getJobPostings);
router.get("/job-postings/:id", getJobPostingById);
router.put("/job-postings/:id", updateJobPosting);
router.delete("/job-postings/:id", deleteJobPosting);

// Applicant routes
router.post("/applicants", upload.single("resume"), createApplicant);
router.get("/applicants", getApplicants);
router.get("/applicants/:id", getApplicantById);
router.put("/applicants/:id", updateApplicant);
router.delete("/applicants/:id", deleteApplicant);

// Applicant notes
router.post("/applicants/:id/notes", addApplicantNote);

// Interview routes
router.post("/applicants/:id/interviews", scheduleInterview);
router.put("/applicants/:applicantId/interviews/:interviewId", updateInterview);

// Statistics
router.get("/statistics", getATSStatistics);

export default router;

