import PerformanceReview from "../models/performanceReview.model.js"; // Adjust path as needed
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Create a new performance review
export const createPerformanceReview = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const createdBy = decodedToken.employeeId;
    const {
      employeeIds, // שונה מ-employeeId למערך
      title,
      deadline,
      status,
      questions,
    } = req.body;

    if (
      !employeeIds ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "At least one employeeId is required" });
    }

    // צור טופס נפרד לכל עובד
    const newReviews = employeeIds.map((employeeId) => ({
      companyId,
      employeeId,
      title,
      deadline,
      status,
      questions,
      responses: [],
      createdBy,
    }));

    // שמור את כל הטפסים בבת אחת
    const savedReviews = await PerformanceReview.insertMany(newReviews);

    res.status(201).json(savedReviews);
  } catch (error) {
    console.error("Error in createPerformanceReview:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get all performance reviews
export const getAllPerformanceReviews = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find()
      .populate("companyId", "name")
      .populate("employeeId", "name lastName role")
      .populate("responses.reviewerId", "name lastName role"); // Updated to populate reviewerId
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific performance review by ID
export const getPerformanceReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const review = await PerformanceReview.findById(id)
      .populate("companyId", "name")
      .populate("employeeId", "firstName lastName")
      .populate("responses.reviewerId", "firstName lastName"); // Updated to populate reviewerId

    if (!review) {
      return res.status(404).json({ message: "Performance review not found" });
    }

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a performance review
export const updatePerformanceReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    const updatedReview = await PerformanceReview.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("companyId", "name")
      .populate("employeeId", "firstName lastName")
      .populate("responses.reviewerId", "firstName lastName"); // Updated to populate reviewerId

    if (!updatedReview) {
      return res.status(404).json({ message: "Performance review not found" });
    }

    res.status(200).json(updatedReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a performance review
export const deletePerformanceReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deletedReview = await PerformanceReview.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ message: "Performance review not found" });
    }

    res
      .status(200)
      .json({ message: "Performance review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit answers for a performance review (replacing updateReviewerStatus)
export const submitReviewAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const reviewerId = decodedToken.employeeId;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be an array" });
    }

    const review = await PerformanceReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Performance review not found" });
    }

    const questionIds = review.questions.map((q) => q._id.toString());
    const invalidAnswers = answers.filter(
      (a) => !questionIds.includes(a.questionId.toString())
    );
    if (invalidAnswers.length > 0) {
      console.log("Invalid answers:", invalidAnswers);
      return res
        .status(400)
        .json({ message: "Some answers reference invalid questions" });
    }

    const existingResponseIndex = review.responses.findIndex(
      (r) => r.reviewerId.toString() === reviewerId
    );

    if (existingResponseIndex !== -1) {
      review.responses[existingResponseIndex].answers = answers;
      review.responses[existingResponseIndex].submittedAt = Date.now();
    } else {
      review.responses.push({
        reviewerId,
        answers,
        submittedAt: Date.now(),
      });
    }

    review.status = review.responses.length > 0 ? "In Progress" : "Pending";
    const allQuestionsAnswered = review.responses.every(
      (r) => r.answers.length === review.questions.length
    );
    if (allQuestionsAnswered && review.responses.length > 0) {
      review.status = "Completed";
    }

    // שמור את השינויים
    await review.save();

    // בצע populate על האובייקט המעודכן
    const updatedReview = await PerformanceReview.findById(id)
      .populate("companyId", "name")
      .populate("employeeId", "firstName lastName")
      .populate("responses.reviewerId", "firstName lastName");

    res.status(200).json(updatedReview);
  } catch (error) {
    console.error("Error in submitReviewAnswers:", error);
    res.status(400).json({ message: error.message });
  }
};
