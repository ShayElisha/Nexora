import express from "express";
import {
  createSalesOpportunity,
  getAllSalesOpportunities,
  getSalesPipeline,
  updateSalesOpportunity,
  deleteSalesOpportunity,
} from "../controllers/sales.controller.js";

const router = express.Router();

router.post("/opportunities", createSalesOpportunity);
router.get("/opportunities", getAllSalesOpportunities);
router.get("/pipeline", getSalesPipeline);
router.put("/opportunities/:id", updateSalesOpportunity);
router.delete("/opportunities/:id", deleteSalesOpportunity);

export default router;

