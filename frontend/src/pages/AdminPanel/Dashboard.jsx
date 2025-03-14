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
    legend: { display: true },
    tooltip: { enabled: true },
  },
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get(
          "/reports/super-unified-report",
          {
            withCredentials: true,
          }
        );
        setDashboardData(response.data.data || {});
        setLoading(false);
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

  const categoryCharts = {
    Budget: [
      {
        title: t("dashboard.budget_summary"),
        type: "Doughnut",
        data: {
          labels: dashboardData.budgetSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.budgetSummary?.map(
                (item) => item.totalBudget
              ) || [1],
              backgroundColor: dashboardData.budgetSummary
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_spent"),
        type: "Bar",
        data: {
          labels: dashboardData.budgetSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.spent"),
              data: dashboardData.budgetSummary?.map(
                (item) => item.totalSpent
              ) || [0],
              backgroundColor: dashboardData.budgetSummary
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_remaining"),
        type: "Bar",
        data: {
          labels: dashboardData.budgetSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.remaining"),
              data: dashboardData.budgetSummary?.map(
                (item) => (item.totalBudget || 0) - (item.totalSpent || 0)
              ) || [0],
              backgroundColor: dashboardData.budgetSummary
                ? "rgba(75, 192, 192, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_count"),
        type: "Pie",
        data: {
          labels: dashboardData.budgetSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.budgetSummary?.map(
                (item) => item.count || 0
              ) || [1],
              backgroundColor: dashboardData.budgetSummary
                ? ["#FFCE56", "#4BC0C0", "#36A2EB"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.budget_trend"),
        type: "Line",
        data: {
          labels: dashboardData.budgetSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.total_budget"),
              data: dashboardData.budgetSummary?.map(
                (item) => item.totalBudget || 0
              ) || [0],
              borderColor: dashboardData.budgetSummary ? "#FF6384" : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
    ],
    Finance: [
      {
        title: t("dashboard.finance_summary"),
        type: "Bar",
        data: {
          labels: dashboardData.financeSummary?.map(
            (item) => `${item._id.type}-${item._id.status}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.finance_amount"),
              data: dashboardData.financeSummary?.map(
                (item) => item.totalAmount
              ) || [0],
              backgroundColor: dashboardData.financeSummary
                ? "rgba(54, 162, 235, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.finance_by_type"),
        type: "Pie",
        data: {
          labels: dashboardData.financeSummary?.map(
            (item) => item._id.type || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.financeSummary?.map(
                (item) => item.totalAmount || 0
              ) || [1],
              backgroundColor: dashboardData.financeSummary
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.finance_count"),
        type: "Bar",
        data: {
          labels: dashboardData.financeSummary?.map(
            (item) => `${item._id.type}-${item._id.status}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.financeSummary?.map(
                (item) => item.count || 0
              ) || [0],
              backgroundColor: dashboardData.financeSummary
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.finance_trend"),
        type: "Line",
        data: {
          labels: dashboardData.financeSummary?.map(
            (item) => `${item._id.type}-${item._id.status}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.amount"),
              data: dashboardData.financeSummary?.map(
                (item) => item.totalAmount || 0
              ) || [0],
              borderColor: dashboardData.financeSummary ? "#4BC0C0" : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.finance_status"),
        type: "Doughnut",
        data: {
          labels: dashboardData.financeSummary?.map(
            (item) => item._id.status || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.financeSummary?.map(
                (item) => item.count || 0
              ) || [1],
              backgroundColor: dashboardData.financeSummary
                ? ["#FFCE56", "#36A2EB", "#FF6384"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
    ],
    Tasks: [
      {
        title: t("dashboard.task_summary"),
        type: "Pie",
        data: {
          labels: dashboardData.taskSummary?.map(
            (item) => `${item._id.status}-${item._id.priority}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.taskSummary?.map((item) => item.count) || [1],
              backgroundColor: dashboardData.taskSummary
                ? ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.task_overdue"),
        type: "Pie",
        data: {
          labels: dashboardData.overdueTasks?.map(
            (item) => item.title || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.overdueTasks?.map(
                (item) => item.daysOverdue || 1
              ) || [1],
              backgroundColor: dashboardData.overdueTasks
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.task_count_by_status"),
        type: "Bar",
        data: {
          labels: dashboardData.taskSummary?.map(
            (item) => item._id.status || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.taskSummary?.map(
                (item) => item.count || 0
              ) || [0],
              backgroundColor: dashboardData.taskSummary
                ? "rgba(75, 192, 192, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.task_priority"),
        type: "Doughnut",
        data: {
          labels: dashboardData.taskSummary?.map(
            (item) => item._id.priority || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.taskSummary?.map(
                (item) => item.count || 0
              ) || [1],
              backgroundColor: dashboardData.taskSummary
                ? ["#FFCE56", "#4BC0C0", "#36A2EB"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.task_trend"),
        type: "Line",
        data: {
          labels: dashboardData.taskSummary?.map(
            (item) => `${item._id.status}-${item._id.priority}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.taskSummary?.map(
                (item) => item.count || 0
              ) || [0],
              borderColor: dashboardData.taskSummary ? "#FF6384" : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
    ],
    Procurement: [
      {
        title: t("dashboard.procurement_summary"),
        type: "Line",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => `${item._id.status}-${item._id.paymentStatus}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.total_cost"),
              data: dashboardData.procurementSummary?.map(
                (item) => item.totalCost
              ) || [0],
              borderColor: dashboardData.procurementSummary
                ? "#FF6384"
                : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.procurement_count"),
        type: "Bar",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => `${item._id.status}-${item._id.paymentStatus}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.procurementSummary?.map(
                (item) => item.count || 0
              ) || [0],
              backgroundColor: dashboardData.procurementSummary
                ? "rgba(54, 162, 235, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.procurement_status"),
        type: "Pie",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => item._id.status || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.procurementSummary?.map(
                (item) => item.count || 0
              ) || [1],
              backgroundColor: dashboardData.procurementSummary
                ? ["#FFCE56", "#36A2EB", "#FF6384"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.procurement_payment"),
        type: "Doughnut",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => item._id.paymentStatus || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.procurementSummary?.map(
                (item) => item.totalCost || 0
              ) || [1],
              backgroundColor: dashboardData.procurementSummary
                ? ["#4BC0C0", "#FF6384", "#36A2EB"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.procurement_trend"),
        type: "Line",
        data: {
          labels: dashboardData.procurementSummary?.map(
            (item) => `${item._id.status}-${item._id.paymentStatus}`
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.cost_trend"),
              data: dashboardData.procurementSummary?.map(
                (item) => item.totalCost || 0
              ) || [0],
              borderColor: dashboardData.procurementSummary
                ? "#36A2EB"
                : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
    ],
    Events: [
      {
        title: t("dashboard.upcoming_events"),
        type: "Pie",
        data: {
          labels: dashboardData.upcomingEvents?.map(
            (item) => item.title || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.upcomingEvents?.map(() => 1) || [1],
              backgroundColor: dashboardData.upcomingEvents
                ? ["#4BC0C0", "#FFCE56", "#36A2EB"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.event_participants"),
        type: "Bar",
        data: {
          labels: dashboardData.upcomingEvents?.map(
            (item) => item.title || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.participants"),
              data: dashboardData.upcomingEvents?.map(
                (item) => item.participants?.length || 0
              ) || [0],
              backgroundColor: dashboardData.upcomingEvents
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.event_duration"),
        type: "Bar",
        data: {
          labels: dashboardData.upcomingEvents?.map(
            (item) => item.title || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.duration"),
              data: dashboardData.upcomingEvents?.map(
                (item) =>
                  (new Date(item.endDate) - new Date(item.startDate)) /
                    (1000 * 60 * 60 * 24) || 0
              ) || [0],
              backgroundColor: dashboardData.upcomingEvents
                ? "rgba(75, 192, 192, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.event_trend"),
        type: "Line",
        data: {
          labels: dashboardData.upcomingEvents?.map(
            (item) => item.title || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.upcomingEvents?.map(() => 1) || [0],
              borderColor: dashboardData.upcomingEvents ? "#FF6384" : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.event_distribution"),
        type: "Doughnut",
        data: {
          labels: dashboardData.upcomingEvents?.map(
            (item) => item.title || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.upcomingEvents?.map(() => 1) || [1],
              backgroundColor: dashboardData.upcomingEvents
                ? ["#36A2EB", "#FFCE56", "#4BC0C0"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
    ],
    Inventory: [
      {
        title: t("dashboard.low_stock_items"),
        type: "Radar",
        data: {
          labels: dashboardData.lowStockInventory?.map(
            (item) => item.productId?.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.current_stock"),
              data: dashboardData.lowStockInventory?.map(
                (item) => item.quantity
              ) || [0],
              backgroundColor: dashboardData.lowStockInventory
                ? "rgba(255, 206, 86, 0.2)"
                : "rgba(224, 224, 224, 0.2)",
              borderColor: dashboardData.lowStockInventory
                ? "#FFCE56"
                : "#B0B0B0",
            },
            {
              label: t("dashboard.min_stock"),
              data: dashboardData.lowStockInventory?.map(
                (item) => item.minStockLevel
              ) || [0],
              backgroundColor: dashboardData.lowStockInventory
                ? "rgba(75, 192, 192, 0.2)"
                : "rgba(224, 224, 224, 0.2)",
              borderColor: dashboardData.lowStockInventory
                ? "#4BC0C0"
                : "#B0B0B0",
            },
          ],
        },
      },
      {
        title: t("dashboard.inventory_expiration"),
        type: "Radar",
        data: {
          labels: dashboardData.inventoryExpiration?.map(
            (item) => item.productId?.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.days_to_expire"),
              data: dashboardData.inventoryExpiration?.map(
                (item) => item.daysToExpire || 0
              ) || [0],
              backgroundColor: dashboardData.inventoryExpiration
                ? "rgba(255, 99, 132, 0.2)"
                : "rgba(224, 224, 224, 0.2)",
              borderColor: dashboardData.inventoryExpiration
                ? "#FF6384"
                : "#B0B0B0",
            },
          ],
        },
      },
      {
        title: t("dashboard.low_stock_count"),
        type: "Bar",
        data: {
          labels: dashboardData.lowStockInventory?.map(
            (item) => item.productId?.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.quantity"),
              data: dashboardData.lowStockInventory?.map(
                (item) => item.quantity || 0
              ) || [0],
              backgroundColor: dashboardData.lowStockInventory
                ? "rgba(54, 162, 235, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.expiration_count"),
        type: "Bar",
        data: {
          labels: dashboardData.inventoryExpiration?.map(
            (item) => item.productId?.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.inventoryExpiration?.map(() => 1) || [0],
              backgroundColor: dashboardData.inventoryExpiration
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.inventory_trend"),
        type: "Line",
        data: {
          labels: dashboardData.lowStockInventory?.map(
            (item) => item.productId?.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.quantity"),
              data: dashboardData.lowStockInventory?.map(
                (item) => item.quantity || 0
              ) || [0],
              borderColor: dashboardData.lowStockInventory
                ? "#36A2EB"
                : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
    ],
    Suppliers: [
      {
        title: t("dashboard.supplier_report"),
        type: "Pie",
        data: {
          labels: [t("dashboard.active"), t("dashboard.inactive")],
          datasets: [
            {
              data: dashboardData.suppliers
                ? [
                    dashboardData.suppliers.filter((s) => s.IsActive).length,
                    dashboardData.suppliers.filter((s) => !s.IsActive).length,
                  ]
                : [1, 0],
              backgroundColor: dashboardData.suppliers
                ? ["#36A2EB", "#FF6384"]
                : ["#E0E0E0", "#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.supplier_rating"),
        type: "Bar",
        data: {
          labels: dashboardData.suppliers?.map(
            (item) => item.SupplierName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.rating"),
              data: dashboardData.suppliers?.map(
                (item) => item.Rating || 0
              ) || [0],
              backgroundColor: dashboardData.suppliers
                ? "rgba(75, 192, 192, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.supplier_count"),
        type: "Doughnut",
        data: {
          labels: [t("dashboard.active"), t("dashboard.inactive")],
          datasets: [
            {
              data: dashboardData.suppliers
                ? [
                    dashboardData.suppliers.filter((s) => s.IsActive).length,
                    dashboardData.suppliers.filter((s) => !s.IsActive).length,
                  ]
                : [1, 0],
              backgroundColor: dashboardData.suppliers
                ? ["#4BC0C0", "#FFCE56"]
                : ["#E0E0E0", "#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.supplier_trend"),
        type: "Line",
        data: {
          labels: dashboardData.suppliers?.map(
            (item) => item.SupplierName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.rating"),
              data: dashboardData.suppliers?.map(
                (item) => item.Rating || 0
              ) || [0],
              borderColor: dashboardData.suppliers ? "#FF6384" : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.supplier_distribution"),
        type: "Bar",
        data: {
          labels: dashboardData.suppliers?.map(
            (item) => item.SupplierName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.suppliers?.map(() => 1) || [0],
              backgroundColor: dashboardData.suppliers
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
    ],
    Customers: [
      {
        title: t("dashboard.customer_summary"),
        type: "Bar",
        data: {
          labels: dashboardData.customerSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.customer_count"),
              data: dashboardData.customerSummary?.map(
                (item) => item.count
              ) || [0],
              backgroundColor: dashboardData.customerSummary
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.customer_orders"),
        type: "Bar",
        data: {
          labels: dashboardData.customerOrderSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.order_amount"),
              data: dashboardData.customerOrderSummary?.map(
                (item) => item.totalAmount
              ) || [0],
              backgroundColor: dashboardData.customerOrderSummary
                ? "rgba(75, 192, 192, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.order_count"),
        type: "Pie",
        data: {
          labels: dashboardData.customerOrderSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.customerOrderSummary?.map(
                (item) => item.totalOrders || 0
              ) || [1],
              backgroundColor: dashboardData.customerOrderSummary
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.customer_trend"),
        type: "Line",
        data: {
          labels: dashboardData.customerSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.customerSummary?.map(
                (item) => item.count || 0
              ) || [0],
              borderColor: dashboardData.customerSummary
                ? "#4BC0C0"
                : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.order_status"),
        type: "Doughnut",
        data: {
          labels: dashboardData.customerOrderSummary?.map(
            (item) => item._id || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.customerOrderSummary?.map(
                (item) => item.totalOrders || 0
              ) || [1],
              backgroundColor: dashboardData.customerOrderSummary
                ? ["#FFCE56", "#36A2EB", "#FF6384"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
    ],
    Departments: [
      {
        title: t("dashboard.department_summary"),
        type: "Bar",
        data: {
          labels: dashboardData.departmentSummary?.map(() => "Total") || [
            t("dashboard.no_data"),
          ],
          datasets: [
            {
              label: t("dashboard.dept_count"),
              data: dashboardData.departmentSummary?.map(
                (item) => item.totalDepartments
              ) || [0],
              backgroundColor: dashboardData.departmentSummary
                ? "rgba(153, 102, 255, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.employee_distribution"),
        type: "Bar",
        data: {
          labels: dashboardData.employees?.map(
            (item) => item.department || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.employee_count"),
              data: dashboardData.employees?.map(() => 1) || [0],
              backgroundColor: dashboardData.employees
                ? "rgba(255, 205, 86, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.dept_trend"),
        type: "Line",
        data: {
          labels: dashboardData.departmentSummary?.map(() => "Total") || [
            t("dashboard.no_data"),
          ],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.departmentSummary?.map(
                (item) => item.totalDepartments || 0
              ) || [0],
              borderColor: dashboardData.departmentSummary
                ? "#FF6384"
                : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.employee_count"),
        type: "Pie",
        data: {
          labels: dashboardData.employees?.map(
            (item) => item.department || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.employees?.map(() => 1) || [1],
              backgroundColor: dashboardData.employees
                ? ["#36A2EB", "#FFCE56", "#4BC0C0"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.dept_distribution"),
        type: "Doughnut",
        data: {
          labels: dashboardData.departmentSummary?.map(() => "Total") || [
            t("dashboard.no_data"),
          ],
          datasets: [
            {
              data: dashboardData.departmentSummary?.map(
                (item) => item.totalDepartments || 0
              ) || [1],
              backgroundColor: dashboardData.departmentSummary
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
    ],
    Performance: [
      {
        title: t("dashboard.performance_reviews"),
        type: "Line",
        data: {
          labels: dashboardData.performanceReviews?.map(
            (item) => item.employeeId?.name || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.performance_score"),
              data: dashboardData.performanceReviews?.map(
                (item) => item.score || 0
              ) || [0],
              borderColor: dashboardData.performanceReviews
                ? "#4BC0C0"
                : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.performance_distribution"),
        type: "Bar",
        data: {
          labels: dashboardData.performanceReviews?.map(
            (item) => item.employeeId?.name || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.score"),
              data: dashboardData.performanceReviews?.map(
                (item) => item.score || 0
              ) || [0],
              backgroundColor: dashboardData.performanceReviews
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.performance_count"),
        type: "Pie",
        data: {
          labels: dashboardData.performanceReviews?.map(
            (item) => item.employeeId?.name || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.performanceReviews?.map(() => 1) || [1],
              backgroundColor: dashboardData.performanceReviews
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.performance_trend"),
        type: "Line",
        data: {
          labels: dashboardData.performanceReviews?.map(
            (item) => item.employeeId?.name || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.score_trend"),
              data: dashboardData.performanceReviews?.map(
                (item) => item.score || 0
              ) || [0],
              borderColor: dashboardData.performanceReviews
                ? "#36A2EB"
                : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.performance_summary"),
        type: "Doughnut",
        data: {
          labels: dashboardData.performanceReviews?.map(
            (item) => item.employeeId?.name || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.performanceReviews?.map(
                (item) => item.score || 0
              ) || [1],
              backgroundColor: dashboardData.performanceReviews
                ? ["#FFCE56", "#4BC0C0", "#FF6384"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
    ],
    Products: [
      {
        title: t("dashboard.product_summary"),
        type: "Pie",
        data: {
          labels: dashboardData.products?.map(
            (item) => item.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.products?.map(() => 1) || [1],
              backgroundColor: dashboardData.products
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.product_trees"),
        type: "Radar",
        data: {
          labels: dashboardData.productTrees?.map(
            (item) => item.productId?.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.component_count"),
              data: dashboardData.productTrees?.map(
                (item) => item.components?.length || 0
              ) || [0],
              backgroundColor: dashboardData.productTrees
                ? "rgba(54, 162, 235, 0.2)"
                : "rgba(224, 224, 224, 0.2)",
              borderColor: dashboardData.productTrees ? "#36A2EB" : "#B0B0B0",
            },
          ],
        },
      },
      {
        title: t("dashboard.product_count"),
        type: "Bar",
        data: {
          labels: dashboardData.products?.map(
            (item) => item.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.products?.map(() => 1) || [0],
              backgroundColor: dashboardData.products
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.product_trend"),
        type: "Line",
        data: {
          labels: dashboardData.products?.map(
            (item) => item.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.products?.map(() => 1) || [0],
              borderColor: dashboardData.products ? "#FF6384" : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.product_distribution"),
        type: "Doughnut",
        data: {
          labels: dashboardData.products?.map(
            (item) => item.productName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.products?.map(() => 1) || [1],
              backgroundColor: dashboardData.products
                ? ["#36A2EB", "#FFCE56", "#4BC0C0"]
                : ["#E0E0E0"],
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
          labels: dashboardData.projects?.map(
            (item) => item.status || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.projects?.map(() => 1) || [1],
              backgroundColor: dashboardData.projects
                ? ["#FF6384", "#36A2EB", "#FFCE56"]
                : ["#E0E0E0"],
            },
          ],
        },
      },
      {
        title: t("dashboard.project_count"),
        type: "Bar",
        data: {
          labels: dashboardData.projects?.map(
            (item) => item.status || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.projects?.map(() => 1) || [0],
              backgroundColor: dashboardData.projects
                ? "rgba(75, 192, 192, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.project_team_size"),
        type: "Bar",
        data: {
          labels: dashboardData.projects?.map(
            (item) => item.projectName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.team_size"),
              data: dashboardData.projects?.map(
                (item) => item.teamMembers?.length || 0
              ) || [0],
              backgroundColor: dashboardData.projects
                ? "rgba(255, 99, 132, 0.6)"
                : "#E0E0E0",
            },
          ],
        },
      },
      {
        title: t("dashboard.project_trend"),
        type: "Line",
        data: {
          labels: dashboardData.projects?.map(
            (item) => item.projectName || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              label: t("dashboard.count"),
              data: dashboardData.projects?.map(() => 1) || [0],
              borderColor: dashboardData.projects ? "#4BC0C0" : "#B0B0B0",
              fill: false,
            },
          ],
        },
      },
      {
        title: t("dashboard.project_distribution"),
        type: "Doughnut",
        data: {
          labels: dashboardData.projects?.map(
            (item) => item.status || "Unknown"
          ) || [t("dashboard.no_data")],
          datasets: [
            {
              data: dashboardData.projects?.map(() => 1) || [1],
              backgroundColor: dashboardData.projects
                ? ["#FFCE56", "#36A2EB", "#FF6384"]
                : ["#E0E0E0"],
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
    if (!data || data.length === 0) {
      return ["ID", "Value", "Status"];
    }
    const sample = data[0];
    const keys = Object.keys(sample).filter(
      (key) =>
        key !== "__v" &&
        key !== "_id" &&
        key !== "updatedAt" &&
        key !== "createdAt"
    );
    return keys.slice(0, 3); // Limit to 3 key fields for simplicity
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
    switch (chart.type) {
      case "Bar":
        return <Bar data={chart.data} options={chartOptions} />;
      case "Doughnut":
        return <Doughnut data={chart.data} options={chartOptions} />;
      case "Pie":
        return <Pie data={chart.data} options={chartOptions} />;
      case "Radar":
        return <Radar data={chart.data} options={chartOptions} />;
      case "Line":
        return <Line data={chart.data} options={chartOptions} />;
      default:
        return null;
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen text-text overflow-hidden">
      <div className="relative z-10 container mx-auto p-4 sm:p-6 md:p-8">
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 text-center text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {t("dashboard.title")}
        </motion.h1>

        <div className="mb-6">
          <label htmlFor="categorySelect" className="mr-2 font-semibold">
            {t("dashboard.select_category")}:
          </label>
          <select
            id="categorySelect"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 rounded-md border border-border-color bg-bg text-text"
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

              {/* Charts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {categoryCharts[category].map((chart, index) => (
                  <motion.div
                    key={index}
                    variants={cardVariant}
                    className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-4 sm:p-6"
                  >
                    <h3 className="text-lg font-bold mb-4 text-secondary">
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

              {/* Summary Table */}
              <motion.div
                variants={cardVariant}
                className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-4 sm:p-6"
              >
                <h3 className="text-lg font-bold mb-4 text-secondary">
                  {t(`dashboard.${category.toLowerCase()}_summary_table`)}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-white">
                        {getKeyFields(category).map((key) => (
                          <th key={key} className="p-2 border-b">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryTables[category].length > 0 ? (
                        categoryTables[category].map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-100 border-b"
                          >
                            {getKeyFields(category).map((key, i) => (
                              <td key={i} className="p-2">
                                {typeof item[key] === "object" &&
                                item[key] !== null
                                  ? JSON.stringify(item[key])
                                  : item[key] !== undefined
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
                            className="p-2 text-center text-gray-500"
                          >
                            {t("dashboard.no_data_available")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() =>
                    exportToExcel(
                      categoryTables[category],
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
