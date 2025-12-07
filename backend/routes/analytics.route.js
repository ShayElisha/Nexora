import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import * as analyticsController from "../controllers/analytics.controller.js";
import { cache } from "../middleware/cache.js";

const router = express.Router();

// כל ה-routes דורשים אימות
router.use(protectRoute);

/**
 * @route   GET /api/analytics/revenue-vs-expenses
 * @desc    גרפים של הכנסות vs הוצאות לפי חודש/שנה
 * @access  Private
 */
router.get(
  "/revenue-vs-expenses",
  cache(300), // cache ל-5 דקות
  analyticsController.getRevenueVsExpenses
);

/**
 * @route   GET /api/analytics/sales-trends
 * @desc    מגמות מכירות לאורך זמן
 * @access  Private
 */
router.get(
  "/sales-trends",
  cache(300),
  analyticsController.getSalesTrends
);

/**
 * @route   GET /api/analytics/profitability
 * @desc    ניתוח רווחיות לפי מוצר/לקוח
 * @access  Private
 */
router.get(
  "/profitability",
  cache(300),
  analyticsController.getProfitabilityAnalysis
);

/**
 * @route   GET /api/analytics/kpis
 * @desc    KPIs מרכזיים מתקדמים
 * @access  Private
 */
router.get(
  "/kpis",
  cache(180), // cache ל-3 דקות
  analyticsController.getAdvancedKPIs
);

/**
 * @route   GET /api/analytics/predictions
 * @desc    תחזיות AI לחודש הבא
 * @access  Private
 */
router.get(
  "/predictions",
  cache(600), // cache ל-10 דקות
  analyticsController.getAIPredictions
);

export default router;

