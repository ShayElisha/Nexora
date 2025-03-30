import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// ייבוא כל המודלים
import Budget from "../models/Budget.model.js";
import Finance from "../models/finance.model.js";
import Task from "../models/tasks.model.js";
import Procurement from "../models/procurement.model.js";
import Event from "../models/events.model.js";
import Inventory from "../models/inventory.model.js";
import Suppliers from "../models/suppliers.model.js";
import Employee from "../models/employees.model.js";
import Customer from "../models/customers.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Department from "../models/department.model.js";
import PerformanceReview from "../models/performanceReview.model.js";
import Product from "../models/product.model.js";
import ProcurementProposal from "../models/ProcurementProposal.model.js";
import Project from "../models/project.model.js";
import ProductTree from "../models/productTree.model.js";
// במידת הצורך - אם יש עוד מודלים, לייבא אותם כאן

/**
 * פונקציית אימות טוקן בסיסית.
 * זורקת שגיאה אם הטוקן לא תקין או חסר.
 */
const verifyToken = (req) => {
  const token = req.cookies?.auth_token;
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
};

/**
 * getSuperUnifiedReport:
 * מביא קריאה *אחת* שמחזירה *כל* סוגי הדוחות/המידע שתרצה מכל המודלים.
 * ניתן להרחיב/לצמצם לפי הצורך.
 */
export const getSuperUnifiedReport = async (req, res) => {
  try {
    // אימות משתמש ע"י הטוקן
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    // ניתן לקבל תאריכים (startDate, endDate) לסינון דינמי - רק לדוחות שרלוונטי
    const { startDate, endDate } = req.query;

    // הגדרת פילטר בסיסי לחלק מהמקומות
    const generalFilter = { companyId };
    if (startDate && endDate) {
      // שים לב - בחלק מהמודלים השדה יכול להיות "createdAt"
      // ובחלק "transactionDate", "purchaseDate" וכו'
      // אפשר להתאים זאת ספציפית לכל מודל לפי הצורך
      generalFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // פילטר לדוגמה עבור Finance (כי שם לפעמים השדה הוא "transactionDate")
    const financeFilter = { companyId };
    if (startDate && endDate) {
      financeFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // הרצה במקביל של שליפות / אגרגציות (לפי מה שהצגת בקוד שלך)
    const [
      // 1. Budget Summary
      budgetSummary,
      // 2. Finance Summary
      financeSummary,
      // 3. Task Summary
      taskSummary,
      // 4. Procurement Summary
      procurementSummary,
      // 5. Upcoming Events
      upcomingEvents,
      // 6. Low Stock Inventory
      lowStockInventory,
      // 7. Supplier Data
      suppliers,
      // 8. Employees
      employees,
      // 9. Customer Summary
      customerSummary,
      // 10. Customer Order Summary
      customerOrderSummary,
      // 11. Department Summary
      departmentSummary,
      // 12. PerformanceReview (למשל, נחזיר הכל או סיכום)
      performanceReviews,
      // 13. Product Summary
      products,
      // 14. Procurement Proposal Summary
      procurementProposals,
      // 15. Project Summary
      projects,
      // 16. ProductTree Summary
      productTrees,
      // 17. Task Overdue (דוגמה להחזרת רשימת משימות באיחור)
      overdueTasks,
      // 18. Inventory Expiration (מוצרים שקרובים לתאריך תפוגה)
      inventoryExpiration,
      // 19. וכו'... אפשר להמשיך עם כל הדוחות הרצויים
    ] = await Promise.all([
      // 1. Budget Summary
      Budget.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$status",
            totalBudget: { $sum: "$amount" },
            totalSpent: { $sum: "$spentAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Finance Summary
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: { type: "$transactionType", status: "$transactionStatus" },
            totalAmount: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // 3. Task Summary
      Task.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: { status: "$status", priority: "$priority" },
            count: { $sum: 1 },
            overdue: {
              $sum: { $cond: [{ $gt: ["$dueDate", new Date()] }, 0, 1] },
            },
          },
        },
      ]),

      // 4. Procurement Summary
      Procurement.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: { status: "$status", paymentStatus: "$paymentStatus" },
            totalCost: { $sum: "$totalCost" },
            count: { $sum: 1 },
          },
        },
      ]),

      // 5. Upcoming Events (7 ימים קדימה)
      Event.find({
        companyId,
        startDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
        .populate("participants", "name")
        .sort({ startDate: 1 }),

      // 6. Low Stock Inventory
      Inventory.find({
        companyId,
        $expr: { $lt: ["$quantity", "$minStockLevel"] },
      })
        .populate("productId", "productName sku")
        .lean(),

      // 7. Supplier Data
      Suppliers.find({ companyId })
        .select("SupplierName Email Phone Rating IsActive")
        .lean(),

      // 8. Employees
      Employee.find({ companyId }).lean(),

      // 9. Customer Summary
      Customer.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // 10. Customer Order Summary
      CustomerOrder.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$status",
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: "$orderTotal" },
          },
        },
      ]),

      // 11. Department Summary (למשל: סכום מחלקות, כמה חברי צוות וכו')
      Department.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalDepartments: { $sum: 1 },
            // שים לב שכאן זה קצת שונה, כי צריך לעשות $sum על גודל מערך
            // זה תלוי איך מבנה המסמכים במחלקות
            // אם זה נמצא ב-"teamMembers", למשל:
            // totalTeamMembers: { $sum: { $size: "$teamMembers" } },
          },
        },
      ]),

      // 12. Performance Reviews (נחזיר כרגע את כולם)
      PerformanceReview.find({ companyId }).lean(),

      // 13. Products (נחזיר את כולם)
      Product.find({ companyId }).lean(),

      // 14. Procurement Proposals
      ProcurementProposal.find({ companyId }).lean(),

      // 15. Projects
      Project.find({ companyId })
        .populate("projectManager", "name")
        .populate("teamMembers.employeeId", "name")
        .lean(),

      // 16. Product Trees
      ProductTree.find({ companyId })
        .populate("productId", "productName")
        .populate("components.componentId", "productName")
        .lean(),

      // 17. משימות באיחור (לדוגמה)
      Task.find({
        companyId,
        status: { $ne: "completed" },
        dueDate: { $lt: new Date() },
      })
        .populate("assignedTo", "name")
        .lean(),

      // 18. פריטי מלאי שתוקפם פג בקרוב (30 יום)
      Inventory.find({
        companyId,
        expirationDate: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
        .populate("productId", "productName")
        .lean(),

      // וכו’... אפשר להמשיך עד שמכסים את כל 55 הדוחות שלך
    ]);

    // בניית אובייקט התשובה
    const responseData = {
      budgetSummary,
      financeSummary,
      taskSummary,
      procurementSummary,
      upcomingEvents,
      lowStockInventory,
      suppliers,
      employees,
      customerSummary,
      customerOrderSummary,
      departmentSummary,
      performanceReviews,
      products,
      procurementProposals,
      projects,
      productTrees,
      overdueTasks,
      inventoryExpiration,
      // ...הוסף כאן כל שדה נוסף אם תוסיף אותו ל-Promise.all
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error("Error in getSuperUnifiedReport:", err.message);
    if (err.message.includes("Unauthorized")) {
      return res.status(401).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};
