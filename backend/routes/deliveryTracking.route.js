import express from "express";
import {
  createTracking,
  getTrackingByOrder,
  getAllTrackings,
  updateTrackingStatus,
  addTrackingUpdate,
  markAsDelivered,
  uploadDeliveryProof,
  getTrackingByNumber,
  getTrackingById,
} from "../controllers/DeliveryTracking.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route - no auth required
router.get("/public/:trackingNumber", getTrackingByNumber);

// Protected routes
router.post("/create", protectRoute, createTracking);
router.get("/order/:orderId/:orderType", protectRoute, getTrackingByOrder);
router.get("/all", protectRoute, getAllTrackings);
router.get("/:id", protectRoute, getTrackingById); // Must be before /:id/status
router.put("/:id/status", protectRoute, updateTrackingStatus);
router.post("/:id/update", protectRoute, addTrackingUpdate);
router.put("/:id/delivered", protectRoute, markAsDelivered);
router.post("/:id/proof", protectRoute, uploadDeliveryProof);

export default router;

