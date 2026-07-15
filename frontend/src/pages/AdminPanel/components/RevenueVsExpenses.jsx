import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { FaChartArea } from "react-icons/fa";
import {
  getThemeColors,
  hexToRgba,
} from "../../../lib/designThemes";

const RevenueVsExpenses = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("12months");
  const theme = getThemeColors();
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener("nexora-theme-change", onTheme);
    return () => window.removeEventListener("nexora-theme-change", onTheme);
  }, []);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/analytics/revenue-vs-expenses?period=${period}`,
        { withCredentials: true }
      );
      setData(response.data.data);
    } catch (error) {
      console.error("Error fetching revenue vs expenses:", error);
      // נתונים ריקים במקרה של שגיאה
      setData({
        labels: [],
        datasets: { income: [], expenses: [], profit: [] },
        kpis: { totalIncome: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, avgMonthlyIncome: 0, avgMonthlyExpenses: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "💰 הכנסות",
        data: data.datasets.income,
        borderColor: theme.accent,
        backgroundColor: hexToRgba(theme.accent, 0.12),
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
      {
        label: "💸 הוצאות",
        data: data.datasets.expenses,
        borderColor: theme.primary,
        backgroundColor: hexToRgba(theme.primary, 0.12),
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
      {
        label: "📈 רווח",
        data: data.datasets.profit,
        borderColor: theme.secondary,
        backgroundColor: hexToRgba(theme.secondary, 0.12),
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 14, weight: "bold" },
          padding: 20,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
            }).format(context.parsed.y);
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(value);
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-color)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FaChartArea className="w-5 h-5 text-button-text" />
          </div>
          <div>
            <h3 className="text-xl font-bold">
              הכנסות vs הוצאות
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              ניתוח פיננסי לאורך זמן
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {["6months", "12months", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? "bg-primary text-button-text shadow-md"
                  : "bg-gray-100 text-secondary hover:bg-gray-200"
              }`}
            >
              {p === "6months"
                ? "6 חודשים"
                : p === "12months"
                ? "12 חודשים"
                : "שנה נוכחית"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))] bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--bg-color))]">
          <div className="text-sm text-accent font-medium">סה״כ הכנסות</div>
          <div className="text-2xl font-bold text-accent mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(data.kpis.totalIncome)}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))]">
          <div className="text-sm text-primary font-medium">סה״כ הוצאות</div>
          <div className="text-2xl font-bold text-primary mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(data.kpis.totalExpenses)}
          </div>
        </div>

        <div
          className={`bg-gradient-to-r ${
            data.kpis.netProfit >= 0
              ? "border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--bg-color))]"
              : "border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--bg-color))]"
          } rounded-xl p-4 border`}
        >
          <div
            className={`text-sm font-medium ${
              data.kpis.netProfit >= 0 ? "text-secondary" : "text-secondary"
            }`}
          >
            רווח נקי
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              data.kpis.netProfit >= 0 ? "text-secondary" : "text-secondary"
            }`}
          >
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(data.kpis.netProfit)}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))]">
          <div className="text-sm text-primary font-medium">
            מרווח רווח
          </div>
          <div className="text-2xl font-bold text-primary mt-1">
            {data.kpis.profitMargin}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--border-color)]">
        <div>
          <div className="text-sm text-secondary">הכנסה ממוצעת חודשית</div>
          <div className="text-lg font-semibold">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
            }).format(data.kpis.avgMonthlyIncome || 0)}
          </div>
        </div>
        <div>
          <div className="text-sm text-secondary">הוצאה ממוצעת חודשית</div>
          <div className="text-lg font-semibold">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
            }).format(data.kpis.avgMonthlyExpenses || 0)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RevenueVsExpenses;

