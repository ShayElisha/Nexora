// backend/routes/notification.route.js

import express from "express";
import {
  getAdminNotifications,
  checkPendingSignatures,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

// נתיבים קיימים
router.get("/check-pending-signatures", checkPendingSignatures);
router.get("/admin-notifications", getAdminNotifications);
router.post("/mark-as-read", markNotificationAsRead);
router.delete("/delete", deleteNotification);

export default router;
