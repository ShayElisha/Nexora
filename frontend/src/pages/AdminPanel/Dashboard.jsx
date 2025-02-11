// src/pages/procurement/Dashboard.jsx
import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { useTranslation } from "react-i18next";

// ייבוא רכיבי Chart.js וגרפים מ־react-chartjs-2
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

const Dashboard = () => {
  const { t } = useTranslation();

  // אתחול State עבור דוחות בסיסיים
  const [budgetSummary, setBudgetSummary] = useState({});
  const [financeSummary, setFinanceSummary] = useState([]);
  const [taskSummary, setTaskSummary] = useState([]);
  const [procurementSummary, setProcurementSummary] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [supplierReport, setSupplierReport] = useState([]);
  const [signatureReport, setSignatureReport] = useState([]);
  const [dashboardReport, setDashboardReport] = useState({});

  // אתחול State עבור דוחות מפורטים
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

  // ערכי ברירת מחדל עבור דוחות מפורטים
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

  if (loading) return <div className="p-4">{t("loading")}</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  // עיבוד נתוני דוחות בסיסיים
  const totalBudget = Number(budgetSummary.totalBudget) || 0;
  const totalSpent = Number(budgetSummary.totalSpent) || 0;
  const remainingBudget = totalBudget - totalSpent;

  // הגדרת גרפים עבור הדוחות הבסיסיים
  const budgetDoughnutData = {
    labels: [t("dashboard.spent"), t("dashboard.remaining")],
    datasets: [
      {
        data: [totalSpent, remainingBudget],
        backgroundColor: ["#4CAF50", "#FF9800"],
        hoverBackgroundColor: ["#66BB6A", "#FFB74D"],
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

  // עיבוד נתוני דוח ספקים – הפקת התפלגות
  const activeSuppliersCount = supplierReport.filter((s) => s.IsActive).length;
  const inactiveSuppliersCount = supplierReport.filter(
    (s) => !s.IsActive
  ).length;
  const supplierPieData = {
    labels: [t("dashboard.active"), t("dashboard.inactive")],
    datasets: [
      {
        data: [activeSuppliersCount, inactiveSuppliersCount],
        backgroundColor: ["#4CAF50", "#F44336"],
        hoverBackgroundColor: ["#66BB6A", "#E57373"],
      },
    ],
  };

  // עיבוד דוח חתימות – הפקת התפלגות סטטוס
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
        backgroundColor: ["#4CAF50", "#FF9800", "#9E9E9E"],
        hoverBackgroundColor: ["#66BB6A", "#FFB74D", "#BDBDBD"],
      },
    ],
  };

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-bg text-text p-6">
        <h1 className="text-2xl font-bold mb-4 text-primary">
          {t("dashboard.title")}
        </h1>

        {/* דוחות בסיסיים */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-primary">
            {t("dashboard.budget_summary")}
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="p-4 bg-bg shadow-md rounded-lg w-40 border border-border-color">
              <p className="font-bold">{t("dashboard.total_budgets")}</p>
              <p>{budgetSummary.count || 0}</p>
            </div>
            <div className="p-4 bg-bg shadow-md rounded-lg w-40 border border-border-color">
              <p className="font-bold">{t("dashboard.total_budget")}</p>
              <p>{totalBudget}</p>
            </div>
            <div className="p-4 bg-bg shadow-md rounded-lg w-40 border border-border-color">
              <p className="font-bold">{t("dashboard.total_spent")}</p>
              <p>{totalSpent}</p>
            </div>
            <div className="p-4 bg-bg shadow-md rounded-lg w-40 border border-border-color">
              <p className="font-bold">{t("dashboard.remaining")}</p>
              <p>{remainingBudget}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.budget_distribution")}
          </h2>
          <div
            className="p-4 bg-bg shadow-md rounded-lg"
            style={{ maxWidth: "400px", margin: "0 auto" }}
          >
            <Doughnut data={budgetDoughnutData} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.finance_summary")}
          </h2>
          <div
            className="p-4 bg-bg shadow-md rounded-lg"
            style={{ maxWidth: "600px", margin: "0 auto" }}
          >
            <Bar data={financeBarData} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.task_summary")}
          </h2>
          <div
            className="p-4 bg-bg shadow-md rounded-lg"
            style={{ maxWidth: "400px", margin: "0 auto" }}
          >
            <Pie data={taskPieData} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.procurement_summary")}
          </h2>
          <div
            className="p-4 bg-bg shadow-md rounded-lg"
            style={{ maxWidth: "600px", margin: "0 auto" }}
          >
            <Line data={procurementLineData} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.low_stock_items")}
          </h2>
          {lowStockItems.length > 0 ? (
            <div
              className="p-4 bg-bg shadow-md rounded-lg"
              style={{ maxWidth: "600px", margin: "0 auto" }}
            >
              <Radar data={lowStockRadarData} />
            </div>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.supplier_report")}
          </h2>
          {supplierReport.length > 0 ? (
            <div
              className="p-4 bg-bg shadow-md rounded-lg"
              style={{ maxWidth: "400px", margin: "0 auto" }}
            >
              <Doughnut data={supplierPieData} />
            </div>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.signature_report")}
          </h2>
          {signatureReport.length > 0 ? (
            <div
              className="p-4 bg-bg shadow-md rounded-lg"
              style={{ maxWidth: "400px", margin: "0 auto" }}
            >
              <Doughnut data={signatureDoughnutData} />
            </div>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </section>

        {/* טבלאות עבור דוחות בסיסיים */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-secondary">
            {t("dashboard.upcoming_events")}
          </h2>
          {upcomingEvents.length > 0 ? (
            <table className="min-w-full bg-bg border border-border-color rounded-lg">
              <thead>
                <tr>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.title")}
                  </th>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.start_date")}
                  </th>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.event_type")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.map((event) => (
                  <tr key={event._id}>
                    <td className="py-2 px-4 border border-border-color">
                      {event.title}
                    </td>
                    <td className="py-2 px-4 border border-border-color">
                      {new Date(event.startDate).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border border-border-color">
                      {event.eventType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">
            {t("dashboard.supplier_report")}
          </h2>
          {supplierReport.length > 0 ? (
            <table className="min-w-full bg-bg border border-border-color rounded-lg">
              <thead>
                <tr>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.supplier_name")}
                  </th>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.email")}
                  </th>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.phone")}
                  </th>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {supplierReport.map((supplier) => (
                  <tr key={supplier._id}>
                    <td className="py-2 px-4 border border-border-color">
                      {supplier.SupplierName}
                    </td>
                    <td className="py-2 px-4 border border-border-color">
                      {supplier.Email}
                    </td>
                    <td className="py-2 px-4 border border-border-color">
                      {supplier.Phone}
                    </td>
                    <td className="py-2 px-4 border border-border-color">
                      {supplier.IsActive
                        ? t("dashboard.active")
                        : t("dashboard.inactive")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">
            {t("dashboard.signature_report")}
          </h2>
          {signatureReport.length > 0 ? (
            <table className="min-w-full bg-bg border border-border-color rounded-lg">
              <thead>
                <tr>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.signature_name")}
                  </th>
                  <th className="py-2 px-4 border border-border-color">
                    {t("dashboard.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {signatureReport.map((sig) => (
                  <tr key={sig._id}>
                    <td className="py-2 px-4 border border-border-color">
                      {sig.name}
                    </td>
                    <td className="py-2 px-4 border border-border-color">
                      {sig.status || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </section>

        {/* Detailed Reports */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">
            {t("dashboard.detailed_reports")}
          </h2>
          <div className="space-y-8">
            {/* Detailed Budget by Project */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-primary">
                {t("dashboard.budget_by_project")}
              </h3>
              {detailedBudgetByProject &&
              detailedBudgetByProject.count !== undefined ? (
                <table className="min-w-full bg-bg border border-border-color rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.project_id")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.total_budget")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.total_spent")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.count")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-4 border border-border-color">
                        {detailedBudgetByProject._id || "-"}
                      </td>
                      <td className="py-2 px-4 border border-border-color">
                        {detailedBudgetByProject.totalBudget || 0}
                      </td>
                      <td className="py-2 px-4 border border-border-color">
                        {detailedBudgetByProject.totalSpent || 0}
                      </td>
                      <td className="py-2 px-4 border border-border-color">
                        {detailedBudgetByProject.count || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p>{t("dashboard.no_data")}</p>
              )}
            </div>
            {/* Detailed Finance */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-primary">
                {t("dashboard.detailed_finance")}
              </h3>
              {detailedFinance.length > 0 ? (
                <table className="min-w-full bg-bg border border-border-color rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.transaction_type")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.total_amount")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.transaction_count")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedFinance.map((tx, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 border border-border-color">
                          {tx.transactionType}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {tx.transactionAmount}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {tx.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t("dashboard.no_data")}</p>
              )}
            </div>
            {/* Detailed Task */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-primary">
                {t("dashboard.detailed_task")}
              </h3>
              {detailedTask.length > 0 ? (
                <table className="min-w-full bg-bg border border-border-color rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.status")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.count")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedTask.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 border border-border-color">
                          {item._id}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t("dashboard.no_data")}</p>
              )}
            </div>
            {/* Detailed Procurement by Supplier */}
            <div>
              <h3 className="text-lg font-bold mb-2">
                {t("dashboard.procurement_by_supplier")}
              </h3>
              {procurementBySupplier.length > 0 ? (
                <table className="min-w-full bg-bg border border-border-color rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.supplier_id")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.total_cost")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.order_count")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {procurementBySupplier.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 border border-border-color">
                          {item._id}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.totalCost}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t("dashboard.no_data")}</p>
              )}
            </div>
            {/* Detailed Event by Type */}
            <div>
              <h3 className="text-lg font-bold mb-2">
                {t("dashboard.event_by_type")}
              </h3>
              {eventByType.length > 0 ? (
                <table className="min-w-full bg-bg border border-border-color rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.event_title")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.start_date")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.event_type")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventByType.map((event, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 border border-border-color">
                          {event.title}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {new Date(event.startDate).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {event.eventType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t("dashboard.no_data")}</p>
              )}
            </div>
            {/* Detailed Inventory Reorder */}
            <div>
              <h3 className="text-lg font-bold mb-2">
                {t("dashboard.inventory_reorder")}
              </h3>
              {inventoryReorder.length > 0 ? (
                <table className="min-w-full bg-bg border border-border-color rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.product_name")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.quantity")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.min_stock")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReorder.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 border border-border-color">
                          {item.productId?.productName ||
                            t("dashboard.no_product_name")}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.minStockLevel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t("dashboard.no_data")}</p>
              )}
            </div>
            {/* Detailed Employee Performance */}
            <div>
              <h3 className="text-lg font-bold mb-2">
                {t("dashboard.employee_performance")}
              </h3>
              {employeePerformance.tasks &&
              employeePerformance.tasks.length > 0 ? (
                <div>
                  <h4 className="font-bold mb-1">{t("dashboard.tasks")}</h4>
                  <table className="min-w-full bg-bg mb-4 border border-border-color rounded-lg">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border border-border-color">
                          {t("dashboard.task_status")}
                        </th>
                        <th className="py-2 px-4 border border-border-color">
                          {t("dashboard.count")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeePerformance.tasks.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-4 border border-border-color">
                            {item._id}
                          </td>
                          <td className="py-2 px-4 border border-border-color">
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
              {employeePerformance.procurements &&
              employeePerformance.procurements.length > 0 ? (
                <div>
                  <h4 className="font-bold mb-1">
                    {t("dashboard.procurements")}
                  </h4>
                  <table className="min-w-full bg-bg border border-border-color rounded-lg">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border border-border-color">
                          {t("dashboard.order_status")}
                        </th>
                        <th className="py-2 px-4 border border-border-color">
                          {t("dashboard.count")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeePerformance.procurements.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-4 border border-border-color">
                            {item._id}
                          </td>
                          <td className="py-2 px-4 border border-border-color">
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
            {/* Detailed Supplier Performance */}
            <div>
              <h3 className="text-lg font-bold mb-2">
                {t("dashboard.supplier_performance")}
              </h3>
              {supplierPerformance.length > 0 ? (
                <table className="min-w-full bg-bg border border-border-color rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.supplier_name")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.order_count")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.total_cost")}
                      </th>
                      <th className="py-2 px-4 border border-border-color">
                        {t("dashboard.email")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierPerformance.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 border border-border-color">
                          {item.supplierName}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.orderCount}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.totalCost}
                        </td>
                        <td className="py-2 px-4 border border-border-color">
                          {item.Email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t("dashboard.no_data")}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
