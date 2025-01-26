// Import dependencies
import express from "express";
import {
  createPendingUpdate,
  getAllPendingUpdates,
  getPendingUpdateById,
  updatePendingUpdateStatus,
  deletePendingUpdate,
} from "../controllers/UpdateProcurement.controller.js";

const router = express.Router();

// Routes for pending updates
router.post("/", createPendingUpdate); // Create a new pending update
router.get("/", getAllPendingUpdates); // Get all pending updates
router.get("/by/:purchaseOrder", getPendingUpdateById);
router.put("/:id/status", updatePendingUpdateStatus); // Approve or reject a pending update
router.delete("/:id", deletePendingUpdate); // Delete a pending update

export default router;
