import { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { FaChartLine } from "react-icons/fa";

const SalesTrends = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("line"); // 'line' or 'bar'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        yAxisID: "y",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
      {
        label: "📦 מספר הזמנות",
        data: data.timeline.orders,
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: "rgba(255, 159, 64, 0.1)",
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
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <FaChartLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              מגמות מכירות
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
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
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            גרף קו
          </button>
          <button
            onClick={() => setViewType("bar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === "bar"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            עמודות
          </button>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-xs text-green-600 font-medium uppercase">
            סה״כ מכירות
          </div>
          <div className="text-xl font-bold text-green-700 mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(data.kpis.totalSales)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-xs text-blue-600 font-medium uppercase">
            סה״כ הזמנות
          </div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            {data.kpis.totalOrders}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-xs text-purple-600 font-medium uppercase">
            ממוצע הזמנה
          </div>
          <div className="text-xl font-bold text-purple-700 mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
            }).format(data.kpis.avgSale)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="text-xs text-orange-600 font-medium uppercase">
            שיעור צמיחה
          </div>
          <div className="text-xl font-bold text-orange-700 mt-1">
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
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            פילוח לפי סטטוס הזמנה
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.byStatus.map((status, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="text-xs text-gray-500">{status._id}</div>
                <div className="text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat("he-IL", {
                    style: "currency",
                    currency: "ILS",
                    notation: "compact",
                  }).format(status.total)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
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

