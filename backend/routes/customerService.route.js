import express from "express";
import {
  createServiceTicket,
  getAllServiceTickets,
  updateServiceTicket,
} from "../controllers/customerService.controller.js";

const router = express.Router();

router.post("/tickets", createServiceTicket);
router.get("/tickets", getAllServiceTickets);
router.put("/tickets/:id", updateServiceTicket);

export default router;

