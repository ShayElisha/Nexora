import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  signUp,
  switchCompany,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Sign up route (for admins)
router.post("/signup", upload.single("profileImage"), signUp);
// Login route
router.post("/login", login);

// Logout route
router.post("/logout", logout);

// Get current user (protected)
router.get("/me", protectRoute, getCurrentUser);
router.get("/switch", switchCompany);

export default router;
