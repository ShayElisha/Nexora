import express from "express";
import {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  addComment,
  getLeaveStatistics,
} from "../controllers/leave.controller.js";

const router = express.Router();

router.post("/", createLeaveRequest);
router.get("/", getLeaveRequests);
router.get("/:id", getLeaveRequestById);
router.put("/:id", updateLeaveRequest);
router.post("/:id/approve", approveLeaveRequest);
router.post("/:id/reject", rejectLeaveRequest);
router.post("/:id/cancel", cancelLeaveRequest);
router.post("/:id/comments", addComment);
router.get("/statistics/overview", getLeaveStatistics);

export default router;

