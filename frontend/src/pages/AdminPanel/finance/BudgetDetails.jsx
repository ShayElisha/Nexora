import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import {
  Wallet,
  TrendingUp,
  Calendar,
  Package,
  AlertCircle,
  ArrowLeft,
  DollarSign,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

function createDateMapFromItems(items) {
  const dateMap = {};
  for (const item of items) {
    if (!item.addedAt) continue;
    const dayKey = new Date(item.addedAt).toISOString().split("T")[0];
    dateMap[dayKey] = (dateMap[dayKey] || 0) + (item.totalPrice || 0);
  }
  return dateMap;
}

function computeDailyCumulative(startDate, endDate, items) {
  const allDays = generateDateRange(startDate, endDate);
  const dateMap = createDateMapFromItems(items);

  let cumulative = 0;
  const result = [];
  for (const day of allDays) {
    const dayTotal = dateMap[day] || 0;
    cumulative += dayTotal;
    result.push({ date: day, cumulativeTotal: cumulative });
  }
  return result;
}

function generateDateRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (start > end) return [];

  const dateArray = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateArray.push(new Date(d).toISOString().split("T")[0]);
  }
  return dateArray;
}

const BudgetDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const { data: apiRes, isLoading, error } = useQuery({
    queryKey: ["budget", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/budget/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          className="w-16 h-16 border-4 border-t-4 rounded-full"
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  if (error || !apiRes?.data) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-xl font-semibold text-red-500">
            {error ? t("finance.budget.error_loading_details") : t("finance.budget.no_data_found")}
          </p>
        </div>
      </div>
    );
  }

  const budget = apiRes.data;
  const { departmentOrProjectName, amount, currency: budgetCurrency, startDate, endDate, items = [], spentAmount = 0 } = budget;
  const dailyCumulative = computeDailyCumulative(startDate, endDate, items);
  const remaining = amount - spentAmount;
  const spentPercentage = amount > 0 ? ((spentAmount / amount) * 100).toFixed(1) : 0;

  const actualLine = dailyCumulative.map((row) => ({
    x: row.date,
    y: row.cumulativeTotal,
  }));

  const budgetLine = dailyCumulative.map((row) => ({
    x: row.date,
    y: amount,
  }));

  const chartData = {
    datasets: [
      {
        label: t("finance.budget.actual_spend_cumulative"),
        data: actualLine,
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: "white",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: t("finance.budget.budget_limit"),
        data: budgetLine,
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderWidth: 3,
        pointRadius: 0,
        borderDash: [10, 5],
        tension: 0,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 14 } } },
      title: {
        display: true,
        text: t("finance.budget.daily_budget_vs_spend"),
        font: { size: 18, weight: "bold" },
        padding: { top: 10, bottom: 20 },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day", tooltipFormat: "yyyy-MM-dd" },
        title: { display: true, text: t("finance.budget.date"), font: { size: 14 } },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: t("finance.budget.amount"), font: { size: 14 } },
      },
    },
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to="/dashboard/finance/Budgets"
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
          >
            <ArrowLeft size={20} />
            {t("finance.budget.back_to_list")}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Wallet size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {departmentOrProjectName}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("finance.budget.budget_details")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            { label: t("finance.budget.allocated"), value: `${amount.toLocaleString()} ${budgetCurrency}`, icon: DollarSign, color: "#10b981" },
            { label: t("finance.budget.spent"), value: `${spentAmount.toLocaleString()} ${budgetCurrency}`, icon: TrendingUp, color: "#ef4444" },
            { label: t("finance.budget.remaining"), value: `${remaining.toLocaleString()} ${budgetCurrency}`, icon: Wallet, color: "#f59e0b" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl shadow-lg p-6 border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <stat.icon size={24} color={stat.color} />
                </div>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <motion.div
          className="rounded-2xl shadow-lg p-6 border mb-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <div style={{ height: '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Items Table */}
        <motion.div
          className="rounded-2xl shadow-lg overflow-hidden border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
              <Package size={24} />
              {t("finance.budget.items")}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: 'var(--border-color)' }}>
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("finance.budget.date")}
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("finance.budget.quantity")}
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("finance.budget.unit_price")}
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("finance.budget.total_price")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center">
                      <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
                      <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                        {t("finance.budget.no_items_available")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, i) => (
                    <motion.tr
                      key={i}
                      className="border-b hover:bg-opacity-50"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td className="py-3 px-6 text-sm" style={{ color: 'var(--text-color)' }}>
                        {item.addedAt?.split("T")[0] || "N/A"}
                      </td>
                      <td className="py-3 px-6 text-sm" style={{ color: 'var(--color-secondary)' }}>
                        {item.quantity || "-"}
                      </td>
                      <td className="py-3 px-6 text-sm" style={{ color: 'var(--color-secondary)' }}>
                        {item.unitPrice || "-"}
                      </td>
                      <td className="py-3 px-6 text-sm font-bold text-green-600">
                        {item.totalPrice || "-"}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BudgetDetails;
