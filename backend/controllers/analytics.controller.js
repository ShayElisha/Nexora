import Finance from "../models/finance.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Product from "../models/product.model.js";
import Customer from "../models/customers.model.js";
import Inventory from "../models/inventory.model.js";
import mongoose from "mongoose";

/**
 * Analytics Controller
 * מספק נתונים מתקדמים לדשבורד המשודרג
 */

/**
 * גרפים של הכנסות vs הוצאות (לפי חודש/שנה)
 */
export const getRevenueVsExpenses = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { period = "12months", startDate, endDate } = req.query;

    // חישוב תאריכים
    const now = new Date();
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        transactionDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else if (period === "12months") {
      const twelveMonthsAgo = new Date(now.setMonth(now.getMonth() - 12));
      dateFilter = { transactionDate: { $gte: twelveMonthsAgo } };
    } else if (period === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { transactionDate: { $gte: startOfYear } };
    } else if (period === "6months") {
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      dateFilter = { transactionDate: { $gte: sixMonthsAgo } };
    }

    // Aggregation לפי חודש
    const monthlyData = await Finance.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter,
        },
      },
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
    ]);

    // ארגון הנתונים
    const monthlyMap = {};
    monthlyData.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { income: 0, expense: 0 };
      }
      if (item._id.type === "Income") {
        monthlyMap[key].income = item.total;
      } else if (item._id.type === "Expense") {
        monthlyMap[key].expense = item.total;
      }
    });

    const labels = Object.keys(monthlyMap).sort();
    const income = labels.map((key) => monthlyMap[key].income);
    const expenses = labels.map((key) => monthlyMap[key].expense);
    const profit = labels.map((key) => monthlyMap[key].income - monthlyMap[key].expense);

    // חישוב KPIs
    const totalIncome = income.reduce((a, b) => a + b, 0);
    const totalExpenses = expenses.reduce((a, b) => a + b, 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        labels,
        datasets: {
          income,
          expenses,
          profit,
        },
        kpis: {
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin,
          avgMonthlyIncome: totalIncome / labels.length,
          avgMonthlyExpenses: totalExpenses / labels.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in getRevenueVsExpenses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue vs expenses",
      error: error.message,
    });
  }
};

/**
 * מגמות מכירות (Sales Trends)
 */
export const getSalesTrends = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { period = "12months" } = req.query;

    const now = new Date();
    let dateFilter = {};

    if (period === "12months") {
      const twelveMonthsAgo = new Date(now.setMonth(now.getMonth() - 12));
      dateFilter = { orderDate: { $gte: twelveMonthsAgo } };
    }

    // Aggregation של מכירות לפי חודש
    const salesByMonth = await CustomerOrder.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
          totalSales: { $sum: "$orderTotal" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$orderTotal" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // מכירות לפי סטטוס
    const salesByStatus = await CustomerOrder.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$orderTotal" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ארגון נתונים
    const labels = salesByMonth.map(
      (item) => `${item._id.year}-${String(item._id.month).padStart(2, "0")}`
    );
    const sales = salesByMonth.map((item) => item.totalSales);
    const orders = salesByMonth.map((item) => item.orderCount);
    const avgOrderValue = salesByMonth.map((item) => item.avgOrderValue);

    // חישוב growth rate
    const growthRates = sales.map((value, index) => {
      if (index === 0) return 0;
      const prevValue = sales[index - 1];
      return prevValue > 0 ? (((value - prevValue) / prevValue) * 100).toFixed(2) : 0;
    });

    res.json({
      success: true,
      data: {
        timeline: {
          labels,
          sales,
          orders,
          avgOrderValue,
          growthRates,
        },
        byStatus: salesByStatus,
        kpis: {
          totalSales: sales.reduce((a, b) => a + b, 0),
          totalOrders: orders.reduce((a, b) => a + b, 0),
          avgSale: sales.length > 0 ? sales.reduce((a, b) => a + b, 0) / sales.length : 0,
          avgGrowthRate: growthRates.length > 0 ? growthRates.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / growthRates.length : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error in getSalesTrends:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales trends",
      error: error.message,
    });
  }
};

/**
 * ניתוח רווחיות לפי מוצר/לקוח
 */
export const getProfitabilityAnalysis = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { type = "both" } = req.query; // 'product', 'customer', 'both'

    let result = {};

    // רווחיות לפי מוצר
    if (type === "product" || type === "both") {
      const productProfitability = await CustomerOrder.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            status: "Delivered",
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productData",
          },
        },
        { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$items.product",
            productName: { $first: "$productData.productName" },
            totalRevenue: { $sum: "$items.totalPrice" },
            totalQuantitySold: { $sum: "$items.quantity" },
            avgPrice: { $avg: "$items.unitPrice" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 20 },
      ]);

      result.byProduct = productProfitability.map((item) => ({
        productId: item._id,
        productName: item.productName || "Unknown",
        revenue: item.totalRevenue,
        quantity: item.totalQuantitySold,
        avgPrice: item.avgPrice,
        orderCount: item.orderCount,
        revenuePerOrder: item.totalRevenue / item.orderCount,
      }));
    }

    // רווחיות לפי לקוח
    if (type === "customer" || type === "both") {
      const customerProfitability = await CustomerOrder.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            status: { $in: ["Delivered", "Shipped"] },
          },
        },
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customerData",
          },
        },
        { $unwind: { path: "$customerData", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$customer",
            customerName: { $first: "$customerData.name" },
            totalRevenue: { $sum: "$orderTotal" },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: "$orderTotal" },
            lastOrderDate: { $max: "$orderDate" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 20 },
      ]);

      result.byCustomer = customerProfitability.map((item) => ({
        customerId: item._id,
        customerName: item.customerName || "Unknown",
        revenue: item.totalRevenue,
        orders: item.orderCount,
        avgOrderValue: item.avgOrderValue,
        lastOrderDate: item.lastOrderDate,
        lifetimeValue: item.totalRevenue,
      }));
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getProfitabilityAnalysis:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profitability analysis",
      error: error.message,
    });
  }
};

/**
 * KPIs מרכזיים מתקדמים
 */
export const getAdvancedKPIs = async (req, res) => {
  try {
    const { companyId } = req.user;

    // חישוב מקבילי של כל ה-KPIs
    const [
      financeSummary,
      salesSummary,
      inventorySummary,
      customerMetrics,
    ] = await Promise.all([
      // KPIs פיננסיים
      Finance.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: "$transactionType",
            total: { $sum: "$transactionAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // KPIs מכירות
      CustomerOrder.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$orderTotal" },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: "$orderTotal" },
          },
        },
      ]),

      // KPIs מלאי
      Inventory.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productData",
          },
        },
        { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ["$quantity", "$productData.unitPrice"] },
            },
            lowStockCount: {
              $sum: {
                $cond: [{ $lt: ["$quantity", "$minStockLevel"] }, 1, 0],
              },
            },
            totalItems: { $sum: 1 },
          },
        },
      ]),

      // KPIs לקוחות
      Customer.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // עיבוד הנתונים
    const income = financeSummary.find((f) => f._id === "Income")?.total || 0;
    const expenses = financeSummary.find((f) => f._id === "Expense")?.total || 0;
    const netProfit = income - expenses;
    const profitMargin = income > 0 ? ((netProfit / income) * 100).toFixed(2) : 0;

    const revenue = salesSummary[0]?.totalRevenue || 0;
    const orders = salesSummary[0]?.totalOrders || 0;
    const avgOrderValue = salesSummary[0]?.avgOrderValue || 0;

    const inventoryValue = inventorySummary[0]?.totalValue || 0;
    const lowStockItems = inventorySummary[0]?.lowStockCount || 0;

    const activeCustomers =
      customerMetrics.find((c) => c._id === "Active")?.count || 0;
    const totalCustomers = customerMetrics.reduce((acc, c) => acc + c.count, 0);

    res.json({
      success: true,
      data: {
        financial: {
          revenue: income,
          expenses,
          netProfit,
          profitMargin: parseFloat(profitMargin),
          cashFlow: netProfit,
        },
        sales: {
          totalRevenue: revenue,
          totalOrders: orders,
          avgOrderValue,
          conversionRate: 0, // יכול להיות מחושב אם יש leads
        },
        inventory: {
          totalValue: inventoryValue,
          lowStockItems,
          stockTurnover: 0, // יכול להיות מחושב
        },
        customers: {
          active: activeCustomers,
          total: totalCustomers,
          retentionRate: totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(2) : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdvancedKPIs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching advanced KPIs",
      error: error.message,
    });
  }
};

/**
 * תחזיות AI
 */
export const getAIPredictions = async (req, res) => {
  try {
    const { companyId } = req.user;

    // קבלת נתונים היסטוריים
    const [revenueHistory, ordersHistory, expensesHistory] = await Promise.all([
      Finance.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            transactionType: "Income",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$transactionDate" },
              month: { $month: "$transactionDate" },
            },
            total: { $sum: "$transactionAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]),

      CustomerOrder.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]),

      Finance.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            transactionType: "Expense",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$transactionDate" },
              month: { $month: "$transactionDate" },
            },
            total: { $sum: "$transactionAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]),
    ]);

    // חישוב תחזיות פשוטות (Linear Regression)
    const predictNextMonth = (data) => {
      if (data.length < 2) return data[data.length - 1] || 0;

      const values = data.map((d) => d.total || d.count || 0);
      const n = values.length;

      // ממוצע של 3 חודשים אחרונים + מגמה
      const lastThree = values.slice(-3);
      const avg = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;

      // חישוב מגמה
      const trend =
        values.length > 1 ? values[n - 1] - values[n - 2] : 0;

      return Math.max(0, avg + trend);
    };

    const predictions = {
      nextMonthRevenue: predictNextMonth(revenueHistory),
      nextMonthOrders: Math.round(predictNextMonth(ordersHistory)),
      nextMonthExpenses: predictNextMonth(expensesHistory),
    };

    predictions.nextMonthProfit =
      predictions.nextMonthRevenue - predictions.nextMonthExpenses;

    // ניתוח מגמות
    const revenueValues = revenueHistory.map((r) => r.total);
    const avgRevenue =
      revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length;
    const recentAvg =
      revenueValues.slice(-3).reduce((a, b) => a + b, 0) / 3;

    const trend = recentAvg > avgRevenue ? "growing" : recentAvg < avgRevenue ? "declining" : "stable";

    const trendPercentage = avgRevenue > 0 ? (((recentAvg - avgRevenue) / avgRevenue) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        predictions,
        trend: {
          direction: trend,
          percentage: parseFloat(trendPercentage),
          message:
            trend === "growing"
              ? `Revenue is growing by ${Math.abs(trendPercentage)}%`
              : trend === "declining"
              ? `Revenue is declining by ${Math.abs(trendPercentage)}%`
              : "Revenue is stable",
        },
        confidence: "medium", // יכול להיות מחושב באופן מתוחכם יותר
      },
    });
  } catch (error) {
    console.error("Error in getAIPredictions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching AI predictions",
      error: error.message,
    });
  }
};

export default {
  getRevenueVsExpenses,
  getSalesTrends,
  getProfitabilityAnalysis,
  getAdvancedKPIs,
};

