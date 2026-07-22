import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { FaChartBar } from "react-icons/fa";
import {
  getThemeColors,
  hexToRgba,
} from "../../../lib/designThemes";

const ProfitabilityAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("product"); // 'product', 'customer', 'both'
  const theme = getThemeColors();
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener("nexora-theme-change", onTheme);
    return () => window.removeEventListener("nexora-theme-change", onTheme);
  }, []);

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/analytics/profitability?type=${viewMode}`,
        { withCredentials: true }
      );
      setData(response.data.data);
    } catch (error) {
      console.error("Error fetching profitability:", error);
      // נתונים ריקים במקרה של שגיאה
      setData({
        byProduct: [],
        byCustomer: [],
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

  // Data for products chart
  const productData = data.byProduct
    ? {
        labels: data.byProduct.slice(0, 10).map((p) => p.productName),
        datasets: [
          {
            label: "הכנסות (₪)",
            data: data.byProduct.slice(0, 10).map((p) => p.revenue),
            backgroundColor: hexToRgba(theme.accent, 0.8),
            borderWidth: 2,
          },
        ],
      }
    : null;

  // Data for customers chart
  const customerData = data.byCustomer
    ? {
        labels: data.byCustomer.slice(0, 10).map((c) => c.customerName),
        datasets: [
          {
            label: "הכנסות (₪)",
            data: data.byCustomer.slice(0, 10).map((c) => c.revenue),
            backgroundColor: hexToRgba(theme.secondary, 0.8),
            borderWidth: 2,
          },
        ],
      }
    : null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return (
              context.dataset.label +
              ": " +
              new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
              }).format(context.parsed.y)
            );
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
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <FaChartBar className="w-5 h-5 text-button-text" />
          </div>
          <div>
            <h3 className="text-xl font-bold">
              ניתוח רווחיות
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              המוצרים והלקוחות המובילים
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("product")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "product"
                ? "bg-accent text-button-text shadow-md"
                : "bg-[var(--bg-secondary)] text-secondary hover:bg-[var(--border-color)]"
            }`}
          >
            לפי מוצר
          </button>
          <button
            onClick={() => setViewMode("customer")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "customer"
                ? "bg-primary text-button-text shadow-md"
                : "bg-[var(--bg-secondary)] text-secondary hover:bg-[var(--border-color)]"
            }`}
          >
            לפי לקוח
          </button>
        </div>
      </div>

      {/* Products View */}
      {viewMode === "product" && data.byProduct && (
        <>
          <div className="h-96 mb-6">
            <Bar data={productData} options={options} />
          </div>

          {/* Top Products Table */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
            <h4 className="text-base font-semibold mb-4">
              TOP 10 מוצרים מרווחיים
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--border-color)] text-secondary">
                    <th className="px-4 py-2 text-right">#</th>
                    <th className="px-4 py-2 text-right">מוצר</th>
                    <th className="px-4 py-2 text-right">הכנסות</th>
                    <th className="px-4 py-2 text-right">כמות נמכרה</th>
                    <th className="px-4 py-2 text-right">מחיר ממוצע</th>
                    <th className="px-4 py-2 text-right">הזמנות</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProduct.slice(0, 10).map((product, index) => (
                    <tr
                      key={index}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                    >
                      <td className="px-4 py-3 font-semibold text-[var(--color-secondary)]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {product.productName}
                      </td>
                      <td className="px-4 py-3 font-semibold text-accent">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(product.avgPrice)}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {product.orderCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Customers View */}
      {viewMode === "customer" && data.byCustomer && (
        <>
          <div className="h-96 mb-6">
            <Bar data={customerData} options={options} />
          </div>

          {/* Top Customers Table */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
            <h4 className="text-base font-semibold mb-4">
              TOP 10 לקוחות מרווחיים
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--border-color)] text-secondary">
                    <th className="px-4 py-2 text-right">#</th>
                    <th className="px-4 py-2 text-right">לקוח</th>
                    <th className="px-4 py-2 text-right">הכנסות כוללות</th>
                    <th className="px-4 py-2 text-right">מספר הזמנות</th>
                    <th className="px-4 py-2 text-right">ממוצע הזמנה</th>
                    <th className="px-4 py-2 text-right">הזמנה אחרונה</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCustomer.slice(0, 10).map((customer, index) => (
                    <tr
                      key={index}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                    >
                      <td className="px-4 py-3 font-semibold text-[var(--color-secondary)]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {customer.customerName}
                      </td>
                      <td className="px-4 py-3 font-semibold text-secondary">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(customer.revenue)}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {customer.orders}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(customer.avgOrderValue)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-secondary)]">
                        {new Date(customer.lastOrderDate).toLocaleDateString(
                          "he-IL"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ProfitabilityAnalysis;

