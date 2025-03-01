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

// רכיב חדש ליצירת צורות זזות ברקע
const AnimatedShapes = () => {
  const shapes = [
    {
      style: {
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        background: "rgba(29, 78, 216, 0.2)",
      },
      initial: { x: 0, y: 0 },
      animate: { x: [0, 50, 0], y: [0, -50, 0] },
      transition: { duration: 20, repeat: Infinity, ease: "easeInOut" },
      pos: { top: "10%", left: "5%" },
    },
    {
      style: {
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        background: "rgba(16, 185, 129, 0.2)",
      },
      initial: { x: 0, y: 0 },
      animate: { x: [0, -50, 0], y: [0, 50, 0] },
      transition: { duration: 25, repeat: Infinity, ease: "easeInOut" },
      pos: { bottom: "15%", right: "10%" },
    },
    {
      style: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "rgba(99, 102, 241, 0.2)",
      },
      initial: { x: 0, y: 0 },
      animate: { x: [0, 30, 0], y: [0, -30, 0] },
      transition: { duration: 18, repeat: Infinity, ease: "easeInOut" },
      pos: { top: "50%", left: "80%" },
    },
    // ניתן להוסיף עוד צורות לפי הצורך
  ];

  return (
    <>
      {shapes.map((shape, idx) => (
        <motion.div
          key={idx}
          style={{
            position: "absolute",
            ...shape.style,
            ...shape.pos,
          }}
          initial={shape.initial}
          animate={shape.animate}
          transition={shape.transition}
        />
      ))}
    </>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();

  // State לדוחות בסיסיים
  const [budgetSummary, setBudgetSummary] = useState({});
  const [financeSummary, setFinanceSummary] = useState([]);
  const [taskSummary, setTaskSummary] = useState([]);
  const [procurementSummary, setProcurementSummary] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [supplierReport, setSupplierReport] = useState([]);
  const [signatureReport, setSignatureReport] = useState([]);
  const [dashboardReport, setDashboardReport] = useState({});

  // State לדוחות מפורטים
  const [detailedBudgetByProject, setDetailedBudgetByProject] = useState({});
  const [detailedFinance, setDetailedFinance] = useState([]);
  const [detailedTask, setDetailedTask] = useState([]);
  const [procurementBySupplier, setProcurementBySupplier] = useState([]);
  const [eventByType, setEventByType] = useState([]);
  const [inventoryReorder, setInventoryReorder] = useState([]);
  const [employeePerformance, setEmployeePerformance] = useState({});
  const [supplierPerformance, setSupplierPerformance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // מזהים ברירת מחדל
  const defaultProjectId = "000000000000000000000001";
  const defaultSupplierId = "000000000000000000000002";
  const defaultEmployeeId = "000000000000000000000003";
  const defaultEventType = "default";

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [
          budgetRes,
          financeRes,
          taskRes,
          procurementRes,
          eventsRes,
          lowStockRes,
          supplierRes,
          signatureRes,
          dashboardRes,
          detailedBudgetByProjectRes,
          detailedFinanceRes,
          detailedTaskRes,
          procurementBySupplierRes,
          eventByTypeRes,
          inventoryReorderRes,
          employeePerformanceRes,
          supplierPerformanceRes,
        ] = await Promise.all([
          axiosInstance.get("/reports/budget-summary", {
            withCredentials: true,
          }),
          axiosInstance.get("/reports/finance-summary", {
            withCredentials: true,
          }),
          axiosInstance.get("/reports/task-summary", { withCredentials: true }),
          axiosInstance.get("/reports/procurement-summary", {
            withCredentials: true,
          }),
          axiosInstance.get("/reports/upcoming-events", {
            withCredentials: true,
          }),
          axiosInstance.get("/reports/low-stock", { withCredentials: true }),
          axiosInstance.get("/reports/suppliers", { withCredentials: true }),
          axiosInstance.get("/reports/signatures", { withCredentials: true }),
          axiosInstance.get("/reports/dashboard", { withCredentials: true }),
          axiosInstance.get(
            `/reports/budget-by-project?projectId=${defaultProjectId}`,
            { withCredentials: true }
          ),
          axiosInstance.get("/reports/detailed-finance", {
            withCredentials: true,
          }),
          axiosInstance.get("/reports/detailed-task", {
            withCredentials: true,
          }),
          axiosInstance.get(
            `/reports/procurement-by-supplier?supplierId=${defaultSupplierId}`,
            { withCredentials: true }
          ),
          axiosInstance.get(
            `/reports/event-by-type?eventType=${defaultEventType}`,
            { withCredentials: true }
          ),
          axiosInstance.get("/reports/inventory-reorder", {
            withCredentials: true,
          }),
          axiosInstance.get(
            `/reports/employee-performance?employeeId=${defaultEmployeeId}`,
            { withCredentials: true }
          ),
          axiosInstance.get("/reports/supplier-performance", {
            withCredentials: true,
          }),
        ]);

        setBudgetSummary(budgetRes.data.data || {});
        setFinanceSummary(financeRes.data.data || []);
        setTaskSummary(taskRes.data.data || []);
        setProcurementSummary(procurementRes.data.data || []);
        setUpcomingEvents(eventsRes.data.data || []);
        setLowStockItems(lowStockRes.data.data || []);
        setSupplierReport(supplierRes.data.data || []);
        setSignatureReport(signatureRes.data.data || []);
        setDashboardReport(dashboardRes.data.data || {});

        setDetailedBudgetByProject(detailedBudgetByProjectRes.data.data || {});
        setDetailedFinance(detailedFinanceRes.data.data || []);
        setDetailedTask(detailedTaskRes.data.data || []);
        setProcurementBySupplier(procurementBySupplierRes.data.data || []);
        setEventByType(eventByTypeRes.data.data || []);
        setInventoryReorder(inventoryReorderRes.data.data || []);
        setEmployeePerformance(employeePerformanceRes.data.data || {});
        setSupplierPerformance(supplierPerformanceRes.data.data || []);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Error fetching reports data");
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <motion.div
          className="w-16 h-16 border-4 border-t-4 border-border-color rounded-full"
          animate={{ rotate: 360 }}
          transition={{ loop: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  if (error) return <div className="p-4 text-red-600">{error}</div>;

  // עיבוד נתונים לדוגמה (תקציב)
  const totalBudget = Number(budgetSummary.totalBudget) || 0;
  const totalSpent = Number(budgetSummary.totalSpent) || 0;
  const remainingBudget = totalBudget - totalSpent;

  // הגדרות נתוני גרפים
  const budgetDoughnutData = {
    labels: [t("dashboard.spent"), t("dashboard.remaining")],
    datasets: [
      {
        data: [totalSpent, remainingBudget],
        backgroundColor: ["var(--color-primary)", "var(--color-secondary)"],
      },
    ],
  };

  const financeBarData = {
    labels: financeSummary.map((item) => item._id),
    datasets: [
      {
        label: t("dashboard.finance_amount"),
        data: financeSummary.map((item) => item.totalAmount),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const taskPieData = {
    labels: taskSummary.map((item) => item._id),
    datasets: [
      {
        data: taskSummary.map((item) => item.count),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
      },
    ],
  };

  const procurementLineData = {
    labels: procurementSummary.map((item) => item._id),
    datasets: [
      {
        label: t("dashboard.procurement_total_cost"),
        data: procurementSummary.map((item) => item.totalCost),
        fill: false,
        borderColor: "#FF6384",
      },
    ],
  };

  const lowStockRadarData = {
    labels: lowStockItems.map(
      (item) => item.productId?.productName || t("dashboard.no_product_name")
    ),
    datasets: [
      {
        label: t("dashboard.current_stock"),
        data: lowStockItems.map((item) => item.quantity),
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: t("dashboard.min_stock"),
        data: lowStockItems.map((item) => item.minStockLevel),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const activeSuppliersCount = supplierReport.filter((s) => s.IsActive).length;
  const inactiveSuppliersCount = supplierReport.filter(
    (s) => !s.IsActive
  ).length;
  const supplierPieData = {
    labels: [t("dashboard.active"), t("dashboard.inactive")],
    datasets: [
      {
        data: [activeSuppliersCount, inactiveSuppliersCount],
        backgroundColor: ["var(--color-primary)", "var(--color-secondary)"],
      },
    ],
  };

  const signatureStatusCounts = signatureReport.reduce((acc, sig) => {
    const status = sig.status || "N/A";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const signatureLabels = Object.keys(signatureStatusCounts);
  const signatureData = Object.values(signatureStatusCounts);
  const signatureDoughnutData = {
    labels: signatureLabels,
    datasets: [
      {
        data: signatureData,
        backgroundColor: [
          "var(--color-primary)",
          "var(--color-secondary)",
          "var(--color-accent)",
        ],
      },
    ],
  };

  // אנימציות לכרטיסי סיכום
  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen bg-bg text-text overflow-hidden">
      {/* הוספת הרכיב עם הצורות הזזות */}
      <AnimatedShapes />

      {/* צורות רקע נוספות עם אנימציות */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute bg-primary opacity-30 rounded-full"
          style={{
            width: "300px",
            height: "300px",
            top: "-50px",
            left: "-100px",
          }}
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bg-secondary opacity-30 rounded-full"
          style={{
            width: "400px",
            height: "400px",
            bottom: "-100px",
            right: "-150px",
          }}
          animate={{ x: [0, -1000, 0], y: [0, -500, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bg-accent opacity-30 rounded-full"
          style={{
            width: "250px",
            height: "250px",
            bottom: "100px",
            left: "-80px",
          }}
          animate={{ x: [0, 500, 0], y: [0, -300, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 p-8">
        <motion.h1
          className="text-4xl font-extrabold mb-6 text-center text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {t("dashboard.title")}
        </motion.h1>

        {/* כרטיסי סיכום */}
        <motion.section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-bg bg-opacity-75 rounded-xl shadow-xl border border-border-color"
          >
            <p className="text-lg font-semibold">
              {t("dashboard.total_budgets")}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {budgetSummary.count || 0}
            </p>
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-bg bg-opacity-75 rounded-xl shadow-xl border border-border-color"
          >
            <p className="text-lg font-semibold">
              {t("dashboard.total_budget")}
            </p>
            <p className="mt-2 text-2xl font-bold">{totalBudget}</p>
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-bg bg-opacity-75 rounded-xl shadow-xl border border-border-color"
          >
            <p className="text-lg font-semibold">
              {t("dashboard.total_spent")}
            </p>
            <p className="mt-2 text-2xl font-bold">{totalSpent}</p>
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-bg bg-opacity-75 rounded-xl shadow-xl border border-border-color"
          >
            <p className="text-lg font-semibold">{t("dashboard.remaining")}</p>
            <p className="mt-2 text-2xl font-bold text-secondary">
              {remainingBudget}
            </p>
          </motion.div>
        </motion.section>

        {/* גרפים */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 text-secondary">
              {t("dashboard.budget_distribution")}
            </h2>
            <Doughnut data={budgetDoughnutData} />
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 text-secondary">
              {t("dashboard.finance_summary")}
            </h2>
            <Bar data={financeBarData} />
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 text-secondary">
              {t("dashboard.task_summary")}
            </h2>
            <Pie data={taskPieData} />
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 text-secondary">
              {t("dashboard.procurement_summary")}
            </h2>
            <Line data={procurementLineData} />
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 text-secondary">
              {t("dashboard.low_stock_items")}
            </h2>
            {lowStockItems.length > 0 ? (
              <Radar data={lowStockRadarData} />
            ) : (
              <p>{t("dashboard.no_data")}</p>
            )}
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 text-secondary">
              {t("dashboard.supplier_report")}
            </h2>
            {supplierReport.length > 0 ? (
              <Doughnut data={supplierPieData} />
            ) : (
              <p>{t("dashboard.no_data")}</p>
            )}
          </motion.div>
          <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.05 }}
            className="bg-bg bg-opacity-75 rounded-xl shadow-xl p-6 md:col-span-2"
          >
            <h2 className="text-xl font-bold mb-4 text-secondary">
              {t("dashboard.signature_report")}
            </h2>
            {signatureReport.length > 0 ? (
              <Doughnut data={signatureDoughnutData} />
            ) : (
              <p>{t("dashboard.no_data")}</p>
            )}
          </motion.div>
        </motion.section>

        {/* טבלאות */}
        <motion.section
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
          {/* טבלת אירועים קרובים */}
          <motion.div variants={cardVariant}>
            <h2 className="text-2xl font-bold mb-4 text-secondary">
              {t("dashboard.upcoming_events")}
            </h2>
            {upcomingEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.title")}
                      </th>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.start_date")}
                      </th>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.event_type")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingEvents.map((event) => (
                      <tr key={event._id}>
                        <td className="py-3 px-4 border-b border-border-color">
                          {event.title}
                        </td>
                        <td className="py-3 px-4 border-b border-border-color">
                          {new Date(event.startDate).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 border-b border-border-color">
                          {event.eventType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{t("dashboard.no_data")}</p>
            )}
          </motion.div>

          {/* טבלת ספקים */}
          <motion.div variants={cardVariant}>
            <h2 className="text-2xl font-bold mb-4 text-secondary">
              {t("dashboard.supplier_report")}
            </h2>
            {supplierReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.supplier_name")}
                      </th>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.email")}
                      </th>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.phone")}
                      </th>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierReport.map((supplier) => (
                      <tr key={supplier._id}>
                        <td className="py-3 px-4 border-b border-border-color">
                          {supplier.SupplierName}
                        </td>
                        <td className="py-3 px-4 border-b border-border-color">
                          {supplier.Email}
                        </td>
                        <td className="py-3 px-4 border-b border-border-color">
                          {supplier.Phone}
                        </td>
                        <td className="py-3 px-4 border-b border-border-color">
                          {supplier.IsActive
                            ? t("dashboard.active")
                            : t("dashboard.inactive")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{t("dashboard.no_data")}</p>
            )}
          </motion.div>

          {/* טבלת דוח חתימות */}
          <motion.div variants={cardVariant}>
            <h2 className="text-2xl font-bold mb-4 text-secondary">
              {t("dashboard.signature_report")}
            </h2>
            {signatureReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.signature_name")}
                      </th>
                      <th className="py-3 px-4 border-b border-border-color">
                        {t("dashboard.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {signatureReport.map((sig) => (
                      <tr key={sig._id}>
                        <td className="py-3 px-4 border-b border-border-color">
                          {sig.name}
                        </td>
                        <td className="py-3 px-4 border-b border-border-color">
                          {sig.status || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{t("dashboard.no_data")}</p>
            )}
          </motion.div>

          {/* דוחות מפורטים */}
          <motion.div variants={cardVariant}>
            <h2 className="text-2xl font-bold mb-4 text-secondary">
              {t("dashboard.detailed_reports")}
            </h2>
            <div className="space-y-8">
              {/* Detailed Budget by Project */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.budget_by_project")}
                </h3>
                {detailedBudgetByProject &&
                detailedBudgetByProject.count !== undefined ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.project_id")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.total_budget")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.total_spent")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.count")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-3 px-4 border-b border-border-color">
                            {detailedBudgetByProject._id || "-"}
                          </td>
                          <td className="py-3 px-4 border-b border-border-color">
                            {detailedBudgetByProject.totalBudget || 0}
                          </td>
                          <td className="py-3 px-4 border-b border-border-color">
                            {detailedBudgetByProject.totalSpent || 0}
                          </td>
                          <td className="py-3 px-4 border-b border-border-color">
                            {detailedBudgetByProject.count || 0}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
              {/* Detailed Finance */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.detailed_finance")}
                </h3>
                {detailedFinance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.transaction_type")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.total_amount")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.transaction_count")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedFinance.map((tx, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 border-b border-border-color">
                              {tx.transactionType}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {tx.transactionAmount}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {tx.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
              {/* Detailed Task */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.detailed_task")}
                </h3>
                {detailedTask.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.status")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.count")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedTask.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item._id}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
              {/* Detailed Procurement by Supplier */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.procurement_by_supplier")}
                </h3>
                {procurementBySupplier.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.supplier_id")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.total_cost")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.order_count")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {procurementBySupplier.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item._id}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.totalCost}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
              {/* Detailed Event by Type */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.event_by_type")}
                </h3>
                {eventByType.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.event_title")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.start_date")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.event_type")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventByType.map((event, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 border-b border-border-color">
                              {event.title}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {new Date(event.startDate).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {event.eventType}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
              {/* Detailed Inventory Reorder */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.inventory_reorder")}
                </h3>
                {inventoryReorder.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.product_name")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.quantity")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.min_stock")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryReorder.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.productId?.productName ||
                                t("dashboard.no_product_name")}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.minStockLevel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
              {/* Detailed Employee Performance */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.employee_performance")}
                </h3>
                {employeePerformance.tasks &&
                employeePerformance.tasks.length > 0 ? (
                  <div>
                    <h4 className="font-bold mb-2">{t("dashboard.tasks")}</h4>
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                        <thead>
                          <tr>
                            <th className="py-3 px-4 border-b border-border-color">
                              {t("dashboard.task_status")}
                            </th>
                            <th className="py-3 px-4 border-b border-border-color">
                              {t("dashboard.count")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeePerformance.tasks.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-3 px-4 border-b border-border-color">
                                {item._id}
                              </td>
                              <td className="py-3 px-4 border-b border-border-color">
                                {item.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {employeePerformance.procurements &&
                      employeePerformance.procurements.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-2">
                            {t("dashboard.procurements")}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                              <thead>
                                <tr>
                                  <th className="py-3 px-4 border-b border-border-color">
                                    {t("dashboard.order_status")}
                                  </th>
                                  <th className="py-3 px-4 border-b border-border-color">
                                    {t("dashboard.count")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {employeePerformance.procurements.map(
                                  (item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-3 px-4 border-b border-border-color">
                                        {item._id}
                                      </td>
                                      <td className="py-3 px-4 border-b border-border-color">
                                        {item.count}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
              {/* Detailed Supplier Performance */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("dashboard.supplier_performance")}
                </h3>
                {supplierPerformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-bg bg-opacity-75 rounded-xl border border-border-color">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.supplier_name")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.order_count")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.total_cost")}
                          </th>
                          <th className="py-3 px-4 border-b border-border-color">
                            {t("dashboard.email")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierPerformance.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.supplierName}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.orderCount}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.totalCost}
                            </td>
                            <td className="py-3 px-4 border-b border-border-color">
                              {item.Email}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>{t("dashboard.no_data")}</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
};

export default Dashboard;
