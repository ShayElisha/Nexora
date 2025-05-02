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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get(
          "/reports/super-unified-report",
          { withCredentials: true }
        );
        const data = response.data.data || {};
        setDashboardData(data);
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

  const topMetrics = {
    employeeCount: dashboardData.employees?.length || 0,
    financialBalance:
      (dashboardData.financeSummary?.reduce(
        (acc, item) =>
          item._id?.type === "Income"
            ? acc + (item.totalAmount || 0)
            : acc - (item.totalAmount || 0),
        0
      ) || 0) + " USD",
    procurementCount: dashboardData.procurementSummary?.length || 0,
    transactionCount: dashboardData.financeSummary?.length || 0,
  };

  const categoryCharts = {
    Budget: [
      {
        title: t("dashboard.budget_allocation"),
        type: "Pie",
        data: {
          labels:
            dashboardData.budgetSummary?.map((item) => item._id || "Unknown") ||
            [],
          datasets: [
            {
              data:
                dashboardData.budgetSummary?.map(
                  (item) => item.totalBudget || 0
                ) || [],
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
              ],
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_spent_vs_allocated"),
        type: "Bar",
        data: {
          labels:
            dashboardData.budgetSummary?.map((item) => item._id || "Unknown") ||
            [],
          datasets: [
            {
              label: t("dashboard.allocated"),
              data:
                dashboardData.budgetSummary?.map(
                  (item) => item.totalBudget || 0
                ) || [],
              backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
            {
              label: t("dashboard.spent"),
              data:
                dashboardData.budgetSummary?.map(
                  (item) => item.totalSpent || 0
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_status"),
        type: "Doughnut",
        data: {
          labels: ["Draft", "Approved", "Rejected"],
          datasets: [
            {
              data: [
                dashboardData.budgetSummary?.find((b) => b._id === "Draft")
                  ?.count || 0,
                dashboardData.budgetSummary?.find((b) => b._id === "Approved")
                  ?.count || 0,
                dashboardData.budgetSummary?.find((b) => b._id === "Rejected")
                  ?.count || 0,
              ],
              backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.budgetSummary?.map((item) => item._id || "Unknown") ||
            [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.budgetSummary?.map((item) => item.count || 0) ||
                [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.budgetSummary?.map((item) => item._id || "Unknown") ||
            [],
          datasets: [
            {
              label: t("dashboard.total_budget"),
              data:
                dashboardData.budgetSummary?.map(
                  (item) => item.totalBudget || 0
                ) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
    ],
    Finance: [
      {
        title: t("dashboard.transaction_types"),
        type: "Pie",
        data: {
          labels:
            dashboardData.financeSummary?.map(
              (item) => `${item._id?.type}-${item._id?.status}`
            ) || [],
          datasets: [
            {
              data:
                dashboardData.financeSummary?.map(
                  (item) => item.totalAmount || 0
                ) || [],
              backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
            },
          ],
        },
      },
      {
        title: t("dashboard.transaction_amounts"),
        type: "Bar",
        data: {
          labels:
            dashboardData.financeSummary?.map(
              (item) => `${item._id?.type}-${item._id?.status}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.amount"),
              data:
                dashboardData.financeSummary?.map(
                  (item) => item.totalAmount || 0
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.transaction_status"),
        type: "Doughnut",
        data: {
          labels: ["Pending", "Completed", "Cancelled"],
          datasets: [
            {
              data: [
                dashboardData.financeSummary?.reduce(
                  (acc, item) =>
                    acc + (item._id?.status === "Pending" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.financeSummary?.reduce(
                  (acc, item) =>
                    acc + (item._id?.status === "Completed" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.financeSummary?.reduce(
                  (acc, item) =>
                    acc + (item._id?.status === "Cancelled" ? item.count : 0),
                  0
                ) || 0,
              ],
              backgroundColor: ["#FFCE56", "#4BC0C0", "#FF6384"],
            },
          ],
        },
      },
      {
        title: t("dashboard.finance_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.financeSummary?.map(
              (item) => `${item._id?.type}-${item._id?.status}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.amount"),
              data:
                dashboardData.financeSummary?.map(
                  (item) => item.totalAmount || 0
                ) || [],
              borderColor: "#36A2EB",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.transaction_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.financeSummary?.map(
              (item) => `${item._id?.type}-${item._id?.status}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.financeSummary?.map((item) => item.count || 0) ||
                [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Tasks: [
      {
        title: t("dashboard.task_status"),
        type: "Pie",
        data: {
          labels:
            dashboardData.taskSummary?.map(
              (item) => `${item._id?.status}-${item._id?.priority}`
            ) || [],
          datasets: [
            {
              data:
                dashboardData.taskSummary?.map((item) => item.count || 0) || [],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.task_overdue"),
        type: "Bar",
        data: {
          labels:
            dashboardData.overdueTasks?.map(
              (item) => item.title || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.days_overdue"),
              data:
                dashboardData.overdueTasks?.map((item) =>
                  Math.ceil(
                    (new Date() - new Date(item.dueDate)) /
                      (1000 * 60 * 60 * 24)
                  )
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.task_priority"),
        type: "Doughnut",
        data: {
          labels: ["Low", "Medium", "High"],
          datasets: [
            {
              data: [
                dashboardData.taskSummary?.reduce(
                  (acc, item) =>
                    acc + (item._id?.priority === "low" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.taskSummary?.reduce(
                  (acc, item) =>
                    acc + (item._id?.priority === "medium" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.taskSummary?.reduce(
                  (acc, item) =>
                    acc + (item._id?.priority === "high" ? item.count : 0),
                  0
                ) || 0,
              ],
              backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
            },
          ],
        },
      },
      {
        title: t("dashboard.task_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.taskSummary?.map(
              (item) => `${item._id?.status}-${item._id?.priority}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.taskSummary?.map((item) => item.count || 0) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.task_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.taskSummary?.map(
              (item) => `${item._id?.status}-${item._id?.priority}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.taskSummary?.map((item) => item.count || 0) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
    ],
    Procurement: [
      {
        title: t("dashboard.order_status"),
        type: "Pie",
        data: {
          labels:
            dashboardData.procurementSummary?.map(
              (item) => `${item._id?.status}-${item._id?.paymentStatus}`
            ) || [],
          datasets: [
            {
              data:
                dashboardData.procurementSummary?.map(
                  (item) => item.totalCost || 0
                ) || [],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.payment_status"),
        type: "Doughnut",
        data: {
          labels: ["Paid", "Unpaid", "Partial"],
          datasets: [
            {
              data: [
                dashboardData.procurementSummary?.reduce(
                  (acc, item) =>
                    acc + (item._id?.paymentStatus === "Paid" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.procurementSummary?.reduce(
                  (acc, item) =>
                    acc +
                    (item._id?.paymentStatus === "Unpaid" ? item.count : 0),
                  0
                ) || 0,
                dashboardData.procurementSummary?.reduce(
                  (acc, item) =>
                    acc +
                    (item._id?.paymentStatus === "Partial" ? item.count : 0),
                  0
                ) || 0,
              ],
              backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
            },
          ],
        },
      },
      {
        title: t("dashboard.total_cost"),
        type: "Bar",
        data: {
          labels:
            dashboardData.procurementSummary?.map(
              (item) => `${item._id?.status}-${item._id?.paymentStatus}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.total_cost"),
              data:
                dashboardData.procurementSummary?.map(
                  (item) => item.totalCost || 0
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.procurement_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.procurementSummary?.map(
              (item) => `${item._id?.status}-${item._id?.paymentStatus}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.total_cost"),
              data:
                dashboardData.procurementSummary?.map(
                  (item) => item.totalCost || 0
                ) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.procurement_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.procurementSummary?.map(
              (item) => `${item._id?.status}-${item._id?.paymentStatus}`
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.procurementSummary?.map(
                  (item) => item.count || 0
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Events: [
      {
        title: t("dashboard.event_types"),
        type: "Pie",
        data: {
          labels:
            dashboardData.upcomingEvents?.map(
              (item) => item.eventType || "Unknown"
            ) || [],
          datasets: [
            {
              data: dashboardData.upcomingEvents?.map(() => 1) || [],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.participant_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.upcomingEvents?.map(
              (item) => item.title || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.participants"),
              data:
                dashboardData.upcomingEvents?.map(
                  (item) => item.participants?.length || 0
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.event_duration"),
        type: "Line",
        data: {
          labels:
            dashboardData.upcomingEvents?.map(
              (item) => item.title || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.days"),
              data:
                dashboardData.upcomingEvents?.map((item) =>
                  item.endDate && item.startDate
                    ? Math.ceil(
                        (new Date(item.endDate) - new Date(item.startDate)) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 1
                ) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.all_day_events"),
        type: "Doughnut",
        data: {
          labels: ["All Day", "Timed"],
          datasets: [
            {
              data: [
                dashboardData.upcomingEvents?.filter((e) => e.allDay)?.length ||
                  0,
                dashboardData.upcomingEvents?.filter((e) => !e.allDay)
                  ?.length || 0,
              ],
              backgroundColor: ["#FFCE56", "#36A2EB"],
            },
          ],
        },
      },
      {
        title: t("dashboard.event_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.upcomingEvents?.map(
              (item) => item.title || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.upcomingEvents?.map(() => 1) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Inventory: [
      {
        title: t("dashboard.low_stock_items"),
        type: "Bar",
        data: {
          labels:
            dashboardData.lowStockInventory?.map(
              (item) => item.productId?.productName || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.quantity"),
              data:
                dashboardData.lowStockInventory?.map(
                  (item) => item.quantity || 0
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
            {
              label: t("dashboard.min_stock"),
              data:
                dashboardData.lowStockInventory?.map(
                  (item) => item.minStockLevel || 0
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.expiration_risk"),
        type: "Line",
        data: {
          labels:
            dashboardData.inventoryExpiration?.map(
              (item) => item.productId?.productName || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.days_to_expire"),
              data:
                dashboardData.inventoryExpiration?.map((item) =>
                  Math.ceil(
                    (new Date(item.expirationDate) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )
                ) || [],
              borderColor: "#FF6384",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.reorder_quantity"),
        type: "Radar",
        data: {
          labels:
            dashboardData.lowStockInventory?.map(
              (item) => item.productId?.productName || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.reorder"),
              data:
                dashboardData.lowStockInventory?.map(
                  (item) => item.reorderQuantity || 0
                ) || [],
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "#36A2EB",
            },
          ],
        },
      },
      {
        title: t("dashboard.stock_status"),
        type: "Pie",
        data: {
          labels: ["Low Stock", "Adequate"],
          datasets: [
            {
              data: [
                dashboardData.lowStockInventory?.length || 0,
                (dashboardData.inventory?.length || 0) -
                  (dashboardData.lowStockInventory?.length || 0),
              ],
              backgroundColor: ["#FF6384", "#36A2EB"],
            },
          ],
        },
      },
      {
        title: t("dashboard.inventory_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.lowStockInventory?.map(
              (item) => item.productId?.productName || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.lowStockInventory?.map(
                  (item) => item.quantity || 0
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Suppliers: [
      {
        title: t("dashboard.supplier_activity"),
        type: "Pie",
        data: {
          labels: ["Active", "Inactive"],
          datasets: [
            {
              data: [
                dashboardData.suppliers?.filter((s) => s.IsActive)?.length || 0,
                dashboardData.suppliers?.filter((s) => !s.IsActive)?.length ||
                  0,
              ],
              backgroundColor: ["#36A2EB", "#FF6384"],
            },
          ],
        },
      },
      {
        title: t("dashboard.supplier_ratings"),
        type: "Bar",
        data: {
          labels:
            dashboardData.suppliers?.map((s) => s.SupplierName || "Unknown") ||
            [],
          datasets: [
            {
              label: t("dashboard.rating"),
              data:
                dashboardData.suppliers?.map((s) => s.Rating?.[0] || 0) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.product_supply_count"),
        type: "Radar",
        data: {
          labels:
            dashboardData.suppliers?.map((s) => s.SupplierName || "Unknown") ||
            [],
          datasets: [
            {
              label: t("dashboard.products"),
              data:
                dashboardData.suppliers?.map(
                  (s) => s.ProductsSupplied?.length || 0
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "#FF6384",
            },
          ],
        },
      },
      {
        title: t("dashboard.supplier_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.suppliers?.map(
              (s) => s.createdAt?.slice(0, 10) || "N/A"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.suppliers?.map(() => 1) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.supplier_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.suppliers?.map((s) => s.SupplierName || "Unknown") ||
            [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.suppliers?.map(() => 1) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Customers: [
      {
        title: t("dashboard.customer_status"),
        type: "Pie",
        data: {
          labels:
            dashboardData.customerSummary?.map(
              (item) => item._id || "Unknown"
            ) || [],
          datasets: [
            {
              data:
                dashboardData.customerSummary?.map((item) => item.count || 0) ||
                [],
              backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
            },
          ],
        },
      },
      {
        title: t("dashboard.order_totals"),
        type: "Bar",
        data: {
          labels:
            dashboardData.customerOrderSummary?.map(
              (item) => item._id || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.order_amount"),
              data:
                dashboardData.customerOrderSummary?.map(
                  (item) => item.totalAmount || 0
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.order_status"),
        type: "Doughnut",
        data: {
          labels:
            dashboardData.customerOrderSummary?.map(
              (item) => item._id || "Unknown"
            ) || [],
          datasets: [
            {
              data:
                dashboardData.customerOrderSummary?.map(
                  (item) => item.totalOrders || 0
                ) || [],
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
              ],
            },
          ],
        },
      },
      {
        title: t("dashboard.customer_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.customerSummary?.map(
              (item) => item._id || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.customerSummary?.map((item) => item.count || 0) ||
                [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.order_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.customerOrderSummary?.map(
              (item) => item._id || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.customerOrderSummary?.map(
                  (item) => item.totalOrders || 0
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Departments: [
      {
        title: t("dashboard.team_size"),
        type: "Bar",
        data: {
          labels: dashboardData.departmentSummary?.map((item) => "Total") || [],
          datasets: [
            {
              label: t("dashboard.members"),
              data:
                dashboardData.departmentSummary?.map(
                  (item) => item.totalDepartments || 0
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.department_count"),
        type: "Pie",
        data: {
          labels: dashboardData.departmentSummary?.map((item) => "Total") || [],
          datasets: [
            {
              data:
                dashboardData.departmentSummary?.map(
                  (item) => item.totalDepartments || 0
                ) || [],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.department_trend"),
        type: "Line",
        data: {
          labels: dashboardData.departmentSummary?.map((item) => "Total") || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data:
                dashboardData.departmentSummary?.map(
                  (item) => item.totalDepartments || 0
                ) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.department_distribution"),
        type: "Doughnut",
        data: {
          labels: dashboardData.departmentSummary?.map((item) => "Total") || [],
          datasets: [
            {
              data:
                dashboardData.departmentSummary?.map(
                  (item) => item.totalDepartments || 0
                ) || [],
              backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384", "#9966FF"],
            },
          ],
        },
      },
      {
        title: t("dashboard.employee_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.employees?.map(
              (item) => item.department?.name || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.employees?.map(() => 1) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Performance: [
      {
        title: t("dashboard.review_status"),
        type: "Pie",
        data: {
          labels:
            dashboardData.performanceReviews?.map(
              (item) => item.status || "Unknown"
            ) || [],
          datasets: [
            {
              data: dashboardData.performanceReviews?.map(() => 1) || [],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
            },
          ],
        },
      },
      {
        title: t("dashboard.average_scores"),
        type: "Bar",
        data: {
          labels:
            dashboardData.performanceReviews?.map(
              (item) => item.employeeId?.name || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.score"),
              data:
                dashboardData.performanceReviews?.map(
                  (item) =>
                    item.responses?.reduce(
                      (acc, res) => acc + (res.answers[0]?.value || 0),
                      0
                    ) / (item.responses?.length || 1)
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.score_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.performanceReviews?.map(
              (item) => item.createdAt?.slice(0, 10) || "N/A"
            ) || [],
          datasets: [
            {
              label: t("dashboard.score"),
              data:
                dashboardData.performanceReviews?.map(
                  (item) =>
                    item.responses?.reduce(
                      (acc, res) => acc + (res.answers[0]?.value || 0),
                      0
                    ) / (item.responses?.length || 1)
                ) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.response_count"),
        type: "Doughnut",
        data: {
          labels:
            dashboardData.performanceReviews?.map(
              (item) => item.title || "Unknown"
            ) || [],
          datasets: [
            {
              data:
                dashboardData.performanceReviews?.map(
                  (item) => item.responses?.length || 0
                ) || [],
              backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384", "#9966FF"],
            },
          ],
        },
      },
      {
        title: t("dashboard.performance_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.performanceReviews?.map(
              (item) => item.title || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.performanceReviews?.map(() => 1) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
    Products: [
      {
        title: t("dashboard.product_categories"),
        type: "Pie",
        data: {
          labels:
            dashboardData.products?.map((item) => item.category || "Unknown") ||
            [],
          datasets: [
            {
              data: dashboardData.products?.map(() => 1) || [],
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
              ],
            },
          ],
        },
      },
      {
        title: t("dashboard.unit_prices"),
        type: "Bar",
        data: {
          labels:
            dashboardData.products?.map(
              (item) => item.productName || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.price"),
              data:
                dashboardData.products?.map((item) => item.unitPrice || 0) ||
                [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.product_type"),
        type: "Doughnut",
        data: {
          labels: ["Purchase", "Sale", "Both"],
          datasets: [
            {
              data: [
                dashboardData.products?.filter(
                  (p) => p.productType === "purchase"
                )?.length || 0,
                dashboardData.products?.filter((p) => p.productType === "sale")
                  ?.length || 0,
                dashboardData.products?.filter((p) => p.productType === "both")
                  ?.length || 0,
              ],
              backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
            },
          ],
        },
      },
      {
        title: t("dashboard.product_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.products?.map(
              (item) => item.createdAt?.slice(0, 10) || "N/A"
            ) || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.products?.map(() => 1) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.component_count"),
        type: "Radar",
        data: {
          labels:
            dashboardData.productTrees?.map(
              (item) => item.productId?.productName || "Unknown"
            ) || [],
          datasets: [
            {
              label: t("dashboard.components"),
              data:
                dashboardData.productTrees?.map(
                  (item) => item.components?.length || 0
                ) || [],
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "#FF6384",
            },
          ],
        },
      },
    ],
    Projects: [
      {
        title: t("dashboard.project_status"),
        type: "Pie",
        data: {
          labels:
            dashboardData.projects?.map((item) => item.status || "Unknown") ||
            [],
          datasets: [
            {
              data: dashboardData.projects?.map(() => 1) || [],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.team_size"),
        type: "Bar",
        data: {
          labels:
            dashboardData.projects?.map((item) => item.name || "Unknown") || [],
          datasets: [
            {
              label: t("dashboard.members"),
              data:
                dashboardData.projects?.map(
                  (item) => item.teamMembers?.length || 0
                ) || [],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_allocation"),
        type: "Doughnut",
        data: {
          labels:
            dashboardData.projects?.map((item) => item.name || "Unknown") || [],
          datasets: [
            {
              data:
                dashboardData.projects?.map((item) => item.budget || 0) || [],
              backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384", "#9966FF"],
            },
          ],
        },
      },
      {
        title: t("dashboard.progress_trend"),
        type: "Line",
        data: {
          labels:
            dashboardData.projects?.map(
              (item) => item.startDate?.slice(0, 10) || "N/A"
            ) || [],
          datasets: [
            {
              label: t("dashboard.progress"),
              data:
                dashboardData.projects?.map((item) => item.progress || 0) || [],
              borderColor: "#4BC0C0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.project_count"),
        type: "Bar",
        data: {
          labels:
            dashboardData.projects?.map((item) => item.name || "Unknown") || [],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.projects?.map(() => 1) || [],
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
      },
    ],
  };

  const categoryTables = {
    Budget: dashboardData.budgetSummary || [],
    Finance: dashboardData.financeSummary || [],
    Tasks: dashboardData.taskSummary || [],
    Procurement: dashboardData.procurementSummary || [],
    Events: dashboardData.upcomingEvents || [],
    Inventory: dashboardData.lowStockInventory || [],
    Suppliers: dashboardData.suppliers || [],
    Customers: dashboardData.customerSummary || [],
    Departments: dashboardData.departmentSummary || [],
    Performance: dashboardData.performanceReviews || [],
    Products: dashboardData.products || [],
    Projects: dashboardData.projects || [],
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
        return ["SupplierName", "Email", "IsActive"];
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
              item.departmentOrProjectName || item._id || "Unknown",
            totalBudget: item.totalBudget || 0,
            status: item._id || "N/A",
          };
        case "Finance":
          return {
            transactionDescription:
              item.transactionDescription ||
              `${item._id?.type}-${item._id?.status}`,
            totalAmount: item.totalAmount || 0,
            transactionType: item._id?.type || "N/A",
          };
        case "Tasks":
          return {
            title: item.title || `${item._id?.status}-${item._id?.priority}`,
            dueDate: item.dueDate
              ? new Date(item.dueDate).toLocaleDateString()
              : "N/A",
            status: item._id?.status || item.status || "N/A",
          };
        case "Procurement":
          return {
            supplierName: item.supplierName || "Unknown",
            totalCost: item.totalCost || 0,
            orderStatus: item._id?.status || "N/A",
          };
        case "Events":
          return {
            title: item.title || "Unknown",
            startDate: item.startDate
              ? new Date(item.startDate).toLocaleDateString()
              : "N/A",
            eventType: item.eventType || "N/A",
          };
        case "Inventory":
          return {
            productName: item.productId?.productName || "Unknown",
            quantity: item.quantity || 0,
            expirationDate: item.expirationDate
              ? new Date(item.expirationDate).toLocaleDateString()
              : "N/A",
          };
        case "Suppliers":
          return {
            SupplierName: item.SupplierName || "Unknown",
            Email: item.Email || "N/A",
            IsActive: item.IsActive ? "Yes" : "No",
          };
        case "Customers":
          return {
            name: item.name || item._id || "Unknown",
            email: item.email || "N/A",
            status: item._id || item.status || "N/A",
          };
        case "Departments":
          return {
            name: item.name || "Total",
            description: item.description || "N/A",
            totalDepartments: item.totalDepartments || 0,
          };
        case "Performance":
          return {
            title: item.title || "Unknown",
            employeeName: item.employeeId?.name || "Unknown",
            status: item.status || "N/A",
          };
        case "Products":
          return {
            productName: item.productName || "Unknown",
            category: item.category || "N/A",
            unitPrice: item.unitPrice || 0,
          };
        case "Projects":
          return {
            name: item.name || "Unknown",
            projectManagerName: item.projectManager?.name || "Unknown",
            status: item.status || "N/A",
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
    <div className="relative min-h-screen text-text overflow-hidden bg-bg">
      <div className="relative z-10 container mx-auto p-4 sm:p-6 md:p-8">
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 text-center text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {t("dashboard.title")}
        </motion.h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(topMetrics).map(([key, value], index) => (
            <motion.div
              key={key}
              variants={cardVariant}
              className="bg-white rounded-xl shadow-md p-4 text-center"
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-700">
                {t(`dashboard.${key}`)}
              </h3>
              <p className="text-2xl font-bold text-primary">{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-6">
          <label
            htmlFor="categorySelect"
            className="mr-2 font-semibold text-gray-700"
          >
            {t("dashboard.select_category")}:
          </label>
          <select
            id="categorySelect"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All">{t("dashboard.all_categories")}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {(selectedCategory === "All" ? categories : [selectedCategory]).map(
          (category) => (
            <motion.section
              key={category}
              className="mb-12"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            >
              <h2 className="text-2xl font-bold mb-6 text-secondary">
                {category}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {categoryCharts[category]?.map((chart, index) => (
                  <motion.div
                    key={index}
                    variants={cardVariant}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <h3 className="text-lg font-bold mb-4 text-gray-800">
                      {chart.title}
                    </h3>
                    <div className="w-full h-64">{renderChart(chart)}</div>
                    <button
                      onClick={() =>
                        exportToExcel(
                          categoryTables[category],
                          `${category}_Chart_${index}`
                        )
                      }
                      className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition"
                    >
                      {t("dashboard.export_to_excel")}
                    </button>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={cardVariant}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="text-lg font-bold mb-4 text-gray-800">
                  {t(`dashboard.${category.toLowerCase()}_summary_table`)}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-white">
                        {getKeyFields(category).map((key) => (
                          <th key={key} className="p-3">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(category).length > 0 ? (
                        getPaginatedData(category).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 border-b">
                            {getKeyFields(category).map((key, i) => (
                              <td key={i} className="p-3">
                                {item[key] !== undefined && item[key] !== null
                                  ? String(item[key])
                                  : "N/A"}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={getKeyFields(category).length}
                            className="p-3 text-center text-gray-500"
                          >
                            {t("dashboard.no_data_available")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {categoryTables[category]?.length > itemsPerPage && (
                  <div className="flex justify-center items-center mt-4 space-x-2">
                    <button
                      onClick={() => handlePrevPage(category)}
                      disabled={(currentPage[category] || 1) === 1}
                      className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      ◀
                    </button>

                    {getPaginationRange(category).pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(category, page)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage[category] === page
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {getPaginationRange(category).showEllipsis && (
                      <>
                        <span className="px-3 py-1">...</span>
                        <button
                          onClick={() =>
                            handlePageChange(
                              category,
                              getPaginationRange(category).totalPages
                            )
                          }
                          className={`px-3 py-1 rounded-md ${
                            currentPage[category] ===
                            getPaginationRange(category).totalPages
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                      className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      ▶
                    </button>
                  </div>
                )}

                <button
                  onClick={() =>
                    exportToExcel(
                      transformTableData(category, categoryTables[category]),
                      `${category}_Summary`
                    )
                  }
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition"
                >
                  {t("dashboard.export_to_excel")}
                </button>
              </motion.div>
            </motion.section>
          )
        )}
      </div>
    </div>
  );
};

export default Dashboard;
