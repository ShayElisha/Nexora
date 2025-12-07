import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaShoppingCart, 
  FaBox, 
  FaGem, 
  FaUsers 
} from "react-icons/fa";

const AdvancedKPICards = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const response = await axiosInstance.get("/analytics/kpis", {
        withCredentials: true,
      });
      setKpis(response.data.data);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      // אם יש שגיאה, נשתמש בנתונים ריקים
      setKpis({
        financial: { revenue: 0, expenses: 0, netProfit: 0, profitMargin: 0, cashFlow: 0 },
        sales: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
        inventory: { totalValue: 0, lowStockItems: 0 },
        customers: { active: 0, total: 0, retentionRate: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-40 bg-gray-100 rounded-2xl animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const cards = [
    {
      icon: FaMoneyBillWave,
      title: "סה״כ הכנסות",
      value: kpis.financial.revenue,
      format: "currency",
      color: "green",
    },
    {
      icon: FaMoneyBillWave,
      title: "סה״כ הוצאות",
      value: kpis.financial.expenses,
      format: "currency",
      color: "red",
    },
    {
      icon: FaChartLine,
      title: "רווח נקי",
      value: kpis.financial.netProfit,
      format: "currency",
      color: kpis.financial.netProfit >= 0 ? "blue" : "orange",
      badge: kpis.financial.netProfit >= 0 ? "רווחי" : "הפסד",
    },
    {
      icon: FaChartLine,
      title: "מרווח רווח",
      value: kpis.financial.profitMargin,
      format: "percent",
      color: "purple",
      badge:
        kpis.financial.profitMargin > 20
          ? "מצוין"
          : kpis.financial.profitMargin > 10
          ? "טוב"
          : "בינוני",
    },
    {
      icon: FaShoppingCart,
      title: "סה״כ מכירות",
      value: kpis.sales.totalRevenue,
      format: "currency",
      color: "teal",
    },
    {
      icon: FaBox,
      title: "מספר הזמנות",
      value: kpis.sales.totalOrders,
      format: "number",
      color: "indigo",
    },
    {
      icon: FaGem,
      title: "ערך הזמנה ממוצע",
      value: kpis.sales.avgOrderValue,
      format: "currency",
      color: "pink",
    },
    {
      icon: FaUsers,
      title: "לקוחות פעילים",
      value: kpis.customers.active,
      format: "number",
      color: "cyan",
      subtitle: `${kpis.customers.retentionRate}% שימור`,
    },
  ];

  const colorClasses = {
    green: {
      bg: "from-green-50 to-green-100",
      border: "border-green-200",
      icon: "bg-green-500",
      text: "text-green-700",
    },
    red: {
      bg: "from-red-50 to-red-100",
      border: "border-red-200",
      icon: "bg-red-500",
      text: "text-red-700",
    },
    blue: {
      bg: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      icon: "bg-blue-500",
      text: "text-blue-700",
    },
    purple: {
      bg: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      icon: "bg-purple-500",
      text: "text-purple-700",
    },
    orange: {
      bg: "from-orange-50 to-orange-100",
      border: "border-orange-200",
      icon: "bg-orange-500",
      text: "text-orange-700",
    },
    teal: {
      bg: "from-teal-50 to-teal-100",
      border: "border-teal-200",
      icon: "bg-teal-500",
      text: "text-teal-700",
    },
    indigo: {
      bg: "from-indigo-50 to-indigo-100",
      border: "border-indigo-200",
      icon: "bg-indigo-500",
      text: "text-indigo-700",
    },
    pink: {
      bg: "from-pink-50 to-pink-100",
      border: "border-pink-200",
      icon: "bg-pink-500",
      text: "text-pink-700",
    },
    cyan: {
      bg: "from-cyan-50 to-cyan-100",
      border: "border-cyan-200",
      icon: "bg-cyan-500",
      text: "text-cyan-700",
    },
  };

  const formatValue = (value, format) => {
    if (format === "currency") {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    } else if (format === "percent") {
      return `${value}%`;
    } else {
      return value.toLocaleString("he-IL");
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`bg-gradient-to-br ${colors.bg} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 ${colors.border}`}
          >
            {/* Badge (if exists) */}
            {card.badge && (
              <div className="mb-3">
                <span className="text-xs bg-white px-3 py-1 rounded-full font-semibold text-gray-700 shadow-sm">
                  {card.badge}
                </span>
              </div>
            )}

            {/* Icon and Value */}
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center shadow-sm`}
              >
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${colors.text}`}>
                  {formatValue(card.value, card.format)}
                </div>
              </div>
            </div>

            {/* Title and Subtitle */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                {card.title}
              </h3>
              {card.subtitle && (
                <p className="text-xs text-gray-500">{card.subtitle}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AdvancedKPICards;

