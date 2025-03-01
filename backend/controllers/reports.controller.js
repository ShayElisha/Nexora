import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// יבוא מודלים – ודאו שהנתיבים נכונים
import Budget from "../models/Budget.model.js";
import Finance from "../models/finance.model.js";
import Task from "../models/tasks.model.js";
import Procurement from "../models/procurement.model.js";
import Event from "../models/events.model.js";
import Inventory from "../models/inventory.model.js";
import Suppliers from "../models/suppliers.model.js";
import Signature from "../models/signature.model.js";
import Employee from "../models/employees.model.js"; // במידה וקיים

/***************************************
 * 1. דוח תקציבים – סיכום כולל של תקציבים
 ***************************************/
export const getBudgetSummaryReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const summary = await Budget.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: "$amount" },
          totalSpent: { $sum: "$spentAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, data: summary[0] || {} });
  } catch (err) {
    console.error("Error in getBudgetSummaryReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 2. דוח פיננסי – פילוח עסקאות לפי סוג (למשל, "income" ו-"expense")
 ***************************************/
export const getFinanceSummaryReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const summary = await Finance.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: "$transactionType",
          totalAmount: { $sum: "$transactionAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error("Error in getFinanceSummaryReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 3. דוח משימות – ספירה לפי סטטוס
 ***************************************/
export const getTaskSummaryReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const summary = await Task.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error("Error in getTaskSummaryReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 4. דוח רכש – פילוח לפי סטטוס וריכוז עלויות
 ***************************************/
export const getProcurementSummaryReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const summary = await Procurement.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalCost: { $sum: "$totalCost" },
        },
      },
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error("Error in getProcurementSummaryReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 5. דוח אירועים – שליפת אירועים קרובים (7 ימים)
 ***************************************/
export const getUpcomingEventsReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const events = await Event.find({
      companyId,
      startDate: { $gte: now, $lte: nextWeek },
    }).sort({ startDate: 1 });

    res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error("Error in getUpcomingEventsReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 6. דוח מלאי – שליפת פריטים במלאי מתחת לרמה מינימלית
 ***************************************/
export const getLowStockReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const items = await Inventory.find({
      companyId,
      $expr: { $lt: ["$quantity", "$minStockLevel"] },
    }).populate("productId", "productName");

    res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("Error in getLowStockReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 7. דוח תקציבים לפי מחלקה – לפי departmentId (מגיע כ-query)
 ***************************************/
export const getBudgetReportByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.query;
    if (!departmentId)
      return res
        .status(400)
        .json({
          success: false,
          message: "departmentId parameter is required",
        });

    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const report = await Budget.aggregate([
      {
        $match: {
          companyId: companyObjectId,
          departmentId: new mongoose.Types.ObjectId(departmentId),
        },
      },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: "$amount" },
          totalSpent: { $sum: "$spentAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, data: report[0] || {} });
  } catch (err) {
    console.error("Error in getBudgetReportByDepartment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 8. דוח ספקים – שליפת כל הספקים ושדות נבחרים
 ***************************************/
export const getSupplierReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const suppliers = await Suppliers.find({ companyId }).select(
      "SupplierName Email Phone Rating IsActive"
    );
    res.status(200).json({ success: true, data: suppliers });
  } catch (err) {
    console.error("Error in getSupplierReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 9. דוח חתימות – סטטוס חתימות
 ***************************************/
export const getSignatureReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const signatures = await Signature.find({ companyId });
    res.status(200).json({ success: true, data: signatures });
  } catch (err) {
    console.error("Error in getSignatureReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 10. דוח לוח בקרה כללי למנהל – שילוב מספר נתונים מרכזיים
 ***************************************/
export const getManagerDashboardReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    // תקציבים
    const budgetsSummary = await Budget.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: "$amount" },
          totalSpent: { $sum: "$spentAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // פיננסים
    const financeSummary = await Finance.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: "$transactionType",
          totalAmount: { $sum: "$transactionAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // משימות
    const tasksSummary = await Task.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // רכש
    const procurementSummary = await Procurement.aggregate([
      { $match: { companyId: companyObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalCost: { $sum: "$totalCost" },
        },
      },
    ]);

    // אירועים קרובים
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const upcomingEvents = await Event.find({
      companyId,
      startDate: { $gte: now, $lte: nextWeek },
    }).sort({ startDate: 1 });

    // מלאי נמוך
    const lowStockItems = await Inventory.find({
      companyId,
      $expr: { $lt: ["$quantity", "$minStockLevel"] },
    }).populate("productId", "productName");

    // הרכבת הדוח הכולל
    const report = {
      budgetsSummary: budgetsSummary[0] || {
        totalBudget: 0,
        totalSpent: 0,
        count: 0,
      },
      financeSummary,
      tasksSummary,
      procurementSummary,
      upcomingEvents,
      lowStockItems,
    };

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error("Error in getManagerDashboardReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 11. דוח תקציבים מפורט לפי פרויקט
 ***************************************/
export const getDetailedBudgetReportByProject = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId)
      return res
        .status(400)
        .json({ success: false, message: "projectId parameter is required" });

    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    // אגרגציה לפי פרויקט – סיכום תקציבים, הוצאות וכדומה
    const report = await Budget.aggregate([
      {
        $match: {
          companyId: companyObjectId,
          projectId: new mongoose.Types.ObjectId(projectId),
        },
      },
      {
        $group: {
          _id: "$projectId",
          totalBudget: { $sum: "$amount" },
          totalSpent: { $sum: "$spentAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, data: report[0] || {} });
  } catch (err) {
    console.error("Error in getDetailedBudgetReportByProject:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 12. דוח פיננסי מפורט – רשימת כל העסקאות
 ***************************************/
export const getDetailedFinanceReport = async (req, res) => {
  try {
    const { startDate, endDate, transactionType } = req.query;

    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;
    const filter = { companyId };

    if (transactionType) filter.transactionType = transactionType;
    if (startDate && endDate) {
      filter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Finance.find(filter).sort({
      transactionDate: -1,
    });
    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    console.error("Error in getDetailedFinanceReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 13. דוח משימות מפורט – כולל סינון לפי תאריך יעד או סטטוס
 ***************************************/
export const getDetailedTaskReport = async (req, res) => {
  try {
    const { status, dueDate } = req.query;

    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    const filter = { companyId };
    if (status) filter.status = status;
    if (dueDate) filter.dueDate = { $gte: new Date(dueDate) };

    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    console.error("Error in getDetailedTaskReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 14. דוח רכש מפורט – לפי ספק
 ***************************************/
export const getProcurementReportBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.query;
    if (!supplierId)
      return res
        .status(400)
        .json({ success: false, message: "supplierId parameter is required" });

    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    const procurements = await Procurement.find({
      companyId,
      supplierId: new mongoose.Types.ObjectId(supplierId),
    }).sort({ purchaseDate: -1 });

    res.status(200).json({ success: true, data: procurements });
  } catch (err) {
    console.error("Error in getProcurementReportBySupplier:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 15. דוח אירועים מפורט – לפי סוג אירוע
 ***************************************/
export const getEventReportByType = async (req, res) => {
  try {
    const { eventType } = req.query;
    if (!eventType)
      return res
        .status(400)
        .json({ success: false, message: "eventType parameter is required" });

    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    const events = await Event.find({ companyId, eventType }).sort({
      startDate: 1,
    });
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error("Error in getEventReportByType:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 16. דוח מלאי – דוח חיזוי הזמנות מחדש (Reorder Report)
 ***************************************/
export const getInventoryReorderReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    const inventoryItems = await Inventory.find({ companyId })
      .populate("productId", "productName")
      .lean();

    const reorderItems = inventoryItems.filter(
      (item) => Number(item.quantity) < Number(item.minStockLevel) * 0.5
    );

    res.status(200).json({ success: true, data: reorderItems });
  } catch (err) {
    console.error("Error in getInventoryReorderReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 17. דוח ביצועי עובדים – דוח המאגד נתונים מעובד ספציפי
 ***************************************/
export const getEmployeePerformanceReport = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId)
      return res
        .status(400)
        .json({ success: false, message: "employeeId parameter is required" });

    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    // דוגמה: משימות שהוקצו לעובד והזמנות רכש שבהן העובד היה חתום
    const tasks = await Task.find({ companyId, assignedTo: employeeId });
    const procurements = await Procurement.find({
      companyId,
      "signers.employeeId": employeeId,
    });

    res.status(200).json({
      success: true,
      data: { tasks, procurements },
    });
  } catch (err) {
    console.error("Error in getEmployeePerformanceReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/***************************************
 * 18. דוח ביצועי ספקים – סיכום הזמנות לכל ספק
 ***************************************/
export const getSupplierPerformanceReport = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    const report = await Procurement.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: "$supplierId",
          orderCount: { $sum: 1 },
          totalCost: { $sum: "$totalCost" },
        },
      },
      {
        $lookup: {
          from: "suppliers",
          localField: "_id",
          foreignField: "_id",
          as: "supplierDetails",
        },
      },
      { $unwind: "$supplierDetails" },
      {
        $project: {
          _id: 1,
          orderCount: 1,
          totalCost: 1,
          supplierName: "$supplierDetails.SupplierName",
          Email: "$supplierDetails.Email",
        },
      },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error("Error in getSupplierPerformanceReport:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
