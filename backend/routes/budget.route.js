import { Router } from "express";
import {
  getBudgets,
  createBudget,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getPerformance,
  getBudgetsByProject,
  getBudgetsByDepartment,
  rejectBudget,
  approveBudget,
  addCategoryToBudget,
  updateCategoryAllocation,
  signBudget,
  assignToBudget,
  getBudgetByDepartments,
} from "../controllers/Budget.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = Router();

router.get("/by-department/:departmentId", getBudgetByDepartments);

// נתיב בסיסי לקבלת כל התקציבים ויצירתם
router.get("/", getBudgets);
router.post("/", createBudget);

// נתיבים ספציפיים לסינון לפי פרויקט ומחלקה
router.get("/byProject", getBudgetsByProject);
router.get("/byDepartment", getBudgetsByDepartment);

// נתיבים עבור פעולה על תקציב ספציפי לפי מזהה
router.get("/:id", getBudgetById);
router.put("/:id", protectRoute, updateBudget);
router.delete("/:id", deleteBudget);

// נתיב לקבלת ביצועים עבור תקציב מסוים
router.get("/:id/performance", getPerformance);

// נתיבים לאישור ודחייה של תקציב
router.post("/:id/reject", rejectBudget);
router.post("/:id/approve", approveBudget);

// נתיבים לניהול קטגוריות בתוך תקציב
router.post("/:id/categories", addCategoryToBudget);
router.put("/:id/categories", updateCategoryAllocation);
router.post("/:id/sign", protectRoute, signBudget);
router.post("/assign-to-budget", protectRoute, assignToBudget);

export default router;
