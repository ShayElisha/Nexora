// routes/events.routes.js
import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/events.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
const router = express.Router();

router.use(protectRoute);
router.post("/", createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;
