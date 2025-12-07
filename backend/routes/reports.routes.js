import express from "express";
import { 
  getSuperUnifiedReport,
  getDashboardOverview,
  getFinanceReport,
  getHRReport,
  getSalesReport
} from "../controllers/reports.controller.js";

const router = express.Router();

// ===== נתיבים לדוחות מקיפים =====

// נתיב מקיף - מחזיר את כל הנתונים מכל המודלים
// מומלץ לשימוש בדפי דוחות מפורטים
// תומך ב-query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/super-unified-report", getSuperUnifiedReport);

// ===== נתיבים לדוחות ספציפיים =====

// Dashboard Overview - סיכום מהיר למסך הבית
// מחזיר רק KPIs ומידע קריטי
// אין צורך ב-query params
router.get("/dashboard-overview", getDashboardOverview);

// Finance Report - דוח פיננסי מפורט
// כולל: תזרים מזומנים, מגמות, פילוח קטגוריות, השוואה לתקציב
// תומך ב-query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/finance", getFinanceReport);

// HR Report - דוח משאבי אנוש
// כולל: סיכום עובדים, פילוח מחלקות, ביצועים, ביקורות אחרונות
// אין צורך ב-query params
router.get("/hr", getHRReport);

// Sales Report - דוח מכירות
// כולל: סיכום מכירות, מובילים (לקוחות ומוצרים), מגמות, הכנסות לפי קטגוריה
// תומך ב-query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/sales", getSalesReport);

export default router;
