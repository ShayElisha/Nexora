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
router.post(
  "/signup",
  upload.single("profileImage"),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    console.log("Uploaded file info:", req.file);
    next();
  },
  signUp
);
// Login route
router.post("/login", login);

// Logout route
router.post("/logout", logout);

// Get current user (protected)
router.get("/me", protectRoute, getCurrentUser);
router.get("/switch", switchCompany);

export default router;
