import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Pie, Radar, Line } from "react-chartjs-2";
import * as XLSX from "xlsx";
import AdvancedKPICards from "./components/AdvancedKPICards";
import RevenueVsExpenses from "./components/RevenueVsExpenses";
import SalesTrends from "./components/SalesTrends";
import ProfitabilityAnalysis from "./components/ProfitabilityAnalysis";
import AIPredictions from "./components/AIPredictions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: "top" },
    tooltip: { enabled: true, mode: "index" },
  },
  scales: {
    x: { stacked: false },
    y: { beginAtZero: true },
  },
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState({});
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch complete data for detailed views
        const fullDataResponse = await axiosInstance.get(
          "/reports/super-unified-report",
          { withCredentials: true }
        );
        
        const fullData = fullDataResponse.data.data || {};
        
        // Extract and flatten data for backward compatibility
        const mergedData = {
          // KPIs and metadata
          kpis: fullData.kpis || {},
          metadata: fullData.metadata || {},
          
          // Nested structures (new format)
          budget: fullData.budget || {},
          finance: fullData.finance || {},
          tasks: fullData.tasks || {},
          procurement: fullData.procurement || {},
          events: fullData.events || {},
          inventory: fullData.inventory || {},
          suppliers: fullData.suppliers || {},
          employees: fullData.employees || {},
          customers: fullData.customers || {},
          orders: fullData.orders || {},
          departments: fullData.departments || {},
          performanceReviews: fullData.performanceReviews || {},
          products: fullData.products || {},
          projects: fullData.projects || {},
          productTrees: fullData.productTrees || {},
          
          // Flat arrays for backward compatibility (old format)
          budgetSummary: fullData.budget?.summary || [],
          financeSummary: fullData.finance?.summary || [],
          taskSummary: fullData.tasks?.summary || [],
          procurementSummary: fullData.procurement?.summary || [],
          upcomingEvents: fullData.events?.upcoming || [],
          lowStockInventory: fullData.inventory?.lowStock || [],
          inventoryExpiration: fullData.inventory?.expiring || [],
          customerSummary: fullData.customers?.summary || [],
          customerOrderSummary: fullData.orders?.summary || [],
          departmentSummary: fullData.departments?.summary || [],
          overdueTasks: fullData.tasks?.overdue || [],
          
          // Add empty arrays for backward compatibility - prevent errors
          // These charts need to be refactored to use the new nested structure
          employees: [],
          products: [],
          projects: [],
          performanceReviews: [],
          productTrees: [],
        };
        
        setDashboardData(mergedData);
        setLoading(false);
        
        const initialPages = {};
        Object.keys(categoryTables).forEach((category) => {
          initialPages[category] = 1;
        });
        setCurrentPage(initialPages);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          `Error fetching dashboard data: ${
            err.response?.data?.message || err.message
          }`
        );
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const emptyChartData = {
    labels: [t("dashboard.no_data")],
    datasets: [
      {
        data: [1],
        backgroundColor: ["#E0E0E0"],
        borderColor: ["#B0B0B0"],
        borderWidth: 1,
      },
    ],
  };

  const categories = [
    "Budget",
    "Finance",
    "Tasks",
    "Procurement",
    "Events",
    "Inventory",
    "Suppliers",
    "Customers",
    "Departments",
    "Performance",
    "Products",
    "Projects",
  ];

  const categoryTranslations = {
    "Budget": t("dashboard.categories.budget"),
    "Finance": t("dashboard.categories.finance"),
    "Tasks": t("dashboard.categories.tasks"),
    "Procurement": t("dashboard.categories.procurement"),
    "Events": t("dashboard.categories.events"),
    "Inventory": t("dashboard.categories.inventory"),
    "Suppliers": t("dashboard.categories.suppliers"),
    "Customers": t("dashboard.categories.customers"),
    "Departments": t("dashboard.categories.departments"),
    "Performance": t("dashboard.categories.performance"),
    "Products": t("dashboard.categories.products"),
    "Projects": t("dashboard.categories.projects"),
  };

  // Extract KPIs from the enhanced API
  const kpis = dashboardData.kpis || {};
  const overview = dashboardData.overview || {};
  
  const topMetrics = {
    totalRevenue: `${(kpis.totalRevenue || 0).toLocaleString()} ${t("dashboard.usd")}`,
    cashFlow: `${(kpis.cashFlow || 0).toLocaleString()} ${t("dashboard.usd")}`,
    activeEmployees: kpis.activeEmployees || 0,
    taskCompletionRate: `${(kpis.taskCompletionRate || 0).toFixed(1)}%`,
    totalOrders: kpis.totalOrders || 0,
    inventoryValue: `${(kpis.inventoryValue || 0).toLocaleString()} ${t("dashboard.usd")}`,
    lowStockItems: kpis.lowStockItems || 0,
    overdueTasksCount: kpis.overdueTasksCount || 0,
  };

  const topMetricsLabels = {
    totalRevenue: t("dashboard.total_revenue"),
    cashFlow: t("dashboard.net_cash_flow"),
    activeEmployees: t("dashboard.active_employees"),
    taskCompletionRate: t("dashboard.task_completion_rate"),
    totalOrders: t("dashboard.total_orders"),
    inventoryValue: t("dashboard.inventory_value"),
    lowStockItems: t("dashboard.low_stock_alerts"),
    overdueTasksCount: t("dashboard.overdue_tasks"),
  };

  // Helper to safely access nested data
  const getBudgetData = () => dashboardData.budget || {};
  const getFinanceData = () => dashboardData.finance || {};
  const getTasksData = () => dashboardData.tasks || {};
  const getProcurementData = () => dashboardData.procurement || {};
  const getEventsData = () => dashboardData.events || {};
  const getInventoryData = () => dashboardData.inventory || {};
  const getSuppliersData = () => dashboardData.suppliers || {};
  const getEmployeesData = () => dashboardData.employees || {};
  const getCustomersData = () => dashboardData.customers || {};
  const getOrdersData = () => dashboardData.orders || {};
  const getDepartmentsData = () => dashboardData.departments || {};
  const getPerformanceData = () => dashboardData.performanceReviews || {};
  const getProductsData = () => dashboardData.products || {};
  const getProjectsData = () => dashboardData.projects || {};

  const categoryCharts = {
    Budget: [
      // 1. Budget Health Overview - Critical KPI
      {
        title: t("dashboard.budget_utilization"),
        type: "Bar",
        data: {
          labels: getBudgetData().summary?.map((item) => item._id || t("dashboard.unknown")) || [],
          datasets: [
            {
              label: t("dashboard.utilization") + " %",
              data: getBudgetData().summary?.map((item) => 
                item.avgUtilization?.toFixed(1) || 0
              ) || [],
              backgroundColor: getBudgetData().summary?.map((item) => {
                const utilization = item.avgUtilization || 0;
                return utilization > 95 ? "rgba(255, 99, 132, 0.8)" : // Red - critical
                       utilization > 80 ? "rgba(255, 206, 86, 0.8)" : // Yellow - warning
                       utilization > 50 ? "rgba(54, 162, 235, 0.8)" : // Blue - good
                       "rgba(75, 192, 192, 0.8)"; // Green - excellent
              }) || [],
            },
          ],
        },
      },
      // 2. Budget Allocation vs Spent - Clear comparison
      {
        title: t("dashboard.budget_spent_vs_allocated"),
        type: "Bar",
        data: {
          labels: dashboardData.budgetSummary?.map((item) => item._id || t("dashboard.unknown")) || [],
          datasets: [
            {
              label: t("dashboard.allocated"),
              data: dashboardData.budgetSummary?.map((item) => item.totalBudget || 0) || [],
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 2,
            },
            {
              label: t("dashboard.spent"),
              data: dashboardData.budgetSummary?.map((item) => item.totalSpent || 0) || [],
              backgroundColor: "rgba(255, 99, 132, 0.7)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 2,
            },
            {
              label: t("dashboard.variance"),
              data: dashboardData.budgetSummary?.map((item) => 
                (item.totalBudget || 0) - (item.totalSpent || 0)
              ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.7)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Budget Status - Approval workflow
      {
        title: t("dashboard.budget_status"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.status.approved"), t("dashboard.status.draft"), t("dashboard.status.rejected")],
          datasets: [
            {
              data: [
                dashboardData.budgetSummary?.find((b) => b._id === "Approved")?.count || 0,
                dashboardData.budgetSummary?.find((b) => b._id === "Draft")?.count || 0,
                dashboardData.budgetSummary?.find((b) => b._id === "Rejected")?.count || 0,
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)", // Green for approved
                "rgba(255, 206, 86, 0.8)", // Yellow for draft
                "rgba(255, 99, 132, 0.8)"  // Red for rejected
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 4. Budget Allocation Distribution
      {
        title: t("dashboard.budget_allocation"),
        type: "Pie",
        data: {
          labels: dashboardData.budgetSummary?.map((item) => item._id || t("dashboard.unknown")) || [],
          datasets: [
            {
              data: dashboardData.budgetSummary?.map((item) => item.totalBudget || 0) || [],
              backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
              ],
            },
          ],
        },
      },
    ],
    Finance: [
      // 1. Revenue vs Expenses - Most Important Financial KPI
      {
        title: t("dashboard.revenue_vs_expenses"),
        type: "Bar",
        data: {
          labels: [t("dashboard.income"), t("dashboard.expense"), t("dashboard.profit") + "/" + t("dashboard.loss")],
          datasets: [
            {
              label: t("dashboard.amount"),
              data: (() => {
                const income = dashboardData.financeSummary?.reduce(
                  (acc, item) => item._id?.type === "Income" ? acc + (item.totalAmount || 0) : acc,
                  0
                ) || 0;
                const expense = dashboardData.financeSummary?.reduce(
                  (acc, item) => item._id?.type === "Expense" ? acc + (item.totalAmount || 0) : acc,
                  0
                ) || 0;
                return [income, expense, income - expense];
              })(),
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)", // Green for income
                "rgba(255, 99, 132, 0.8)", // Red for expenses
                (() => {
                  const income = dashboardData.financeSummary?.reduce(
                    (acc, item) => item._id?.type === "Income" ? acc + (item.totalAmount || 0) : acc, 0
                  ) || 0;
                  const expense = dashboardData.financeSummary?.reduce(
                    (acc, item) => item._id?.type === "Expense" ? acc + (item.totalAmount || 0) : acc, 0
                  ) || 0;
                  return income > expense ? "rgba(75, 192, 192, 0.8)" : "rgba(255, 99, 132, 0.8)";
                })()
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Profit & Loss - Bottom Line
      {
        title: t("dashboard.profit_loss"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.profit"), t("dashboard.loss")],
          datasets: [
            {
              data: (() => {
                const income = dashboardData.financeSummary?.reduce(
                  (acc, item) => item._id?.type === "Income" ? acc + (item.totalAmount || 0) : acc,
                  0
                ) || 0;
                const expenses = dashboardData.financeSummary?.reduce(
                  (acc, item) => item._id?.type === "Expense" ? acc + (item.totalAmount || 0) : acc,
                  0
                ) || 0;
                const netProfit = income - expenses;
                return netProfit >= 0 ? [netProfit, 0] : [0, Math.abs(netProfit)];
              })(),
              backgroundColor: ["rgba(75, 192, 192, 0.8)", "rgba(255, 99, 132, 0.8)"],
              borderWidth: 3,
            },
          ],
        },
      },
      // 3. Transaction Types Breakdown
      {
        title: t("dashboard.transaction_types"),
        type: "Pie",
        data: {
          labels: dashboardData.financeSummary?.map(
            (item) => `${item._id?.type || t("dashboard.unknown")}`
          ) || [],
          datasets: [
            {
              data: dashboardData.financeSummary?.map((item) => item.totalAmount || 0) || [],
              backgroundColor: dashboardData.financeSummary?.map((item) => 
                item._id?.type === "Income" ? "rgba(75, 192, 192, 0.7)" : "rgba(255, 99, 132, 0.7)"
              ) || [],
            },
          ],
        },
      },
      // 4. Transaction Status - Track completion
      {
        title: t("dashboard.transaction_status"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.completed"), t("dashboard.pending"), t("dashboard.cancelled")],
          datasets: [
            {
              data: [
                dashboardData.financeSummary?.reduce(
                  (acc, item) => acc + (item._id?.status === "Completed" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.financeSummary?.reduce(
                  (acc, item) => acc + (item._id?.status === "Pending" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.financeSummary?.reduce(
                  (acc, item) => acc + (item._id?.status === "Cancelled" ? item.count : 0),
                  0
                ) || 0,
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)", // Green for completed
                "rgba(255, 206, 86, 0.8)", // Yellow for pending
                "rgba(255, 99, 132, 0.8)"  // Red for cancelled
              ],
            },
          ],
        },
      },
    ],
    Tasks: [
      // 1. Task Completion Rate - Key Performance Indicator
      {
        title: t("dashboard.completion_rate"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.completed"), t("dashboard.in_progress"), t("dashboard.pending"), t("dashboard.overdue")],
          datasets: [
            {
              data: [
                dashboardData.taskSummary?.reduce(
                  (acc, item) => acc + (item._id?.status === "Completed" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.taskSummary?.reduce(
                  (acc, item) => acc + (item._id?.status === "In Progress" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.taskSummary?.reduce(
                  (acc, item) => acc + (item._id?.status === "Pending" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.overdueTasks?.length || 0,
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)", // Green - completed
                "rgba(54, 162, 235, 0.8)", // Blue - in progress
                "rgba(255, 206, 86, 0.8)", // Yellow - pending
                "rgba(255, 99, 132, 0.8)"  // Red - overdue
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Critical: Overdue Tasks Alert
      {
        title: t("dashboard.task_overdue"),
        type: "Bar",
        data: {
          labels: dashboardData.overdueTasks?.map(
            (item) => (item.title || t("dashboard.unknown")).substring(0, 20)
          ).slice(0, 10) || [],
          datasets: [
            {
              label: t("dashboard.days_overdue"),
              data: dashboardData.overdueTasks?.map((item) =>
                Math.ceil((new Date() - new Date(item.dueDate)) / (1000 * 60 * 60 * 24))
              ).slice(0, 10) || [],
              backgroundColor: dashboardData.overdueTasks?.map((item) => {
                const days = Math.ceil((new Date() - new Date(item.dueDate)) / (1000 * 60 * 60 * 24));
                return days > 14 ? "rgba(139, 0, 0, 0.9)" :  // Dark red - very critical
                       days > 7 ? "rgba(255, 99, 132, 0.8)" : // Red - critical
                       days > 3 ? "rgba(255, 159, 64, 0.8)" : // Orange - urgent
                       "rgba(255, 206, 86, 0.8)"; // Yellow - warning
              }).slice(0, 10) || [],
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Priority Distribution - What needs attention
      {
        title: t("dashboard.task_priority"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.high"), t("dashboard.medium"), t("dashboard.low")],
          datasets: [
            {
              data: [
                dashboardData.taskSummary?.reduce(
                  (acc, item) => acc + (item._id?.priority === "high" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.taskSummary?.reduce(
                  (acc, item) => acc + (item._id?.priority === "medium" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.taskSummary?.reduce(
                  (acc, item) => acc + (item._id?.priority === "low" ? item.count : 0),
                  0
                ) || 0,
              ],
              backgroundColor: [
                "rgba(255, 99, 132, 0.8)", // Red for high priority
                "rgba(255, 206, 86, 0.8)", // Yellow for medium
                "rgba(75, 192, 192, 0.8)"  // Green for low
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 4. Task Status Distribution
      {
        title: t("dashboard.task_status"),
        type: "Bar",
        data: {
          labels: dashboardData.taskSummary?.map(
            (item) => `${item._id?.status || t("dashboard.unknown")}`
          ).slice(0, 5) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.taskSummary?.map((item) => item.count || 0).slice(0, 5) || [],
              backgroundColor: dashboardData.taskSummary?.map((item) => {
                const status = item._id?.status;
                return status === "Completed" ? "rgba(75, 192, 192, 0.8)" :
                       status === "In Progress" ? "rgba(54, 162, 235, 0.8)" :
                       status === "Pending" ? "rgba(255, 206, 86, 0.8)" :
                       "rgba(255, 99, 132, 0.8)";
              }).slice(0, 5) || [],
              borderWidth: 2,
            },
          ],
        },
      },
    ],
    Procurement: [
      // 1. Order Status - Current state of all orders
      {
        title: t("dashboard.order_status"),
        type: "Doughnut",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => item._id?.status || t("dashboard.unknown")
          ) || [],
          datasets: [
            {
              data: dashboardData.procurementSummary?.map((item) => item.count || 0) || [],
              backgroundColor: dashboardData.procurementSummary?.map((item) => {
                const status = item._id?.status;
                return status === "Completed" ? "rgba(75, 192, 192, 0.8)" :
                       status === "Pending" ? "rgba(255, 206, 86, 0.8)" :
                       status === "Approved" ? "rgba(54, 162, 235, 0.8)" :
                       status === "Rejected" ? "rgba(255, 99, 132, 0.8)" :
                       "rgba(156, 156, 156, 0.8)";
              }) || [],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Payment Health - Critical for cash flow
      {
        title: t("dashboard.payment_status"),
        type: "Pie",
        data: {
          labels: [t("dashboard.paid"), t("dashboard.partial"), t("dashboard.unpaid")],
          datasets: [
            {
              data: [
                dashboardData.procurementSummary?.reduce(
                  (acc, item) => acc + (item._id?.paymentStatus === "Paid" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.procurementSummary?.reduce(
                  (acc, item) => acc + (item._id?.paymentStatus === "Partial" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.procurementSummary?.reduce(
                  (acc, item) => acc + (item._id?.paymentStatus === "Unpaid" ? item.count : 0),
                  0
                ) || 0,
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)", // Green - paid
                "rgba(255, 206, 86, 0.8)", // Yellow - partial
                "rgba(255, 99, 132, 0.8)"  // Red - unpaid
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Cost Analysis by Status
      {
        title: t("dashboard.total_cost"),
        type: "Bar",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => `${item._id?.status || t("dashboard.unknown")}`
          ).slice(0, 5) || [],
          datasets: [
            {
              label: t("dashboard.total_cost"),
              data: dashboardData.procurementSummary?.map((item) => item.totalCost || 0).slice(0, 5) || [],
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 4. Procurement Count by Status
      {
        title: t("dashboard.procurement_count"),
        type: "Bar",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => `${item._id?.status || t("dashboard.unknown")}`
          ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.procurementSummary?.map((item) => item.count || 0) || [],
              backgroundColor: "rgba(75, 192, 192, 0.7)",
              borderWidth: 2,
            },
          ],
        },
      },
    ],
    Events: [
      // 1. Upcoming Events Timeline - Next 7 days
      {
        title: t("dashboard.event_types"),
        type: "Doughnut",
        data: {
          labels: dashboardData.upcomingEvents?.map(
            (item) => item.eventType || t("dashboard.unknown")
          ) || [],
          datasets: [
            {
              data: dashboardData.upcomingEvents?.reduce((acc, event) => {
                const type = event.eventType || t("dashboard.unknown");
                const index = acc.findIndex(item => item.type === type);
                if (index >= 0) {
                  acc[index].count++;
                } else {
                  acc.push({ type, count: 1 });
                }
                return acc;
              }, []).map(item => item.count) || [],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Event Participation - Who's attending
      {
        title: t("dashboard.participant_count"),
        type: "Bar",
        data: {
          labels: dashboardData.upcomingEvents?.map(
            (item) => (item.title || t("dashboard.unknown")).substring(0, 20)
          ).slice(0, 5) || [],
          datasets: [
            {
              label: t("dashboard.participants"),
              data: dashboardData.upcomingEvents?.map(
                (item) => item.participants?.length || 0
              ).slice(0, 5) || [],
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Event Type Split
      {
        title: t("dashboard.all_day_events"),
        type: "Pie",
        data: {
          labels: [t("dashboard.status.all_day"), t("dashboard.status.timed")],
          datasets: [
            {
              data: [
                dashboardData.upcomingEvents?.filter((e) => e.allDay)?.length || 0,
                dashboardData.upcomingEvents?.filter((e) => !e.allDay)?.length || 0,
              ],
              backgroundColor: ["rgba(255, 206, 86, 0.8)", "rgba(54, 162, 235, 0.8)"],
              borderWidth: 2,
            },
          ],
        },
      },
    ],
    Inventory: [
      // 1. CRITICAL ALERT: Low Stock Items
      {
        title: t("dashboard.low_stock_items"),
        type: "Bar",
        data: {
          labels: dashboardData.lowStockInventory?.map(
            (item) => (item.productId?.productName || t("dashboard.unknown")).substring(0, 15)
          ).slice(0, 10) || [],
          datasets: [
            {
              label: t("dashboard.quantity"),
              data: dashboardData.lowStockInventory?.map((item) => item.quantity || 0).slice(0, 10) || [],
              backgroundColor: dashboardData.lowStockInventory?.map((item) => {
                const ratio = (item.quantity || 0) / (item.minStockLevel || 1);
                return ratio === 0 ? "rgba(139, 0, 0, 0.9)" :  // Dark red - out of stock
                       ratio < 0.3 ? "rgba(255, 99, 132, 0.8)" : // Red - critical
                       ratio < 0.5 ? "rgba(255, 159, 64, 0.8)" : // Orange - warning
                       "rgba(255, 206, 86, 0.8)"; // Yellow - low
              }).slice(0, 10) || [],
              borderWidth: 2,
            },
            {
              label: t("dashboard.min_stock"),
              data: dashboardData.lowStockInventory?.map((item) => item.minStockLevel || 0).slice(0, 10) || [],
              backgroundColor: "rgba(75, 192, 192, 0.5)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. CRITICAL ALERT: Expiration Risk
      {
        title: t("dashboard.expiration_risk"),
        type: "Bar",
        data: {
          labels: dashboardData.inventoryExpiration?.map(
            (item) => (item.productId?.productName || t("dashboard.unknown")).substring(0, 15)
          ).slice(0, 10) || [],
          datasets: [
            {
              label: t("dashboard.days_to_expire"),
              data: dashboardData.inventoryExpiration?.map((item) =>
                Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
              ).slice(0, 10) || [],
              backgroundColor: dashboardData.inventoryExpiration?.map((item) => {
                const days = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                return days < 3 ? "rgba(139, 0, 0, 0.9)" :  // Dark red - urgent
                       days < 7 ? "rgba(255, 99, 132, 0.8)" : // Red - critical
                       days < 14 ? "rgba(255, 159, 64, 0.8)" : // Orange - warning
                       "rgba(255, 206, 86, 0.8)"; // Yellow - monitor
              }).slice(0, 10) || [],
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Stock Status Overview
      {
        title: t("dashboard.stock_status"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.out_of_stock"), t("dashboard.low_stock"), t("dashboard.active")],
          datasets: [
            {
              data: [
                dashboardData.lowStockInventory?.filter(item => item.quantity === 0)?.length || 0,
                dashboardData.lowStockInventory?.filter(item => 
                  item.quantity > 0 && item.quantity < (item.minStockLevel || 10)
                )?.length || 0,
                dashboardData.lowStockInventory?.filter(item => 
                  item.quantity >= (item.minStockLevel || 10)
                )?.length || 0,
              ],
              backgroundColor: [
                "rgba(255, 99, 132, 0.8)", // Red - out of stock
                "rgba(255, 206, 86, 0.8)", // Yellow - low stock
                "rgba(75, 192, 192, 0.8)"  // Green - active
              ],
              borderWidth: 2,
            },
          ],
        },
      },
    ],
    Suppliers: [
      // 1. Supplier Status - Active vs Inactive
      {
        title: t("dashboard.supplier_activity"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.active"), t("dashboard.inactive")],
          datasets: [
            {
              data: [
                getSuppliersData().active?.length || 0,
                getSuppliersData().inactive?.length || 0,
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)", // Green - active
                "rgba(156, 156, 156, 0.8)"  // Gray - inactive
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Top Rated Suppliers
      {
        title: t("dashboard.supplier_ratings"),
        type: "Bar",
        data: {
          labels: (getSuppliersData().active || [])
            .sort((a, b) => {
              const ratingA = a.averageRating && a.averageRating > 0 ? a.averageRating : 1;
              const ratingB = b.averageRating && b.averageRating > 0 ? b.averageRating : 1;
              return ratingB - ratingA;
            })
            .slice(0, 10)
            .map((s) => (s.SupplierName || t("dashboard.unknown")).substring(0, 15)),
          datasets: [
            {
              label: t("dashboard.rating"),
              data: (getSuppliersData().active || [])
                .sort((a, b) => {
                  const ratingA = a.averageRating && a.averageRating > 0 ? a.averageRating : 1;
                  const ratingB = b.averageRating && b.averageRating > 0 ? b.averageRating : 1;
                  return ratingB - ratingA;
                })
                .slice(0, 10)
                .map((s) => s.averageRating && s.averageRating > 0 ? s.averageRating : 1),
              backgroundColor: (getSuppliersData().active || [])
                .sort((a, b) => {
                  const ratingA = a.averageRating && a.averageRating > 0 ? a.averageRating : 1;
                  const ratingB = b.averageRating && b.averageRating > 0 ? b.averageRating : 1;
                  return ratingB - ratingA;
                })
                .slice(0, 10)
                .map((s) => {
                  const rating = s.averageRating && s.averageRating > 0 ? s.averageRating : 1;
                  return rating >= 4 ? "rgba(75, 192, 192, 0.8)" : // Green - excellent
                         rating >= 3 ? "rgba(54, 162, 235, 0.8)" : // Blue - good
                         rating >= 2 ? "rgba(255, 206, 86, 0.8)" : // Yellow - average
                         "rgba(255, 99, 132, 0.8)"; // Red - poor
                }),
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Product Coverage per Supplier
      {
        title: t("dashboard.product_supply_count"),
        type: "Bar",
        data: {
          labels: (getSuppliersData().active || [])
            .sort((a, b) => (b.ProductsSupplied?.length || 0) - (a.ProductsSupplied?.length || 0))
            .slice(0, 8)
            .map((s) => (s.SupplierName || t("dashboard.unknown")).substring(0, 15)),
          datasets: [
            {
              label: t("dashboard.products"),
              data: (getSuppliersData().active || [])
                .sort((a, b) => (b.ProductsSupplied?.length || 0) - (a.ProductsSupplied?.length || 0))
                .slice(0, 8)
                .map((s) => s.ProductsSupplied?.length || 0),
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 4. Total Supplier Count
      {
        title: t("dashboard.supplier_count"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.active"), t("dashboard.inactive")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: [
                getSuppliersData().active?.length || 0,
                getSuppliersData().inactive?.length || 0,
              ],
              backgroundColor: ["rgba(75, 192, 192, 0.8)", "rgba(156, 156, 156, 0.6)"],
              borderWidth: 2,
            },
          ],
        },
      },
    ],
    Customers: [
      // 1. Customer Status Distribution
      {
        title: t("dashboard.customer_status"),
        type: "Doughnut",
        data: {
          labels: dashboardData.customerSummary?.map(
            (item) => item._id || t("dashboard.unknown")
          ) || [],
          datasets: [
            {
              data: dashboardData.customerSummary?.map((item) => item.count || 0) || [],
              backgroundColor: dashboardData.customerSummary?.map((item) => {
                const status = item._id;
                return status === "Active" ? "rgba(75, 192, 192, 0.8)" :
                       status === "Inactive" ? "rgba(156, 156, 156, 0.7)" :
                       status === "VIP" ? "rgba(255, 215, 0, 0.8)" :
                       "rgba(54, 162, 235, 0.8)";
              }) || [],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Revenue by Customer Status
      {
        title: t("dashboard.order_totals"),
        type: "Bar",
        data: {
          labels: dashboardData.customerOrderSummary
            ?.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
            .slice(0, 8)
            .map((item) => (item._id || t("dashboard.unknown")).substring(0, 15)) || [],
          datasets: [
            {
              label: t("dashboard.order_amount"),
              data: dashboardData.customerOrderSummary
                ?.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
                .slice(0, 8)
                .map((item) => item.totalAmount || 0) || [],
              backgroundColor: "rgba(75, 192, 192, 0.7)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Order Count by Status
      {
        title: t("dashboard.order_status"),
        type: "Pie",
        data: {
          labels: dashboardData.customerOrderSummary?.map(
            (item) => item._id || t("dashboard.unknown")
          ) || [],
          datasets: [
            {
              data: dashboardData.customerOrderSummary?.map((item) => item.totalOrders || 0) || [],
              backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 4. Customer Growth Trend
      {
        title: t("dashboard.customer_trend"),
        type: "Line",
        data: {
          labels: dashboardData.customerSummary?.map(
            (item) => item._id || t("dashboard.unknown")
          ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.customerSummary?.map((item) => item.count || 0) || [],
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
      },
    ],
    Departments: [
      // 1. Total Departments Overview
      {
        title: t("dashboard.department_count"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.total")],
          datasets: [
            {
              data: [dashboardData.departmentSummary?.[0]?.totalDepartments || 0],
              backgroundColor: ["rgba(54, 162, 235, 0.8)"],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Employee Distribution by Department
      {
        title: t("dashboard.employee_count"),
        type: "Bar",
        data: {
          labels: (() => {
            const deptCounts = {};
            dashboardData.employees?.forEach(emp => {
              const dept = emp.department?.name || t("dashboard.unknown");
              deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            });
            return Object.keys(deptCounts).slice(0, 10);
          })(),
          datasets: [
            {
              label: t("dashboard.members"),
              data: (() => {
                const deptCounts = {};
                dashboardData.employees?.forEach(emp => {
                  const dept = emp.department?.name || t("dashboard.unknown");
                  deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                });
                return Object.values(deptCounts).slice(0, 10);
              })(),
              backgroundColor: "rgba(75, 192, 192, 0.7)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Team Size Distribution
      {
        title: t("dashboard.team_size"),
        type: "Pie",
        data: {
          labels: (() => {
            const deptCounts = {};
            dashboardData.employees?.forEach(emp => {
              const dept = emp.department?.name || t("dashboard.unknown");
              deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            });
            return Object.keys(deptCounts);
          })(),
          datasets: [
            {
              data: (() => {
                const deptCounts = {};
                dashboardData.employees?.forEach(emp => {
                  const dept = emp.department?.name || t("dashboard.unknown");
                  deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                });
                return Object.values(deptCounts);
              })(),
              backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
              ],
              borderWidth: 2,
            },
          ],
        },
      },
    ],
    Performance: [
      // 1. Review Status Distribution
      {
        title: t("dashboard.review_status"),
        type: "Doughnut",
        data: {
          labels: (() => {
            const statusCounts = {};
            dashboardData.performanceReviews?.forEach(review => {
              const status = review.status || t("dashboard.unknown");
              statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            return Object.keys(statusCounts);
          })(),
          datasets: [
            {
              data: (() => {
                const statusCounts = {};
                dashboardData.performanceReviews?.forEach(review => {
                  const status = review.status || t("dashboard.unknown");
                  statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                return Object.values(statusCounts);
              })(),
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)",
                "rgba(255, 206, 86, 0.8)",
                "rgba(255, 99, 132, 0.8)"
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Top/Bottom Performers
      {
        title: t("dashboard.average_scores"),
        type: "Bar",
        data: {
          labels: dashboardData.performanceReviews
            ?.sort((a, b) => {
              const scoreA = a.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (a.responses?.length || 1);
              const scoreB = b.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (b.responses?.length || 1);
              return scoreB - scoreA;
            })
            .slice(0, 10)
            .map((item) => (item.employeeId?.name || t("dashboard.unknown")).substring(0, 15)) || [],
          datasets: [
            {
              label: t("dashboard.score"),
              data: dashboardData.performanceReviews
                ?.sort((a, b) => {
                  const scoreA = a.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (a.responses?.length || 1);
                  const scoreB = b.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (b.responses?.length || 1);
                  return scoreB - scoreA;
                })
                .slice(0, 10)
                .map((item) =>
                  (item.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (item.responses?.length || 1)).toFixed(1)
                ) || [],
              backgroundColor: dashboardData.performanceReviews
                ?.sort((a, b) => {
                  const scoreA = a.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (a.responses?.length || 1);
                  const scoreB = b.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (b.responses?.length || 1);
                  return scoreB - scoreA;
                })
                .slice(0, 10)
                .map((item) => {
                  const score = item.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (item.responses?.length || 1);
                  return score >= 4 ? "rgba(75, 192, 192, 0.8)" : // Green - excellent
                         score >= 3 ? "rgba(54, 162, 235, 0.8)" : // Blue - good
                         score >= 2 ? "rgba(255, 206, 86, 0.8)" : // Yellow - needs improvement
                         "rgba(255, 99, 132, 0.8)"; // Red - poor
                }) || [],
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Performance Score Trend
      {
        title: t("dashboard.score_trend"),
        type: "Line",
        data: {
          labels: dashboardData.performanceReviews
            ?.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .slice(0, 12)
            .map((item) => item.createdAt?.slice(5, 10) || t("dashboard.not_available")) || [],
          datasets: [
            {
              label: t("dashboard.score"),
              data: dashboardData.performanceReviews
                ?.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .slice(0, 12)
                .map((item) =>
                  (item.responses?.reduce((acc, res) => acc + (res.answers[0]?.value || 0), 0) / (item.responses?.length || 1)).toFixed(1)
                ) || [],
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
      },
    ],
    Products: [
      // 1. Product Categories Distribution
      {
        title: t("dashboard.product_categories"),
        type: "Doughnut",
        data: {
          labels: (() => {
            const categoryCounts = {};
            dashboardData.products?.forEach(product => {
              const category = product.category || t("dashboard.unknown");
              categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            return Object.keys(categoryCounts);
          })(),
          datasets: [
            {
              data: (() => {
                const categoryCounts = {};
                dashboardData.products?.forEach(product => {
                  const category = product.category || t("dashboard.unknown");
                  categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                });
                return Object.values(categoryCounts);
              })(),
              backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Top Products by Price
      {
        title: t("dashboard.unit_prices"),
        type: "Bar",
        data: {
          labels: dashboardData.products
            ?.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0))
            .slice(0, 10)
            .map((item) => (item.productName || t("dashboard.unknown")).substring(0, 15)) || [],
          datasets: [
            {
              label: t("dashboard.price"),
              data: dashboardData.products
                ?.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0))
                .slice(0, 10)
                .map((item) => item.unitPrice || 0) || [],
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Product Type Distribution
      {
        title: t("dashboard.product_type"),
        type: "Pie",
        data: {
          labels: ["Purchase", "Sale", "Both"],
          datasets: [
            {
              data: [
                dashboardData.products?.filter((p) => p.productType === "purchase")?.length || 0,
                dashboardData.products?.filter((p) => p.productType === "sale")?.length || 0,
                dashboardData.products?.filter((p) => p.productType === "both")?.length || 0,
              ],
              backgroundColor: [
                "rgba(255, 206, 86, 0.8)",
                "rgba(75, 192, 192, 0.8)",
                "rgba(54, 162, 235, 0.8)"
              ],
              borderWidth: 2,
            },
          ],
        },
      },
      // 4. Product Component Analysis
      {
        title: t("dashboard.component_count"),
        type: "Bar",
        data: {
          labels: dashboardData.productTrees
            ?.sort((a, b) => (b.components?.length || 0) - (a.components?.length || 0))
            .slice(0, 8)
            .map((item) => (item.productId?.productName || t("dashboard.unknown")).substring(0, 15)) || [],
          datasets: [
            {
              label: t("dashboard.components"),
              data: dashboardData.productTrees
                ?.sort((a, b) => (b.components?.length || 0) - (a.components?.length || 0))
                .slice(0, 8)
                .map((item) => item.components?.length || 0) || [],
              backgroundColor: "rgba(255, 99, 132, 0.7)",
              borderWidth: 2,
            },
          ],
        },
      },
    ],
    Projects: [
      // 1. Project Status Health
      {
        title: t("dashboard.project_status"),
        type: "Doughnut",
        data: {
          labels: (() => {
            const statusCounts = {};
            dashboardData.projects?.forEach(project => {
              const status = project.status || t("dashboard.unknown");
              statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            return Object.keys(statusCounts);
          })(),
          datasets: [
            {
              data: (() => {
                const statusCounts = {};
                dashboardData.projects?.forEach(project => {
                  const status = project.status || t("dashboard.unknown");
                  statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                return Object.values(statusCounts);
              })(),
              backgroundColor: (() => {
                const statusCounts = {};
                dashboardData.projects?.forEach(project => {
                  const status = project.status || t("dashboard.unknown");
                  statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                return Object.keys(statusCounts).map(status => {
                  return status === "Completed" ? "rgba(75, 192, 192, 0.8)" :
                         status === "In Progress" ? "rgba(54, 162, 235, 0.8)" :
                         status === "Planning" ? "rgba(255, 206, 86, 0.8)" :
                         status === "On Hold" ? "rgba(255, 159, 64, 0.8)" :
                         "rgba(156, 156, 156, 0.7)";
                });
              })(),
              borderWidth: 2,
            },
          ],
        },
      },
      // 2. Project Progress - Visual health check
      {
        title: t("dashboard.progress_trend"),
        type: "Bar",
        data: {
          labels: dashboardData.projects
            ?.slice(0, 10)
            .map((item) => (item.name || t("dashboard.unknown")).substring(0, 15)) || [],
          datasets: [
            {
              label: t("dashboard.progress") + " %",
              data: dashboardData.projects?.slice(0, 10).map((item) => item.progress || 0) || [],
              backgroundColor: dashboardData.projects?.slice(0, 10).map((item) => {
                const progress = item.progress || 0;
                return progress >= 80 ? "rgba(75, 192, 192, 0.8)" : // Green - almost done
                       progress >= 50 ? "rgba(54, 162, 235, 0.8)" : // Blue - on track
                       progress >= 25 ? "rgba(255, 206, 86, 0.8)" : // Yellow - started
                       "rgba(255, 99, 132, 0.8)"; // Red - not started/delayed
              }) || [],
              borderWidth: 2,
            },
          ],
        },
      },
      // 3. Budget Allocation by Project
      {
        title: t("dashboard.budget_allocation"),
        type: "Bar",
        data: {
          labels: dashboardData.projects
            ?.sort((a, b) => (b.budget || 0) - (a.budget || 0))
            .slice(0, 8)
            .map((item) => (item.name || t("dashboard.unknown")).substring(0, 15)) || [],
          datasets: [
            {
              label: t("dashboard.total_budget"),
              data: dashboardData.projects
                ?.sort((a, b) => (b.budget || 0) - (a.budget || 0))
                .slice(0, 8)
                .map((item) => item.budget || 0) || [],
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderWidth: 2,
            },
          ],
        },
      },
      // 4. Team Allocation per Project
      {
        title: t("dashboard.team_size"),
        type: "Pie",
        data: {
          labels: dashboardData.projects
            ?.sort((a, b) => (b.teamMembers?.length || 0) - (a.teamMembers?.length || 0))
            .slice(0, 8)
            .map((item) => (item.name || t("dashboard.unknown")).substring(0, 15)) || [],
          datasets: [
            {
              data: dashboardData.projects
                ?.sort((a, b) => (b.teamMembers?.length || 0) - (a.teamMembers?.length || 0))
                .slice(0, 8)
                .map((item) => item.teamMembers?.length || 0) || [],
              backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#8A2BE2", "#00CED1"
              ],
              borderWidth: 2,
            },
          ],
        },
      },
    ],
  };

  const categoryTables = {
    Budget: getBudgetData().summary || [],
    Finance: getFinanceData().summary || [],
    Tasks: getTasksData().summary || [],
    Procurement: getProcurementData().summary || [],
    Events: getEventsData().upcoming || [],
    Inventory: getInventoryData().lowStock || [],
    Suppliers: getSuppliersData().active || [],
    Customers: getCustomersData().summary || [],
    Departments: getDepartmentsData().metrics || [],
    Performance: getPerformanceData().summary || [],
    Products: getProductsData().summary || [],
    Projects: getProjectsData().summary || [],
  };

  const getKeyFields = (category) => {
    const data = categoryTables[category];
    if (!data || data.length === 0) return ["Name", "Value", "Status"];

    switch (category) {
      case "Budget":
        return ["departmentOrProjectName", "totalBudget", "status"];
      case "Finance":
        return ["transactionDescription", "totalAmount", "transactionType"];
      case "Tasks":
        return ["title", "dueDate", "status"];
      case "Procurement":
        return ["supplierName", "totalCost", "orderStatus"];
      case "Events":
        return ["title", "startDate", "eventType"];
      case "Inventory":
        return ["productName", "quantity", "expirationDate"];
      case "Suppliers":
        return ["SupplierName", "Email", "Rating", "IsActive"];
      case "Customers":
        return ["name", "email", "status"];
      case "Departments":
        return ["name", "description", "totalDepartments"];
      case "Performance":
        return ["title", "employeeName", "status"];
      case "Products":
        return ["productName", "category", "unitPrice"];
      case "Projects":
        return ["name", "projectManagerName", "status"];
      default:
        return ["Name", "Value", "Status"];
    }
  };

  const transformTableData = (category, data) => {
    return data.map((item) => {
      switch (category) {
        case "Budget":
          return {
            departmentOrProjectName:
              item.departmentOrProjectName || item._id || t("dashboard.unknown"),
            totalBudget: item.totalBudget || 0,
            status: item._id || t("dashboard.not_available"),
          };
        case "Finance":
          return {
            transactionDescription:
              item.transactionDescription ||
              `${item._id?.type}-${item._id?.status}`,
            totalAmount: item.totalAmount || 0,
            transactionType: item._id?.type || t("dashboard.not_available"),
          };
        case "Tasks":
          return {
            title: item.title || `${item._id?.status}-${item._id?.priority}`,
            dueDate: item.dueDate
              ? new Date(item.dueDate).toLocaleDateString()
              : t("dashboard.not_available"),
            status: item._id?.status || item.status || t("dashboard.not_available"),
          };
        case "Procurement":
          return {
            supplierName: item.supplierName || t("dashboard.unknown"),
            totalCost: item.totalCost || 0,
            orderStatus: item._id?.status || t("dashboard.not_available"),
          };
        case "Events":
          return {
            title: item.title || t("dashboard.unknown"),
            startDate: item.startDate
              ? new Date(item.startDate).toLocaleDateString()
              : t("dashboard.not_available"),
            eventType: item.eventType || t("dashboard.not_available"),
          };
        case "Inventory":
          return {
            productName: item.productId?.productName || t("dashboard.unknown"),
            quantity: item.quantity || 0,
            expirationDate: item.expirationDate
              ? new Date(item.expirationDate).toLocaleDateString()
              : t("dashboard.not_available"),
          };
        case "Suppliers":
          const displayRating = item.averageRating && item.averageRating > 0 
            ? item.averageRating.toFixed(1) 
            : "1.0";
          const ratingCount = item.Rating?.length || 0;
          return {
            SupplierName: item.SupplierName || t("dashboard.unknown"),
            Email: item.Email || t("dashboard.not_available"),
            Rating: `⭐ ${displayRating}/5${ratingCount > 0 ? ` (${ratingCount})` : ''}`,
            IsActive: item.IsActive ? t("dashboard.yes") : t("dashboard.no"),
          };
        case "Customers":
          return {
            name: item.name || item._id || t("dashboard.unknown"),
            email: item.email || t("dashboard.not_available"),
            status: item._id || item.status || t("dashboard.not_available"),
          };
        case "Departments":
          return {
            name: item.name || t("dashboard.total"),
            description: item.description || t("dashboard.not_available"),
            totalDepartments: item.totalDepartments || 0,
          };
        case "Performance":
          return {
            title: item.title || t("dashboard.unknown"),
            employeeName: item.employeeId?.name || t("dashboard.unknown"),
            status: item.status || t("dashboard.not_available"),
          };
        case "Products":
          return {
            productName: item.productName || t("dashboard.unknown"),
            category: item.category || t("dashboard.not_available"),
            unitPrice: item.unitPrice || 0,
          };
        case "Projects":
          return {
            name: item.name || t("dashboard.unknown"),
            projectManagerName: item.projectManager?.name || t("dashboard.unknown"),
            status: item.status || t("dashboard.not_available"),
          };
        default:
          return item;
      }
    });
  };

  const itemsPerPage = 5;

  const getPaginatedData = (category) => {
    const data = categoryTables[category];
    if (!data || data.length === 0) return [];
    const transformedData = transformTableData(category, data);
    const page = currentPage[category] || 1;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transformedData.slice(startIndex, endIndex);
  };

  const getTotalPages = (category) => {
    const data = categoryTables[category];
    return data && data.length > 0 ? Math.ceil(data.length / itemsPerPage) : 1;
  };

  const handlePageChange = (category, page) => {
    setCurrentPage((prev) => ({ ...prev, [category]: page }));
  };

  const handlePrevPage = (category) => {
    const current = currentPage[category] || 1;
    if (current > 1) handlePageChange(category, current - 1);
  };

  const handleNextPage = (category) => {
    const current = currentPage[category] || 1;
    const total = getTotalPages(category);
    if (current < total) handlePageChange(category, current + 1);
  };

  const getPaginationRange = (category) => {
    const totalPages = getTotalPages(category);
    const current = currentPage[category] || 1;
    const maxButtons = 5;
    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return { pages, showEllipsis: end < totalPages, totalPages };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="w-16 h-16 border-4 border-t-4 border-border-color rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const renderChart = (chart) => {
    const data = chart.data.labels.length > 0 ? chart.data : emptyChartData;
    switch (chart.type) {
      case "Bar":
        return <Bar data={data} options={chartOptions} />;
      case "Doughnut":
        return <Doughnut data={data} options={chartOptions} />;
      case "Pie":
        return <Pie data={data} options={chartOptions} />;
      case "Radar":
        return <Radar data={data} options={chartOptions} />;
      case "Line":
        return <Line data={data} options={chartOptions} />;
      default:
        return null;
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        {/* Professional Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
                style={{ color: 'var(--color-primary)' }}
              >
                {t("dashboard.title")}
              </h1>
              <p 
                className="text-lg"
                style={{ color: 'var(--color-secondary)' }}
              >
                {t("dashboard.subtitle")}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className="px-4 py-2 rounded-xl font-medium transition-all shadow-md"
                style={{
                  backgroundColor: showAdvancedAnalytics ? 'var(--color-primary)' : 'var(--border-color)',
                  color: showAdvancedAnalytics ? 'var(--button-text)' : 'var(--text-color)'
                }}
              >
                {showAdvancedAnalytics ? '📊 Analytics מתקדם' : '📈 הצג Analytics'}
              </button>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              <div className="text-right">
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  Last Updated
                </p>
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-color)' }}
                >
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--button-text)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 🚀 ADVANCED ANALYTICS SECTION - NEW! */}
        {showAdvancedAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-8 mb-12"
          >
            {/* Advanced KPI Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  📊 Analytics מתקדם
                </h2>
              </div>
              <AdvancedKPICards />
            </motion.div>

            {/* Revenue vs Expenses & Sales Trends */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RevenueVsExpenses />
              <SalesTrends />
            </div>

            {/* Profitability Analysis */}
            <ProfitabilityAnalysis />

            {/* AI Predictions */}
            <AIPredictions />

            {/* Divider */}
            <div className="relative py-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-6 py-2 text-sm font-semibold text-gray-500 rounded-full shadow-md border border-gray-300">
                  📈 דוחות מפורטים מטה
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* KPI Cards הישנים - מוצגים רק אם Analytics מכובה */}
        {!showAdvancedAnalytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(topMetrics).map(([key, value], index) => {
            const icons = {
              totalRevenue: "💵",
              cashFlow: "💰",
              activeEmployees: "👥",
              taskCompletionRate: "✅",
              totalOrders: "📦",
              inventoryValue: "📊",
              lowStockItems: "⚠️",
              overdueTasksCount: "🔴"
            };
            const colors = {
              totalRevenue: "#10b981", // Green
              cashFlow: "#3b82f6", // Blue
              activeEmployees: "#8b5cf6", // Purple
              taskCompletionRate: "#06b6d4", // Cyan
              totalOrders: "#f59e0b", // Amber
              inventoryValue: "#ec4899", // Pink
              lowStockItems: "#ef4444", // Red
              overdueTasksCount: "#dc2626" // Dark Red
            };
            
            return (
              <motion.div
                key={key}
                variants={cardVariant}
                className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border"
                style={{ 
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--border-color)'
                }}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: colors[key] }}
                  >
                    <span className="text-2xl">{icons[key]}</span>
                  </div>
                  <div className="text-right">
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {value}
                    </p>
                  </div>
                </div>
                <h3 
                  className="text-sm font-medium uppercase tracking-wide"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {topMetricsLabels[key]}
                </h3>
              </motion.div>
            );
            })}
          </div>
        )}

        {/* Business Health Overview - Combined Insights */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div 
            className="rounded-2xl shadow-lg p-6 border"
            style={{ 
              backgroundColor: 'var(--bg-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center space-x-4 mb-6">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-color)' }}
                >
                  {t("dashboard.business_health")}
                </h2>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {t("dashboard.real_time_insights")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Financial Health */}
              <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    💰 {t("dashboard.financial_health")}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    (kpis.cashFlow || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(kpis.cashFlow || 0) > 0 ? '✅ ' + t("dashboard.positive") : '⚠️ ' + t("dashboard.negative")}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.revenue")}:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                      ${(kpis.totalRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.cash_flow")}:</span>
                    <span className={`font-semibold ${(kpis.cashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(kpis.cashFlow || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.inventory_value")}:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                      ${(kpis.inventoryValue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operations Health */}
              <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    ⚙️ {t("dashboard.operations")}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    (kpis.taskCompletionRate || 0) > 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(kpis.taskCompletionRate || 0) > 70 ? '✅ ' + t("dashboard.good") : '⚠️ ' + t("dashboard.needs_attention")}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.task_completion")}:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                      {(kpis.taskCompletionRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.total_orders")}:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                      {kpis.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.active_employees")}:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                      {kpis.activeEmployees || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Critical Alerts */}
              <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    🚨 {t("dashboard.alerts")}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ((kpis.lowStockItems || 0) + (kpis.overdueTasksCount || 0)) > 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {((kpis.lowStockItems || 0) + (kpis.overdueTasksCount || 0)) > 5 ? '⚠️ ' + t("dashboard.action_required") : '✅ ' + t("dashboard.all_good")}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.low_stock")}:</span>
                    <span className={`font-semibold ${(kpis.lowStockItems || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {kpis.lowStockItems || 0} {t("dashboard.items")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.overdue_tasks")}:</span>
                    <span className={`font-semibold ${(kpis.overdueTasksCount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {kpis.overdueTasksCount || 0} {t("dashboard.tasks")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-secondary)' }}>{t("dashboard.active_customers")}:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                      {kpis.activeCustomers || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div 
            className="rounded-2xl shadow-lg p-6 border"
            style={{ 
              backgroundColor: 'var(--bg-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--text-color)' }}
                >
                  {t("dashboard.select_category")}
                </h2>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {t("dashboard.choose_category_analytics")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: selectedCategory === "All" ? 'var(--color-primary)' : 'var(--border-color)',
                    color: selectedCategory === "All" ? 'var(--button-text)' : 'var(--text-color)'
                  }}
                >
                  {t("dashboard.all")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--border-color)',
                      color: selectedCategory === cat ? 'var(--button-text)' : 'var(--text-color)'
                    }}
                  >
                    {categoryTranslations[cat]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {(selectedCategory === "All" ? categories : [selectedCategory]).map(
          (category) => (
            <motion.section
              key={category}
              className="mb-12"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            >
              {/* Category Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-1 h-8 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  ></div>
                  <h2 
                    className="text-3xl font-bold"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {categoryTranslations[category] || category}
                  </h2>
                </div>
                <p 
                  className="ml-6"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {t("dashboard.comprehensive_insights", { category: (categoryTranslations[category] || category).toLowerCase() })}
                </p>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
                {categoryCharts[category]?.map((chart, index) => (
                  <motion.div
                    key={index}
                    variants={cardVariant}
                    className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border"
                    style={{ 
                      backgroundColor: 'var(--bg-color)',
                      borderColor: 'var(--border-color)'
                    }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-color)' }}
                      >
                        {chart.title}
                      </h3>
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: 'var(--button-text)' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="w-full h-64 mb-4">{renderChart(chart)}</div>
                    <button
                      onClick={() =>
                        exportToExcel(
                          categoryTables[category],
                          `${category}_Chart_${index}`
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      style={{
                        backgroundColor: 'var(--button-bg)',
                        color: 'var(--button-text)'
                      }}
                    >
                      📊 {t("dashboard.export_to_excel")}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Summary Table */}
              <motion.div
                variants={cardVariant}
                className="rounded-2xl shadow-lg p-6 border"
                style={{ 
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 
                      className="text-xl font-semibold mb-2"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {t("dashboard.summary_table")}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      {t("dashboard.detailed_breakdown", { category: category.toLowerCase() })}
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--button-text)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                  </div>
                </div>
                <div 
                  className="overflow-x-auto rounded-xl border"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <table 
                    className="w-full text-left border-collapse"
                    style={{ backgroundColor: 'var(--bg-color)' }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-primary)' }}>
                        {getKeyFields(category).map((key) => (
                          <th 
                            key={key} 
                            className="px-6 py-4 text-sm font-semibold uppercase tracking-wide"
                            style={{ color: 'var(--button-text)' }}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ borderColor: 'var(--border-color)' }}>
                      {getPaginatedData(category).length > 0 ? (
                        getPaginatedData(category).map((item, index) => (
                          <tr 
                            key={index} 
                            className="transition-colors duration-200"
                            style={{ 
                              borderBottom: `1px solid var(--border-color)`,
                              ':hover': { backgroundColor: 'var(--color-accent)' }
                            }}
                          >
                            {getKeyFields(category).map((key, i) => (
                              <td 
                                key={i} 
                                className="px-6 py-4 text-sm"
                                style={{ color: 'var(--text-color)' }}
                              >
                                {item[key] !== undefined && item[key] !== null
                                  ? String(item[key])
                                  : t("dashboard.not_available")}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={getKeyFields(category).length}
                            className="px-6 py-12 text-center"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            <div className="flex flex-col items-center">
                              <svg 
                                className="w-12 h-12 mb-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                style={{ color: 'var(--color-secondary)' }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p 
                                className="text-lg font-medium"
                                style={{ color: 'var(--text-color)' }}
                              >
                                {t("dashboard.no_data_available")}
                              </p>
                              <p 
                                className="text-sm"
                                style={{ color: 'var(--color-secondary)' }}
                              >
                                {t("dashboard.no_data_found")}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {categoryTables[category]?.length > itemsPerPage && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <button
                      onClick={() => handlePrevPage(category)}
                      disabled={(currentPage[category] || 1) === 1}
                      className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                      style={{
                        backgroundColor: 'var(--border-color)',
                        color: 'var(--text-color)'
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>{t("dashboard.previous")}</span>
                    </button>

                    {getPaginationRange(category).pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(category, page)}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          currentPage[category] === page
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {getPaginationRange(category).showEllipsis && (
                      <>
                        <span className="px-3 py-2 text-gray-500">...</span>
                        <button
                          onClick={() =>
                            handlePageChange(
                              category,
                              getPaginationRange(category).totalPages
                            )
                          }
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            currentPage[category] ===
                            getPaginationRange(category).totalPages
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {getPaginationRange(category).totalPages}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleNextPage(category)}
                      disabled={
                        (currentPage[category] || 1) === getTotalPages(category)
                      }
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                    >
                      <span>{t("dashboard.next")}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() =>
                      exportToExcel(
                        transformTableData(category, categoryTables[category]),
                        `${category}_Summary`
                      )
                    }
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{t("dashboard.export_to_excel")}</span>
                  </button>
                </div>
              </motion.div>
            </motion.section>
          )
        )}

        {/* Professional Footer */}
        <motion.footer 
          className="mt-16 pt-8 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.dashboard_overview")}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.monitor_metrics")}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.quick_stats")}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("dashboard.total_categories")}</span>
                    <span className="font-medium text-gray-900">{categories.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("dashboard.last_updated")}</span>
                    <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("dashboard.data_points")}</span>
                    <span className="font-medium text-gray-900">
                      {Object.values(topMetrics).reduce((acc, val) => acc + (parseInt(val) || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.actions")}</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm font-medium">
                    📊 {t("dashboard.export_all_data")}
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                    🔄 {t("dashboard.refresh_dashboard")}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                {t("dashboard.footer")} | 
                <span className="ml-2 text-blue-600">{t("dashboard.powered_by")}</span>
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Dashboard;
