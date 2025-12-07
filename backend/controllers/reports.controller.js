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
 * פונקציה עזר ליצירת פילטר תאריכים דינמי
 */
const createDateFilter = (startDate, endDate, dateField = "createdAt") => {
  if (startDate && endDate) {
    return {
      [dateField]: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }
  return {};
};

/**
 * getSuperUnifiedReport:
 * מביא קריאה *אחת* שמחזירה *כל* סוגי הדוחות/המידע שתרצה מכל המודלים.
 * משופר עם aggregations מתקדמים, KPIs, וניתוחים זמניים.
 */
export const getSuperUnifiedReport = async (req, res) => {
  try {
    // אימות משתמש ע"י הטוקן
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    // ניתן לקבל תאריכים (startDate, endDate) לסינון דינמי
    const { startDate, endDate } = req.query;

    // הגדרת פילטרים דינמיים לכל מודל
    const generalFilter = { companyId };
    const generalDateFilter = createDateFilter(startDate, endDate);
    const financeFilter = { 
      companyId,
      ...createDateFilter(startDate, endDate, "transactionDate")
    };
    const procurementFilter = {
      companyId,
      ...createDateFilter(startDate, endDate, "purchaseDate")
    };

    // הרצה במקביל של שליפות / אגרגציות משופרות
    const [
      // 1. Budget - Summary and Details
      budgetSummary,
      budgetByCategory,
      budgetTrends,
      // 2. Finance - Summary and Analysis
      financeSummary,
      financeByCategory,
      financeTrends,
      financeCashFlow,
      // 3. Tasks - Summary and Analysis
      taskSummary,
      tasksByProject,
      overdueTasks,
      taskCompletionRate,
      // 4. Procurement - Summary and Details
      procurementSummary,
      procurementBySupplier,
      procurementByStatus,
      // 5. Events
      upcomingEvents,
      pastEvents,
      // 6. Inventory - Critical Data
      lowStockInventory,
      inventoryExpiration,
      inventoryByCategory,
      inventoryValue,
      // 7. Suppliers - Analysis
      suppliersActive,
      suppliersByRating,
      // 8. Employees - HR Analytics
      employeesSummary,
      employeesByDepartment,
      employeesByStatus,
      // 9. Customers - CRM Data
      customerSummary,
      customersByType,
      topCustomers,
      // 10. Customer Orders - Sales Analysis
      customerOrderSummary,
      ordersByStatus,
      ordersTrends,
      revenueAnalysis,
      // 11. Departments
      departmentSummary,
      departmentMetrics,
      // 12. Performance Reviews
      performanceReviewsSummary,
      performanceByEmployee,
      // 13. Products
      productsSummary,
      productsByCategory,
      topSellingProducts,
      // 14. Procurement Proposals
      procurementProposalsSummary,
      proposalsByStatus,
      // 15. Projects
      projectsSummary,
      projectsByStatus,
      projectProgress,
      // 16. Product Trees
      productTreesSummary,
    ] = await Promise.all([
      // ==================== 1. BUDGET AGGREGATIONS ====================
      // 1.1 Budget Summary - סיכום כללי של תקציבים
      Budget.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            totalBudget: { $sum: "$amount" },
            totalSpent: { $sum: "$spentAmount" },
            count: { $sum: 1 },
            avgUtilization: {
              $avg: {
                $cond: [
                  { $gt: ["$amount", 0] },
                  { $multiply: [{ $divide: ["$spentAmount", "$amount"] }, 100] },
                  0
                ]
              }
            },
          },
        },
      ]),

      // 1.2 Budget By Category
      Budget.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$category",
            totalBudget: { $sum: "$amount" },
            totalSpent: { $sum: "$spentAmount" },
            count: { $sum: 1 },
            remaining: { $sum: { $subtract: ["$amount", "$spentAmount"] } },
          },
        },
        { $sort: { totalBudget: -1 } },
      ]),

      // 1.3 Budget Trends - מגמות לפי חודש
      Budget.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalBudget: { $sum: "$amount" },
            totalSpent: { $sum: "$spentAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // ==================== 2. FINANCE AGGREGATIONS ====================
      // 2.1 Finance Summary - סיכום פיננסי
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: { type: "$transactionType", status: "$transactionStatus" },
            totalAmount: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$transactionAmount" },
          },
        },
      ]),

      // 2.2 Finance By Category
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // 2.3 Finance Trends - מגמות פיננסיות
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: {
              year: { $year: "$transactionDate" },
              month: { $month: "$transactionDate" },
              type: "$transactionType",
            },
            totalAmount: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 2.4 Cash Flow - תזרים מזומנים
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: "$transactionType",
            total: { $sum: "$transactionAmount" },
          },
        },
        {
          $group: {
            _id: null,
            income: {
              $sum: {
                $cond: [{ $eq: ["$_id", "Income"] }, "$total", 0]
              }
            },
            expense: {
              $sum: {
                $cond: [{ $eq: ["$_id", "Expense"] }, "$total", 0]
              }
            },
          },
        },
        {
          $project: {
            _id: 0,
            income: 1,
            expense: 1,
            netCashFlow: { $subtract: ["$income", "$expense"] },
          },
        },
      ]),

      // ==================== 3. TASKS AGGREGATIONS ====================
      // 3.1 Task Summary
      Task.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: { status: "$status", priority: "$priority" },
            count: { $sum: 1 },
          },
        },
      ]),

      // 3.2 Tasks By Project
      Task.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$projectId",
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            inProgressTasks: {
              $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
            },
            overdueTasks: {
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $lt: ["$dueDate", new Date()] },
                      { $ne: ["$status", "completed"] }
                    ]
                  }, 
                  1, 
                  0
                ] 
              }
            },
          },
        },
      ]),

      // 3.3 Overdue Tasks
      Task.find({
        companyId,
        status: { $ne: "completed" },
        dueDate: { $lt: new Date() },
      })
        .populate("assignedTo", "name email")
        .populate("projectId", "projectName")
        .sort({ dueDate: 1 })
        .limit(50)
        .lean(),

      // 3.4 Task Completion Rate
      Task.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            inProgressTasks: {
              $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
            },
            pendingTasks: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalTasks: 1,
            completedTasks: 1,
            inProgressTasks: 1,
            pendingTasks: 1,
            completionRate: {
              $cond: [
                { $gt: ["$totalTasks", 0] },
                { $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] },
                0
              ]
            },
          },
        },
      ]),

      // ==================== 4. PROCUREMENT AGGREGATIONS ====================
      // 4.1 Procurement Summary
      Procurement.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: { status: "$status", paymentStatus: "$paymentStatus" },
            totalCost: { $sum: "$totalCost" },
            count: { $sum: 1 },
            avgCost: { $avg: "$totalCost" },
          },
        },
      ]),

      // 4.2 Procurement By Supplier
      Procurement.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$supplierId",
            totalCost: { $sum: "$totalCost" },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: "$totalCost" },
          },
        },
        { $sort: { totalCost: -1 } },
        { $limit: 20 },
      ]),

      // 4.3 Procurement By Status
      Procurement.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            totalCost: { $sum: "$totalCost" },
            count: { $sum: 1 },
          },
        },
      ]),

      // ==================== 5. EVENTS AGGREGATIONS ====================
      // 5.1 Upcoming Events (7 ימים קדימה)
      Event.find({
        companyId,
        startDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
        .populate("participants", "name email")
        .populate("createdBy", "name")
        .sort({ startDate: 1 })
        .limit(20)
        .lean(),

      // 5.2 Past Events (30 ימים אחרונים)
      Event.aggregate([
        {
          $match: {
            companyId,
            startDate: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              $lt: new Date(),
            },
          },
        },
        {
          $group: {
            _id: "$eventType",
            count: { $sum: 1 },
            totalParticipants: { $sum: { $size: { $ifNull: ["$participants", []] } } },
          },
        },
      ]),

      // ==================== 6. INVENTORY AGGREGATIONS ====================
      // 6.1 Low Stock Inventory
      Inventory.find({
        companyId,
        $expr: { $lt: ["$quantity", "$minStockLevel"] },
      })
        .populate("productId", "productName sku category")
        .sort({ quantity: 1 })
        .limit(50)
        .lean(),

      // 6.2 Inventory Expiration (מוצרים שתוקפם פג בקרוב - 60 יום)
      Inventory.find({
        companyId,
        expirationDate: {
          $exists: true,
          $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      })
        .populate("productId", "productName sku")
        .sort({ expirationDate: 1 })
        .limit(50)
        .lean(),

      // 6.3 Inventory By Category
      Inventory.aggregate([
        { $match: { companyId } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$product.category",
            totalQuantity: { $sum: "$quantity" },
            totalValue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
            itemCount: { $sum: 1 },
          },
        },
        { $sort: { totalValue: -1 } },
      ]),

      // 6.4 Inventory Value
      Inventory.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
            totalItems: { $sum: 1 },
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ]),

      // ==================== 7. SUPPLIERS AGGREGATIONS ====================
      // 7.1 Active Suppliers
      Suppliers.find({ companyId, IsActive: true })
        .select("SupplierName Email Phone Rating averageRating IsActive ContactPerson")
        .sort({ averageRating: -1 })
        .lean(),

      // 7.2 Suppliers By Rating
      Suppliers.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ["$Rating", 4.5] }, then: "Excellent" },
                  { case: { $gte: ["$Rating", 3.5] }, then: "Good" },
                  { case: { $gte: ["$Rating", 2.5] }, then: "Average" },
                ],
                default: "Poor",
              },
            },
            count: { $sum: 1 },
            avgRating: { $avg: "$Rating" },
          },
        },
      ]),

      // ==================== 8. EMPLOYEES AGGREGATIONS ====================
      // 8.1 Employees Summary
      Employee.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // 8.2 Employees By Department
      Employee.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
            roles: { $addToSet: "$role" },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "departmentInfo",
          },
        },
      ]),

      // 8.3 Employees By Status
      Employee.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: {
              status: "$status",
              role: "$role",
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // ==================== 9. CUSTOMERS AGGREGATIONS ====================
      // 9.1 Customer Summary
      Customer.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // 9.2 Customers By Type
      Customer.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$customerType",
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
            },
          },
        },
      ]),

      // 9.3 Top Customers (by order value)
      CustomerOrder.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$customerId",
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$orderTotal" },
            avgOrderValue: { $avg: "$orderTotal" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
      ]),

      // ==================== 10. CUSTOMER ORDERS AGGREGATIONS ====================
      // 10.1 Customer Order Summary
      CustomerOrder.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: "$orderTotal" },
            avgOrderValue: { $avg: "$orderTotal" },
          },
        },
      ]),

      // 10.2 Orders By Status
      CustomerOrder.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalRevenue: { $sum: "$orderTotal" },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),

      // 10.3 Orders Trends - מגמות הזמנות לפי חודש
      CustomerOrder.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" },
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$orderTotal" },
            avgOrderValue: { $avg: "$orderTotal" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 10.4 Revenue Analysis
      CustomerOrder.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$orderTotal" },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: "$orderTotal" },
            maxOrderValue: { $max: "$orderTotal" },
            minOrderValue: { $min: "$orderTotal" },
          },
        },
      ]),

      // ==================== 11. DEPARTMENTS AGGREGATIONS ====================
      // 11.1 Department Summary
      Department.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalDepartments: { $sum: 1 },
          },
        },
      ]),

      // 11.2 Department Metrics
      Department.aggregate([
        { $match: { companyId } },
        {
          $lookup: {
            from: "employees",
            localField: "_id",
            foreignField: "department",
            as: "employees",
          },
        },
        {
          $project: {
            departmentName: 1,
            headOfDepartment: 1,
            employeeCount: { $size: "$employees" },
            budget: 1,
          },
        },
        { $sort: { employeeCount: -1 } },
      ]),

      // ==================== 12. PERFORMANCE REVIEWS AGGREGATIONS ====================
      // 12.1 Performance Reviews Summary
      PerformanceReview.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$reviewStatus",
            count: { $sum: 1 },
            avgScore: { $avg: "$overallScore" },
          },
        },
      ]),

      // 12.2 Performance By Employee (Top/Bottom performers)
      PerformanceReview.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$employeeId",
            avgScore: { $avg: "$overallScore" },
            reviewCount: { $sum: 1 },
            latestReview: { $max: "$reviewDate" },
          },
        },
        { $sort: { avgScore: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: "employees",
            localField: "_id",
            foreignField: "_id",
            as: "employeeInfo",
          },
        },
      ]),

      // ==================== 13. PRODUCTS AGGREGATIONS ====================
      // 13.1 Products Summary
      Product.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            avgPrice: { $avg: "$unitPrice" },
            totalValue: { $sum: "$unitPrice" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 13.2 Products By Category
      Product.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: {
              category: "$category",
              productType: "$productType",
            },
            count: { $sum: 1 },
            avgPrice: { $avg: "$unitPrice" },
          },
        },
      ]),

      // 13.3 Top Selling Products (based on orders)
      CustomerOrder.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$items.productId",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
      ]),

      // ==================== 14. PROCUREMENT PROPOSALS AGGREGATIONS ====================
      // 14.1 Procurement Proposals Summary
      ProcurementProposal.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalEstimatedCost: { $sum: "$estimatedCost" },
          },
        },
      ]),

      // 14.2 Proposals By Status
      ProcurementProposal.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgCost: { $avg: "$estimatedCost" },
          },
        },
      ]),

      // ==================== 15. PROJECTS AGGREGATIONS ====================
      // 15.1 Projects Summary
      Project.aggregate([
        { $match: { companyId, ...generalDateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalBudget: { $sum: "$budget" },
            avgBudget: { $avg: "$budget" },
          },
        },
      ]),

      // 15.2 Projects By Status
      Project.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            projects: { $push: { name: "$projectName", _id: "$_id" } },
          },
        },
      ]),

      // 15.3 Project Progress (with task completion)
      Project.aggregate([
        { $match: { companyId } },
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "projectId",
            as: "tasks",
          },
        },
        {
          $project: {
            projectName: 1,
            status: 1,
            budget: 1,
            startDate: 1,
            endDate: 1,
            totalTasks: { $size: "$tasks" },
            completedTasks: {
              $size: {
                $filter: {
                  input: "$tasks",
                  as: "task",
                  cond: { $eq: ["$$task.status", "completed"] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            completionPercentage: {
              $cond: [
                { $gt: ["$totalTasks", 0] },
                { $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { startDate: -1 } },
      ]),

      // ==================== 16. PRODUCT TREES AGGREGATIONS ====================
      // 16.1 Product Trees Summary
      ProductTree.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalTrees: { $sum: 1 },
            avgComponents: { $avg: { $size: { $ifNull: ["$components", []] } } },
          },
        },
      ]),
    ]);

    // בניית אובייקט התשובה המורחב והמפורט
    const responseData = {
      // ===== BUDGET DATA =====
      budget: {
        summary: budgetSummary,
        byCategory: budgetByCategory,
        trends: budgetTrends,
      },
      
      // ===== FINANCE DATA =====
      finance: {
        summary: financeSummary,
        byCategory: financeByCategory,
        trends: financeTrends,
        cashFlow: financeCashFlow[0] || { income: 0, expense: 0, netCashFlow: 0 },
      },
      
      // ===== TASKS DATA =====
      tasks: {
        summary: taskSummary,
        byProject: tasksByProject,
        overdue: overdueTasks,
        completionRate: taskCompletionRate[0] || {},
      },
      
      // ===== PROCUREMENT DATA =====
      procurement: {
        summary: procurementSummary,
        bySupplier: procurementBySupplier,
        byStatus: procurementByStatus,
      },
      
      // ===== EVENTS DATA =====
      events: {
        upcoming: upcomingEvents,
        pastSummary: pastEvents,
      },
      
      // ===== INVENTORY DATA =====
      inventory: {
        lowStock: lowStockInventory,
        expiring: inventoryExpiration,
        byCategory: inventoryByCategory,
        totalValue: inventoryValue[0] || {},
      },
      
      // ===== SUPPLIERS DATA =====
      suppliers: {
        active: suppliersActive,
        byRating: suppliersByRating,
      },
      
      // ===== EMPLOYEES DATA =====
      employees: {
        summary: employeesSummary,
        byDepartment: employeesByDepartment,
        byStatus: employeesByStatus,
      },
      
      // ===== CUSTOMERS DATA =====
      customers: {
        summary: customerSummary,
        byType: customersByType,
        topCustomers: topCustomers,
      },
      
      // ===== CUSTOMER ORDERS DATA =====
      orders: {
        summary: customerOrderSummary,
        byStatus: ordersByStatus,
        trends: ordersTrends,
        revenueAnalysis: revenueAnalysis[0] || {},
      },
      
      // ===== DEPARTMENTS DATA =====
      departments: {
        summary: departmentSummary[0] || {},
        metrics: departmentMetrics,
      },
      
      // ===== PERFORMANCE REVIEWS DATA =====
      performanceReviews: {
        summary: performanceReviewsSummary,
        byEmployee: performanceByEmployee,
      },
      
      // ===== PRODUCTS DATA =====
      products: {
        summary: productsSummary,
        byCategory: productsByCategory,
        topSelling: topSellingProducts,
      },
      
      // ===== PROCUREMENT PROPOSALS DATA =====
      procurementProposals: {
        summary: procurementProposalsSummary,
        byStatus: proposalsByStatus,
      },
      
      // ===== PROJECTS DATA =====
      projects: {
        summary: projectsSummary,
        byStatus: projectsByStatus,
        progress: projectProgress,
      },
      
      // ===== PRODUCT TREES DATA =====
      productTrees: {
        summary: productTreesSummary[0] || {},
      },

      // ===== KEY PERFORMANCE INDICATORS (KPIs) =====
      kpis: {
        totalRevenue: revenueAnalysis[0]?.totalRevenue || 0,
        totalOrders: revenueAnalysis[0]?.totalOrders || 0,
        avgOrderValue: revenueAnalysis[0]?.avgOrderValue || 0,
        taskCompletionRate: taskCompletionRate[0]?.completionRate || 0,
        cashFlow: financeCashFlow[0]?.netCashFlow || 0,
        inventoryValue: inventoryValue[0]?.totalValue || 0,
        activeEmployees: employeesSummary.find(e => e._id === "Active")?.count || 0,
        activeCustomers: customerSummary.find(c => c._id === "Active")?.count || 0,
        lowStockItems: lowStockInventory.length,
        overdueTasksCount: overdueTasks.length,
      },
      
      // ===== METADATA =====
      metadata: {
        generatedAt: new Date(),
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        companyId: companyId.toString(),
      },
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      message: "Super unified report generated successfully",
    });
  } catch (err) {
    console.error("Error in getSuperUnifiedReport:", err.message);
    console.error("Stack trace:", err.stack);
    
    if (err.message.includes("Unauthorized")) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: Invalid or missing token" 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Error generating report", 
      error: err.message 
    });
  }
};

/**
 * getDashboardOverview:
 * מחזיר סיכום מהיר של המידע החשוב ביותר לדשבורד הראשי
 * מותאם למסך הבית - מידע קריטי בלבד
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const [
      // KPIs עיקריים
      budgetUtilization,
      cashFlowSummary,
      taskStats,
      orderStats,
      employeeStats,
      criticalAlerts,
    ] = await Promise.all([
      // תצוגת תקציב
      Budget.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalBudget: { $sum: "$amount" },
            totalSpent: { $sum: "$spentAmount" },
            utilizationRate: {
              $avg: {
                $cond: [
                  { $gt: ["$amount", 0] },
                  { $multiply: [{ $divide: ["$spentAmount", "$amount"] }, 100] },
                  0
                ]
              }
            },
          },
        },
      ]),

      // תזרים מזומנים
      Finance.aggregate([
        {
          $match: {
            companyId,
            transactionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: "$transactionType",
            total: { $sum: "$transactionAmount" },
          },
        },
      ]),

      // סטטיסטיקות משימות
      Task.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ["$dueDate", new Date()] },
                      { $ne: ["$status", "completed"] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
          },
        },
      ]),

      // סטטיסטיקות הזמנות (30 יום אחרונים)
      CustomerOrder.aggregate([
        {
          $match: {
            companyId,
            orderDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$orderTotal" },
            avgOrderValue: { $avg: "$orderTotal" },
          },
        },
      ]),

      // עובדים פעילים
      Employee.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // התראות קריטיות
      Promise.all([
        // מלאי נמוך
        Inventory.countDocuments({
          companyId,
          $expr: { $lt: ["$quantity", "$minStockLevel"] },
        }),
        // משימות באיחור
        Task.countDocuments({
        companyId,
        status: { $ne: "completed" },
        dueDate: { $lt: new Date() },
        }),
        // פריטים שפגי תוקף בקרוב (30 יום)
        Inventory.countDocuments({
        companyId,
        expirationDate: {
            $exists: true,
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        }),
      ]),
    ]);

    // עיבוד תזרים מזומנים
    const income = cashFlowSummary.find(item => item._id === "Income")?.total || 0;
    const expense = cashFlowSummary.find(item => item._id === "Expense")?.total || 0;

    const overview = {
      // תקציב
      budget: budgetUtilization[0] || { totalBudget: 0, totalSpent: 0, utilizationRate: 0 },
      
      // כספים
      finance: {
        income,
        expense,
        netCashFlow: income - expense,
        period: "Last 30 days",
      },
      
      // משימות
      tasks: taskStats[0] || { total: 0, completed: 0, inProgress: 0, overdue: 0 },
      
      // הזמנות
      orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
      
      // עובדים
      employees: {
        active: employeeStats.find(e => e._id === "Active")?.count || 0,
        total: employeeStats.reduce((sum, e) => sum + e.count, 0),
      },
      
      // התראות
      alerts: {
        lowStockItems: criticalAlerts[0],
        overdueTasks: criticalAlerts[1],
        expiringItems: criticalAlerts[2],
        total: criticalAlerts[0] + criticalAlerts[1] + criticalAlerts[2],
      },
      
      generatedAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (err) {
    console.error("Error in getDashboardOverview:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error generating dashboard overview",
      error: err.message,
    });
  }
};

/**
 * getFinanceReport:
 * דוח פיננסי מפורט עם ניתוחים עמוקים
 */
export const getFinanceReport = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { startDate, endDate } = req.query;

    const financeFilter = { 
      companyId,
      ...createDateFilter(startDate, endDate, "transactionDate")
    };

    const [
      transactionsSummary,
      monthlyTrends,
      categoryBreakdown,
      topExpenses,
      cashFlow,
      budgetComparison,
    ] = await Promise.all([
      // סיכום טרנזקציות
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: { type: "$transactionType", status: "$transactionStatus" },
            total: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
            avg: { $avg: "$transactionAmount" },
          },
        },
      ]),

      // מגמות חודשיות
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: {
              year: { $year: "$transactionDate" },
              month: { $month: "$transactionDate" },
              type: "$transactionType",
            },
            total: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // פילוח לפי קטגוריה
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: { category: "$category", type: "$transactionType" },
            total: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // הוצאות מובילות
      Finance.find({ ...financeFilter, transactionType: "Expense" })
        .sort({ transactionAmount: -1 })
        .limit(10)
        .lean(),

      // תזרים מזומנים
      Finance.aggregate([
        { $match: financeFilter },
        {
          $group: {
            _id: "$transactionType",
            total: { $sum: "$transactionAmount" },
          },
        },
      ]),

      // השוואה לתקציב
      Budget.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalBudgeted: { $sum: "$amount" },
            totalSpent: { $sum: "$spentAmount" },
            remaining: { $sum: { $subtract: ["$amount", "$spentAmount"] } },
          },
        },
      ]),
    ]);

    const income = cashFlow.find(item => item._id === "Income")?.total || 0;
    const expense = cashFlow.find(item => item._id === "Expense")?.total || 0;

    const report = {
      summary: {
        transactions: transactionsSummary,
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
        profitMargin: income > 0 ? ((income - expense) / income * 100).toFixed(2) : 0,
      },
      trends: monthlyTrends,
      categoryBreakdown,
      topExpenses,
      budgetComparison: budgetComparison[0] || {},
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      generatedAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("Error in getFinanceReport:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error generating finance report",
      error: err.message,
    });
  }
};

/**
 * getHRReport:
 * דוח משאבי אנוש מפורט
 */
export const getHRReport = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const [
      employeeSummary,
      departmentBreakdown,
      performanceStats,
      recentReviews,
    ] = await Promise.all([
      // סיכום עובדים
      Employee.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // פילוח לפי מחלקה
      Employee.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: { department: "$department", role: "$role" },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id.department",
            foreignField: "_id",
            as: "deptInfo",
          },
        },
      ]),

      // סטטיסטיקות ביצועים
      PerformanceReview.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: "$overallScore" },
            totalReviews: { $sum: 1 },
            excellentCount: {
              $sum: { $cond: [{ $gte: ["$overallScore", 4.5] }, 1, 0] }
            },
            needsImprovementCount: {
              $sum: { $cond: [{ $lt: ["$overallScore", 3] }, 1, 0] }
            },
          },
        },
      ]),

      // ביקורות אחרונות
      PerformanceReview.find({ companyId })
        .sort({ reviewDate: -1 })
        .limit(10)
        .populate("employeeId", "name email role")
        .populate("reviewerId", "name")
        .lean(),
    ]);

    const report = {
      summary: {
        employees: employeeSummary,
        totalEmployees: employeeSummary.reduce((sum, e) => sum + e.count, 0),
      },
      departments: departmentBreakdown,
      performance: performanceStats[0] || {},
      recentReviews,
      generatedAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("Error in getHRReport:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error generating HR report",
      error: err.message,
    });
  }
};

/**
 * getSalesReport:
 * דוח מכירות מפורט
 */
export const getSalesReport = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { startDate, endDate } = req.query;

    const orderFilter = { 
      companyId,
      ...createDateFilter(startDate, endDate, "orderDate")
    };

    const [
      salesSummary,
      salesByStatus,
      topCustomers,
      topProducts,
      salesTrends,
      revenueByCategory,
    ] = await Promise.all([
      // סיכום מכירות
      CustomerOrder.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$orderTotal" },
            avgOrderValue: { $avg: "$orderTotal" },
            maxOrderValue: { $max: "$orderTotal" },
          },
        },
      ]),

      // מכירות לפי סטטוס
      CustomerOrder.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: { $sum: "$orderTotal" },
          },
        },
      ]),

      // לקוחות מובילים
      CustomerOrder.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: "$customerId",
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$orderTotal" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        { $unwind: "$customerInfo" },
      ]),

      // מוצרים מובילים
      CustomerOrder.aggregate([
        { $match: orderFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
      ]),

      // מגמות מכירות
      CustomerOrder.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" },
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$orderTotal" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // הכנסות לפי קטגוריה
      CustomerOrder.aggregate([
        { $match: orderFilter },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$product.category",
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    const report = {
      summary: salesSummary[0] || {},
      byStatus: salesByStatus,
      topCustomers,
      topProducts,
      trends: salesTrends,
      revenueByCategory,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      generatedAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("Error in getSalesReport:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error generating sales report",
      error: err.message,
    });
  }
};
