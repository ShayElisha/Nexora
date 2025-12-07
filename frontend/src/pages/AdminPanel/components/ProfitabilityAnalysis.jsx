import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { FaChartBar } from "react-icons/fa";

const ProfitabilityAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("product"); // 'product', 'customer', 'both'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
            backgroundColor: "rgba(75, 192, 192, 0.8)",
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
            backgroundColor: "rgba(54, 162, 235, 0.8)",
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
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <FaChartBar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              ניתוח רווחיות
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
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
                ? "bg-teal-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            לפי מוצר
          </button>
          <button
            onClick={() => setViewMode("customer")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "customer"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              TOP 10 מוצרים מרווחיים
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
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
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {product.productName}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(product.avgPrice)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
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
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              TOP 10 לקוחות מרווחיים
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
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
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {customer.customerName}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(customer.revenue)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {customer.orders}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                        }).format(customer.avgOrderValue)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
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

