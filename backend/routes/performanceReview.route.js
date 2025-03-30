import { Router } from "express";
import {
  createPerformanceReview,
  getAllPerformanceReviews,
  getPerformanceReviewById,
  updatePerformanceReview,
  deletePerformanceReview,
  submitReviewAnswers,
} from "../controllers/performanceReview.controller.js";

const router = Router();

router.post("/", createPerformanceReview);
router.get("/", getAllPerformanceReviews);
router.get("/:id", getPerformanceReviewById);
router.put("/:id", updatePerformanceReview);
router.delete("/:id", deletePerformanceReview);
router.put("/:id/reviewers", submitReviewAnswers);

export default router;
