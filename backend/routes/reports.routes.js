import express from "express";
import {
  // דוחות בסיסיים
  getBudgetSummaryReport,
  getFinanceSummaryReport,
  getTaskSummaryReport,
  getProcurementSummaryReport,
  getUpcomingEventsReport,
  getLowStockReport,
  getBudgetReportByDepartment,
  getSupplierReport,
  getSignatureReport,
  getManagerDashboardReport,
  getDetailedBudgetReportByProject,
  getDetailedFinanceReport,
  getDetailedTaskReport,
  getProcurementReportBySupplier,
  getEventReportByType,
  getInventoryReorderReport,
  getEmployeePerformanceReport,
  getSupplierPerformanceReport,
} from "../controllers/reports.controller.js";

const router = express.Router();

/*
  נתיבים לדוחות בסיסיים
*/
// דוח סיכום תקציבים
router.get("/budget-summary", getBudgetSummaryReport);

// דוח פיננסי – פילוח עסקאות לפי סוג
router.get("/finance-summary", getFinanceSummaryReport);

// דוח משימות – ספירה לפי סטטוס
router.get("/task-summary", getTaskSummaryReport);

// דוח רכש – פילוח לפי סטטוס וריכוז עלויות
router.get("/procurement-summary", getProcurementSummaryReport);

// דוח אירועים – שליפת אירועים קרובים (7 ימים)
router.get("/upcoming-events", getUpcomingEventsReport);

// דוח מלאי – פריטים במלאי מתחת לרמה מינימלית
router.get("/low-stock", getLowStockReport);

// דוח תקציבים לפי מחלקה (departmentId כ-query parameter)
router.get("/budget-by-department", getBudgetReportByDepartment);

// דוח ספקים – שליפת כל הספקים ושדות נבחרים
router.get("/suppliers", getSupplierReport);

// דוח חתימות – סטטוס חתימות
router.get("/signatures", getSignatureReport);

// דוח לוח בקרה כללי למנהל
router.get("/dashboard", getManagerDashboardReport);

/*
  נתיבים לדוחות מפורטים
*/
// דוח תקציבים מפורט לפי פרויקט
router.get("/budget-by-project", getDetailedBudgetReportByProject);

// דוח פיננסי מפורט – רשימת כל העסקאות (ניתן להוסיף סינונים)
router.get("/detailed-finance", getDetailedFinanceReport);

// דוח משימות מפורט – כולל סינון לפי תאריך יעד או סטטוס
router.get("/detailed-task", getDetailedTaskReport);

// דוח רכש מפורט – לפי ספק
router.get("/procurement-by-supplier", getProcurementReportBySupplier);

// דוח אירועים מפורט – לפי סוג אירוע
router.get("/event-by-type", getEventReportByType);

// דוח מלאי – דוח חיזוי הזמנות מחדש (Reorder Report)
router.get("/inventory-reorder", getInventoryReorderReport);

// דוח ביצועי עובדים – נתונים עבור עובד ספציפי
router.get("/employee-performance", getEmployeePerformanceReport);

// דוח ביצועי ספקים – סיכום הזמנות לפי ספק, זמן אספקה וכו'
router.get("/supplier-performance", getSupplierPerformanceReport);

export default router;
