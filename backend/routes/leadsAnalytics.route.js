import express from "express";
import {
  getConversionFunnel,
  getPipelineVelocity,
  getRevenueForecast,
  getSourcePerformance,
  getWinLossAnalysis,
} from "../controllers/leadsAnalytics.controller.js";

const router = express.Router();

router.get("/conversion-funnel", getConversionFunnel);
router.get("/pipeline-velocity", getPipelineVelocity);
router.get("/revenue-forecast", getRevenueForecast);
router.get("/source-performance", getSourcePerformance);
router.get("/win-loss-analysis", getWinLossAnalysis);

export default router;

