import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { axiosInstance } from "../../../lib/axios";
import { motion } from "framer-motion";
import { FaBrain, FaArrowUp, FaArrowDown, FaChartLine } from "react-icons/fa";

const AIPredictions = () => {
  const [predictions, setPredictions] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!predictions || !kpis) return null;

  const { predictions: pred, trend } = predictions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200"
    >
      {/* Header with AI Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <FaBrain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              תחזיות AI
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              תחזיות מבוססות נתונים לחודש הבא
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase">ודאות</div>
          <div className="text-sm font-bold text-purple-600">
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
            ? "bg-green-50 border-green-200"
            : trend.direction === "declining"
            ? "bg-red-50 border-red-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              trend.direction === "growing"
                ? "bg-green-500"
                : trend.direction === "declining"
                ? "bg-red-500"
                : "bg-gray-500"
            }`}>
              {trend.direction === "growing" ? (
                <FaArrowUp className="w-5 h-5 text-white" />
              ) : trend.direction === "declining" ? (
                <FaArrowDown className="w-5 h-5 text-white" />
              ) : (
                <FaChartLine className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4
                className={`text-lg font-bold ${
                  trend.direction === "growing"
                    ? "text-green-700"
                    : trend.direction === "declining"
                    ? "text-red-700"
                    : "text-gray-700"
                }`}
              >
                {trend.direction === "growing"
                  ? "מגמה עולה"
                  : trend.direction === "declining"
                  ? "מגמה יורדת"
                  : "מגמה יציבה"}
              </h4>
              <p className="text-sm text-gray-600">{trend.message}</p>
            </div>
          </div>
          <div
            className={`text-3xl font-bold ${
              trend.direction === "growing"
                ? "text-green-600"
                : trend.direction === "declining"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {trend.percentage > 0 ? "+" : ""}
            {trend.percentage}%
          </div>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded font-semibold">
              תחזית
            </div>
          </div>
          <div className="text-xs text-gray-500 uppercase">הכנסות</div>
          <div className="text-xl font-bold text-purple-600 mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(pred.nextMonthRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-semibold">
              תחזית
            </div>
          </div>
          <div className="text-xs text-gray-500 uppercase">הזמנות</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {pred.nextMonthOrders}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-semibold">
              תחזית
            </div>
          </div>
          <div className="text-xs text-gray-500 uppercase">הוצאות</div>
          <div className="text-xl font-bold text-red-600 mt-1">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              notation: "compact",
            }).format(pred.nextMonthExpenses)}
          </div>
        </div>

        <div
          className={`bg-white rounded-lg p-4 shadow-sm border ${
            pred.nextMonthProfit >= 0
              ? "border-green-200"
              : "border-orange-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`text-xs px-2 py-1 rounded font-semibold ${
                pred.nextMonthProfit >= 0
                  ? "bg-green-100 text-green-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              תחזית
            </div>
          </div>
          <div className="text-xs text-gray-500 uppercase">רווח צפוי</div>
          <div
            className={`text-xl font-bold mt-1 ${
              pred.nextMonthProfit >= 0 ? "text-green-600" : "text-orange-600"
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
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h4 className="text-base font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          השוואה: נוכחי vs חזוי
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase">
              הכנסות נוכחיות
            </div>
            <div className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
                notation: "compact",
              }).format(kpis.financial.revenue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">מרווח רווח</div>
            <div
              className={`text-lg font-bold ${
                kpis.financial.profitMargin > 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {kpis.financial.profitMargin}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">שימור לקוחות</div>
            <div className="text-lg font-bold text-blue-600">
              {kpis.customers.retentionRate}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">ערך מלאי</div>
            <div className="text-lg font-bold text-purple-600">
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
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
          תובנות
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5 text-xs">•</span>
                <span>
                  בהתבסס על הנתונים, הכנסותיך צפויות{" "}
                  {trend.direction === "growing" ? "לעלות" : "לרדת"} ב-
                  {Math.abs(trend.percentage)}% בחודש הבא
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-xs">•</span>
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
                <span className="text-green-500 mt-0.5 text-xs">•</span>
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
                <span className="text-orange-500 mt-0.5 text-xs">•</span>
                <span className="text-orange-700 font-medium">
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
