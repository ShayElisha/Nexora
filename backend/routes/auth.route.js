import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  refreshToken,
  signUp,
  switchCompany,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authRateLimiter, strictRateLimiter } from "../middleware/rateLimiter.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Sign up route (for admins) - with rate limiting
router.post("/signup", authRateLimiter, upload.single("profileImage"), signUp);
// Login route - with rate limiting
router.post("/login", authRateLimiter, login);
// Refresh token route
router.post("/refresh", refreshToken);
// Password reset routes - with strict rate limiting
router.post("/forgot-password", strictRateLimiter, requestPasswordReset);
router.post("/reset-password", strictRateLimiter, resetPassword);

// Logout route
router.post("/logout", logout);

// Get current user (protected)
router.get("/me", protectRoute, getCurrentUser);
router.get("/switch", switchCompany);

export default router;
