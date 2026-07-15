import { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { FaChartLine } from "react-icons/fa";
import {
  getThemeColors,
  hexToRgba,
} from "../../../lib/designThemes";

const SalesTrends = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("line"); // 'line' or 'bar'
  const theme = getThemeColors();
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener("nexora-theme-change", onTheme);
    return () => window.removeEventListener("nexora-theme-change", onTheme);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/analytics/sales-trends", {
        withCredentials: true,
      });
      setData(response.data.data);
    } catch (error) {
      console.error("Error fetching sales trends:", error);
      // נתונים ריקים במקרה של שגיאה
      setData({
        timeline: { labels: [], sales: [], orders: [], avgOrderValue: [], growthRates: [] },
        byStatus: [],
        kpis: { totalSales: 0, totalOrders: 0, avgSale: 0, avgGrowthRate: 0 },
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
    labels: data.timeline.labels,
    datasets: [
      {
        label: "💰 מכירות (₪)",
        data: data.timeline.sales,
        borderColor: theme.accent,
        backgroundColor: hexToRgba(theme.accent, 0.12),
        yAxisID: "y",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
      {
        label: "📦 מספר הזמנות",
        data: data.timeline.orders,
        borderColor: theme.secondary,
        backgroundColor: hexToRgba(theme.secondary, 0.12),
        yAxisID: "y1",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
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
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.datasetIndex === 0) {
              label += new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
              }).format(context.parsed.y);
            } else {
              label += context.parsed.y;
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "מכירות (₪)",
          font: { size: 12, weight: "bold" },
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "מספר הזמנות",
          font: { size: 12, weight: "bold" },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
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
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <FaChartLine className="w-5 h-5 text-button-text" />
          </div>
          <div>
            <h3 className="text-xl font-bold">
              מגמות מכירות
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              ניתוח מכירות לאורך זמן
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewType("line")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === "line"
                ? "bg-primary text-button-text shadow-md"
                : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            גרף קו
          </button>
          <button
            onClick={() => setViewType("bar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === "bar"
                ? "bg-primary text-button-text shadow-md"
                : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            עמודות
          </button>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))] bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--bg-color))]">
          <div className="text-xs text-accent font-medium uppercase">
            סה״כ מכירות
          </div>
          <div className="text-xl font-bold text-accent mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(data.kpis.totalSales)}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--bg-color))]">
          <div className="text-xs text-secondary font-medium uppercase">
            סה״כ הזמנות
          </div>
          <div className="text-xl font-bold text-secondary mt-1">
            {data.kpis.totalOrders}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))]">
          <div className="text-xs text-primary font-medium uppercase">
            ממוצע הזמנה
          </div>
          <div className="text-xl font-bold text-primary mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
            }).format(data.kpis.avgSale)}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-color))] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--bg-color))]">
          <div className="text-xs text-secondary font-medium uppercase">
            שיעור צמיחה
          </div>
          <div className="text-xl font-bold text-secondary mt-1">
            {data.kpis.avgGrowthRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        {viewType === "line" ? (
          <Line data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>

      {/* Status Breakdown */}
      {data.byStatus && data.byStatus.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
          <h4 className="text-sm font-semibold text-secondary mb-3">
            פילוח לפי סטטוס הזמנה
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.byStatus.map((status, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-3 border border-[var(--border-color)]"
              >
                <div className="text-xs text-secondary">{status._id}</div>
                <div className="text-lg font-bold">
                  {new Intl.NumberFormat("he-IL", {
                    style: "currency",
                    currency: "ILS",
                    notation: "compact",
                  }).format(status.total)}
                </div>
                <div className="text-xs text-secondary mt-1">
                  {status.count} הזמנות
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SalesTrends;

