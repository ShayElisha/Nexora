import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { FaBrain, FaArrowUp, FaArrowDown, FaChartLine } from "react-icons/fa";
import {
  getThemeColors,
  hexToRgba,
} from "../../../lib/designThemes";

const AIPredictions = () => {
  const [predictions, setPredictions] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = getThemeColors();
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener("nexora-theme-change", onTheme);
    return () => window.removeEventListener("nexora-theme-change", onTheme);
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const [predictionsRes, kpisRes] = await Promise.all([
        axiosInstance.get("/analytics/predictions", { withCredentials: true }),
        axiosInstance.get("/analytics/kpis", { withCredentials: true }),
      ]);

      setPredictions(predictionsRes.data.data);
      setKpis(kpisRes.data.data);
    } catch (error) {
      console.error("Error fetching AI predictions:", error);
      // נתונים ריקים במקרה של שגיאה
      setPredictions({
        predictions: { nextMonthRevenue: 0, nextMonthOrders: 0, nextMonthExpenses: 0, nextMonthProfit: 0 },
        trend: { direction: "stable", percentage: 0, message: "אין מספיק נתונים לחיזוי" },
        confidence: "low",
      });
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--border-color)]"></div>
      </div>
    );
  }

  if (!predictions || !kpis) return null;

  const { predictions: pred, trend } = predictions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--bg-color))] rounded-2xl shadow-lg p-6 border-2 border-[var(--border-color)]"
    >
      {/* Header with AI Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
            <FaBrain className="w-5 h-5 text-button-text" />
          </div>
          <div>
            <h3 className="text-xl font-bold">
              תחזיות AI
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              תחזיות מבוססות נתונים לחודש הבא
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="bg-[var(--bg-color)] rounded-lg px-3 py-2 border border-[var(--border-color)] shadow-sm">
          <div className="text-xs text-secondary uppercase">ודאות</div>
          <div className="text-sm font-bold text-primary">
            {predictions.confidence === "high"
              ? "גבוהה"
              : predictions.confidence === "medium"
              ? "בינונית"
              : "נמוכה"}
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div
        className={`mb-6 p-4 rounded-xl border ${
          trend.direction === "growing"
            ? "border-[var(--border-color)]"
            : trend.direction === "declining"
            ? "border-[var(--border-color)]"
            : "bg-[var(--bg-secondary)] border-[var(--border-color)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              trend.direction === "growing"
                ? "bg-accent"
                : trend.direction === "declining"
                ? "bg-primary"
                : "bg-secondary"
            }`}>
              {trend.direction === "growing" ? (
                <FaArrowUp className="w-5 h-5 text-button-text" />
              ) : trend.direction === "declining" ? (
                <FaArrowDown className="w-5 h-5 text-button-text" />
              ) : (
                <FaChartLine className="w-5 h-5 text-button-text" />
              )}
            </div>
            <div>
              <h4
                className={`text-lg font-bold ${
                  trend.direction === "growing"
                    ? "text-accent"
                    : trend.direction === "declining"
                    ? "text-primary"
                    : "text-secondary"
                }`}
              >
                {trend.direction === "growing"
                  ? "מגמה עולה"
                  : trend.direction === "declining"
                  ? "מגמה יורדת"
                  : "מגמה יציבה"}
              </h4>
              <p className="text-sm text-secondary">{trend.message}</p>
            </div>
          </div>
          <div
            className={`text-3xl font-bold ${
              trend.direction === "growing"
                ? "text-accent"
                : trend.direction === "declining"
                ? "text-primary"
                : "text-secondary"
            }`}
          >
            {trend.percentage > 0 ? "+" : ""}
            {trend.percentage}%
          </div>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-color)] rounded-lg p-4 shadow-sm border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--bg-color))] text-primary px-2 py-1 rounded font-semibold">
              תחזית
            </div>
          </div>
          <div className="text-xs text-secondary uppercase">הכנסות</div>
          <div className="text-xl font-bold text-primary mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(pred.nextMonthRevenue)}
          </div>
        </div>

        <div className="bg-[var(--bg-color)] rounded-lg p-4 shadow-sm border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--bg-color))] text-secondary px-2 py-1 rounded font-semibold">
              תחזית
            </div>
          </div>
          <div className="text-xs text-secondary uppercase">הזמנות</div>
          <div className="text-xl font-bold text-secondary mt-1">
            {pred.nextMonthOrders}
          </div>
        </div>

        <div className="bg-[var(--bg-color)] rounded-lg p-4 shadow-sm border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--bg-color))] text-primary px-2 py-1 rounded font-semibold">
              תחזית
            </div>
          </div>
          <div className="text-xs text-secondary uppercase">הוצאות</div>
          <div className="text-xl font-bold text-primary mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(pred.nextMonthExpenses)}
          </div>
        </div>

        <div
          className={`bg-[var(--bg-color)] rounded-lg p-4 shadow-sm border ${
            pred.nextMonthProfit >= 0
              ? "border-[var(--border-color)]"
              : "border-[var(--border-color)]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`text-xs px-2 py-1 rounded font-semibold ${
                pred.nextMonthProfit >= 0
                  ? "bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--bg-color))] text-accent"
                  : "bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--bg-color))] text-secondary"
              }`}
            >
              תחזית
            </div>
          </div>
          <div className="text-xs text-secondary uppercase">רווח צפוי</div>
          <div
            className={`text-xl font-bold mt-1 ${
              pred.nextMonthProfit >= 0 ? "text-accent" : "text-secondary"
            }`}
          >
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(pred.nextMonthProfit)}
          </div>
        </div>
      </div>

      {/* Current vs Predicted */}
      <div className="bg-[var(--bg-color)] rounded-xl p-5 border border-[var(--border-color)]">
        <h4 className="text-base font-semibold mb-4 uppercase tracking-wide">
          השוואה: נוכחי vs חזוי
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-secondary uppercase">
              הכנסות נוכחיות
            </div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
                notation: "compact",
              }).format(kpis.financial.revenue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-secondary uppercase">מרווח רווח</div>
            <div
              className={`text-lg font-bold ${
                kpis.financial.profitMargin > 0
                  ? "text-accent"
                  : "text-primary"
              }`}
            >
              {kpis.financial.profitMargin}%
            </div>
          </div>
          <div>
            <div className="text-xs text-secondary uppercase">שימור לקוחות</div>
            <div className="text-lg font-bold text-secondary">
              {kpis.customers.retentionRate}%
            </div>
          </div>
          <div>
            <div className="text-xs text-secondary uppercase">ערך מלאי</div>
            <div className="text-lg font-bold text-primary">
              {new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
                notation: "compact",
              }).format(kpis.inventory.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-6 rounded-lg p-4 border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--bg-color))]">
        <h4 className="text-sm font-bold mb-3 uppercase tracking-wide">
          תובנות
        </h4>
        <ul className="space-y-2 text-sm text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 text-xs">•</span>
                <span>
                  בהתבסס על הנתונים, הכנסותיך צפויות{" "}
                  {trend.direction === "growing" ? "לעלות" : "לרדת"} ב-
                  {Math.abs(trend.percentage)}% בחודש הבא
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5 text-xs">•</span>
                <span>
                  מרווח הרווח הנוכחי שלך הוא {kpis.financial.profitMargin}%
                  {kpis.financial.profitMargin > 20
                    ? " - מצוין!"
                    : kpis.financial.profitMargin > 10
                    ? " - סביר"
                    : " - מומלץ לשפר"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5 text-xs">•</span>
                <span>
                  ערך ההזמנה הממוצע שלך:{" "}
                  {new Intl.NumberFormat("he-IL", {
                    style: "currency",
                    currency: "ILS",
                  }).format(kpis.sales.avgOrderValue)}
                </span>
            </li>
            {kpis.inventory.lowStockItems > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-0.5 text-xs">•</span>
                <span className="text-secondary font-medium">
                  יש {kpis.inventory.lowStockItems} מוצרים במלאי נמוך -
                  מומלץ לרכוש בקרוב
                </span>
              </li>
            )}
          </ul>
      </div>
    </motion.div>
  );
};

export default AIPredictions;
