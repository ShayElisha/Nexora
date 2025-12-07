import express from "express";
import chatController from "../controllers/chat.Controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// ראוט לצ'אט
router.post("/", protectRoute, chatController.handleChat);

export default router;
