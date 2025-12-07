import Applicant from "../models/Applicant.model.js";
import JobPosting from "../models/JobPosting.model.js";
import Employee from "../models/employees.model.js";
import { uploadToCloudinary } from "../config/lib/cloudinary.js";
import jwt from "jsonwebtoken";

// Helper to get user from token
const getUserFromToken = (req) => {
  const token = req.cookies["auth_token"];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// ============ JOB POSTINGS ============

// Create job posting
export const createJobPosting = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const jobPosting = new JobPosting({
      ...req.body,
      companyId: user.companyId || req.body.companyId,
      postedBy: user.userId || user.id,
    });

    await jobPosting.save();
    res.status(201).json({ success: true, data: jobPosting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all job postings
export const getJobPostings = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { status, department, search } = req.query;
    const query = { companyId: user.companyId || req.query.companyId };

    if (status) query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const jobPostings = await JobPosting.find(query)
      .populate("department", "name")
      .populate("postedBy", "name lastName")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: jobPostings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get job posting by ID
export const getJobPostingById = async (req, res) => {
  try {
    const jobPosting = await JobPosting.findById(req.params.id)
      .populate("department", "name")
      .populate("postedBy", "name lastName");

    if (!jobPosting) {
      return res.status(404).json({ success: false, message: "Job posting not found" });
    }

    res.json({ success: true, data: jobPosting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update job posting
export const updateJobPosting = async (req, res) => {
  try {
    const jobPosting = await JobPosting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!jobPosting) {
      return res.status(404).json({ success: false, message: "Job posting not found" });
    }

    res.json({ success: true, data: jobPosting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete job posting
export const deleteJobPosting = async (req, res) => {
  try {
    const jobPosting = await JobPosting.findByIdAndDelete(req.params.id);

    if (!jobPosting) {
      return res.status(404).json({ success: false, message: "Job posting not found" });
    }

    res.json({ success: true, message: "Job posting deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ APPLICANTS ============

// Create applicant
export const createApplicant = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let resumeUrl = "";
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        resumeUrl = result.secure_url;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error uploading resume",
          error: error.message,
        });
      }
    }

    const applicant = new Applicant({
      ...req.body,
      companyId: user.companyId || req.body.companyId,
      resume: resumeUrl || req.body.resume,
    });

    await applicant.save();

    // Update job posting application count
    if (applicant.jobPostingId) {
      await JobPosting.findByIdAndUpdate(applicant.jobPostingId, {
        $inc: { applicationsCount: 1 },
      });
    }

    res.status(201).json({ success: true, data: applicant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all applicants
export const getApplicants = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { status, stage, jobPostingId, search } = req.query;
    const query = { companyId: user.companyId || req.query.companyId };

    if (status) query.status = status;
    if (stage) query.stage = stage;
    if (jobPostingId) query.jobPostingId = jobPostingId;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const applicants = await Applicant.find(query)
      .populate("jobPostingId", "title")
      .populate("referredBy", "name lastName")
      .populate("interviews.interviewer", "name lastName")
      .sort({ applicationDate: -1 });

    res.json({ success: true, data: applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get applicant by ID
export const getApplicantById = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id)
      .populate("jobPostingId", "title description")
      .populate("referredBy", "name lastName email")
      .populate("interviews.interviewer", "name lastName email")
      .populate("notes.addedBy", "name lastName");

    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update applicant
export const updateApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add note to applicant
export const addApplicantNote = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    applicant.notes.push({
      note: req.body.note,
      addedBy: user.userId || user.id,
    });

    await applicant.save();
    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Schedule interview
export const scheduleInterview = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    applicant.interviews.push({
      ...req.body,
      interviewer: req.body.interviewer || user.userId || user.id,
    });

    applicant.status = "interview_scheduled";
    applicant.stage = req.body.type === "final_interview" ? "final_interview" : applicant.stage;

    await applicant.save();
    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update interview
export const updateInterview = async (req, res) => {
  try {
    const { applicantId, interviewId } = req.params;

    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    const interview = applicant.interviews.id(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    Object.assign(interview, req.body);
    await applicant.save();

    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete applicant
export const deleteApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndDelete(req.params.id);

    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    // Update job posting application count
    if (applicant.jobPostingId) {
      await JobPosting.findByIdAndUpdate(applicant.jobPostingId, {
        $inc: { applicationsCount: -1 },
      });
    }

    res.json({ success: true, message: "Applicant deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get ATS statistics
export const getATSStatistics = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = user.companyId || req.query.companyId;

    const [
      totalApplicants,
      byStatus,
      byStage,
      recentApplications,
      topSources,
    ] = await Promise.all([
      Applicant.countDocuments({ companyId }),
      Applicant.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Applicant.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$stage", count: { $sum: 1 } } },
      ]),
      Applicant.find({ companyId })
        .sort({ applicationDate: -1 })
        .limit(10)
        .select("firstName lastName email status applicationDate"),
      Applicant.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalApplicants,
        byStatus,
        byStage,
        recentApplications,
        topSources,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

