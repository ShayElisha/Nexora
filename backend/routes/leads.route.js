import express from "express";
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  convertLeadToCustomer,
  getLeadsStatistics,
  createOrderFromLeadManually,
} from "../controllers/leads.controller.js";

const router = express.Router();

router.post("/", createLead);
router.get("/statistics", getLeadsStatistics);
router.get("/", getAllLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);
router.post("/:id/convert", convertLeadToCustomer);
router.post("/:id/create-order", createOrderFromLeadManually);

export default router;

