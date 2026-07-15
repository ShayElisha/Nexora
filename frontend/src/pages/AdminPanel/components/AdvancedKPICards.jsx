import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaShoppingCart,
  FaBox,
  FaGem,
  FaUsers,
} from "react-icons/fa";
import { themeIconBg, themeSoftStyle } from "../../../lib/designThemes";

const TONES = ["primary", "secondary", "accent"];

const AdvancedKPICards = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setThemeTick] = useState(0);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener("nexora-theme-change", onTheme);
    return () => window.removeEventListener("nexora-theme-change", onTheme);
  }, []);

  const fetchKPIs = async () => {
    try {
      const response = await axiosInstance.get("/analytics/kpis", {
        withCredentials: true,
      });
      setKpis(response.data.data);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      setKpis({
        financial: {
          revenue: 0,
          expenses: 0,
          netProfit: 0,
          profitMargin: 0,
          cashFlow: 0,
        },
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
            className="h-40 rounded-2xl animate-pulse"
            style={{ backgroundColor: "var(--footer-bg)" }}
          />
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
    },
    {
      icon: FaMoneyBillWave,
      title: "סה״כ הוצאות",
      value: kpis.financial.expenses,
      format: "currency",
    },
    {
      icon: FaChartLine,
      title: "רווח נקי",
      value: kpis.financial.netProfit,
      format: "currency",
      badge: kpis.financial.netProfit >= 0 ? "רווחי" : "הפסד",
    },
    {
      icon: FaChartLine,
      title: "מרווח רווח",
      value: kpis.financial.profitMargin,
      format: "percent",
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
    },
    {
      icon: FaBox,
      title: "מספר הזמנות",
      value: kpis.sales.totalOrders,
      format: "number",
    },
    {
      icon: FaGem,
      title: "ערך הזמנה ממוצע",
      value: kpis.sales.avgOrderValue,
      format: "currency",
    },
    {
      icon: FaUsers,
      title: "לקוחות פעילים",
      value: kpis.customers.active,
      format: "number",
      subtitle: `${kpis.customers.retentionRate}% שימור`,
    },
  ];

  const formatValue = (value, format) => {
    if (format === "currency") {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    }
    if (format === "percent") {
      return `${value}%`;
    }
    return value.toLocaleString("he-IL");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const tone = TONES[index % TONES.length];
        const soft = themeSoftStyle(tone);
        const iconBg = themeIconBg(tone);
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2"
            style={soft}
          >
            {card.badge && (
              <div className="mb-3">
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold shadow-sm"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {card.badge}
                </span>
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
                style={iconBg}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div
                  className="text-3xl font-bold"
                  style={{ color: "var(--text-color)" }}
                >
                  {formatValue(card.value, card.format)}
                </div>
              </div>
            </div>

            <div>
              <h3
                className="text-sm font-semibold uppercase tracking-wide mb-1"
                style={{ color: "var(--color-secondary)" }}
              >
                {card.title}
              </h3>
              {card.subtitle && (
                <p
                  className="text-xs"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {card.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AdvancedKPICards;
