import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line as LineChart, Bar as BarChart, Pie as PieChart } from "react-chartjs-2";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Statistics Cards Component
const StatisticsCards = ({ data, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-bg rounded-xl p-6 shadow-lg border border-border-color animate-pulse"
          >
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalIncome = data?.reduce((sum, item) => sum + (item.income || 0), 0) || 0;
  const totalExpense = data?.reduce((sum, item) => sum + (item.expense || 0), 0) || 0;
  const netCashFlow = totalIncome - totalExpense;
  const avgMonthly = data?.length > 0 ? netCashFlow / data.length : 0;

  const cards = [
    {
      title: t("finance.cashFlow.total_income"),
      value: `₪${totalIncome.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: t("finance.cashFlow.total_expense"),
      value: `₪${totalExpense.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: t("finance.cashFlow.net_cash_flow"),
      value: `₪${netCashFlow.toLocaleString()}`,
      icon: DollarSign,
      color: netCashFlow >= 0 ? "text-green-500" : "text-red-500",
      bgColor: netCashFlow >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: t("finance.cashFlow.avg_monthly"),
      value: `₪${avgMonthly.toLocaleString()}`,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-bg rounded-xl p-6 shadow-lg border border-border-color hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <Icon className={`${card.color} w-6 h-6`} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-text/70 mb-2">
              {card.title}
            </h3>
            <p className="text-3xl font-bold text-text">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};

// Cash Flow Line Chart Component
const CashFlowLineChart = ({ data, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <div className="animate-pulse text-text/70">{t("finance.cashFlow.loading")}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <p className="text-text/70">{t("finance.cashFlow.no_data")}</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.periodLabel),
    datasets: [
      {
        label: t("finance.cashFlow.income"),
        data: data.map((item) => item.income || 0),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: t("finance.cashFlow.expense"),
        data: data.map((item) => item.expense || 0),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: t("finance.cashFlow.net_cash_flow"),
        data: data.map((item) => item.netCashFlow || 0),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "var(--text-color)",
        },
      },
      title: {
        display: true,
        text: t("finance.cashFlow.cash_flow_over_time"),
        color: "var(--text-color)",
        font: {
          size: 18,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "var(--text-color)",
          callback: function (value) {
            return "₪" + value.toLocaleString();
          },
        },
        grid: {
          color: "var(--border-color)",
        },
      },
      x: {
        ticks: {
          color: "var(--text-color)",
        },
        grid: {
          color: "var(--border-color)",
        },
      },
    },
  };

  return (
    <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color">
      <div className="h-96">
        <LineChart data={chartData} options={options} />
      </div>
    </div>
  );
};

// Cumulative Cash Flow Chart
const CumulativeCashFlowChart = ({ data, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <div className="animate-pulse text-text/70">{t("finance.cashFlow.loading")}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <p className="text-text/70">{t("finance.cashFlow.no_data")}</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.periodLabel),
    datasets: [
      {
        label: t("finance.cashFlow.cumulative_cash_flow"),
        data: data.map((item) => item.cumulative || 0),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "var(--text-color)",
        },
      },
      title: {
        display: true,
        text: t("finance.cashFlow.cumulative_cash_flow"),
        color: "var(--text-color)",
        font: {
          size: 18,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: "var(--text-color)",
          callback: function (value) {
            return "₪" + value.toLocaleString();
          },
        },
        grid: {
          color: "var(--border-color)",
        },
      },
      x: {
        ticks: {
          color: "var(--text-color)",
        },
        grid: {
          color: "var(--border-color)",
        },
      },
    },
  };

  return (
    <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color">
      <div className="h-96">
        <LineChart data={chartData} options={options} />
      </div>
    </div>
  );
};

// Category Breakdown Chart
const CategoryBreakdownChart = ({ data, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <div className="animate-pulse text-text/70">{t("finance.cashFlow.loading")}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <p className="text-text/70">{t("finance.cashFlow.no_data")}</p>
      </div>
    );
  }

  // Top 10 categories by absolute net cash flow
  const topCategories = [...data]
    .sort((a, b) => Math.abs(b.netCashFlow) - Math.abs(a.netCashFlow))
    .slice(0, 10);

  const chartData = {
    labels: topCategories.map((item) => item.category),
    datasets: [
      {
        label: t("finance.cashFlow.income"),
        data: topCategories.map((item) => item.income || 0),
        backgroundColor: "rgba(34, 197, 94, 0.6)",
      },
      {
        label: t("finance.cashFlow.expense"),
        data: topCategories.map((item) => item.expense || 0),
        backgroundColor: "rgba(239, 68, 68, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "var(--text-color)",
        },
      },
      title: {
        display: true,
        text: t("finance.cashFlow.by_category"),
        color: "var(--text-color)",
        font: {
          size: 18,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "var(--text-color)",
          callback: function (value) {
            return "₪" + value.toLocaleString();
          },
        },
        grid: {
          color: "var(--border-color)",
        },
      },
      x: {
        ticks: {
          color: "var(--text-color)",
        },
        grid: {
          color: "var(--border-color)",
        },
      },
    },
  };

  return (
    <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color">
      <div className="h-96">
        <BarChart data={chartData} options={options} />
      </div>
    </div>
  );
};

// Forecast Chart
const ForecastChart = ({ data, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <div className="animate-pulse text-text/70">{t("finance.cashFlow.loading")}</div>
      </div>
    );
  }

  if (!data || !data.forecast || data.forecast.length === 0) {
    return (
      <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color h-96 flex items-center justify-center">
        <p className="text-text/70">{t("finance.cashFlow.no_data")}</p>
      </div>
    );
  }

  const chartData = {
    labels: data.forecast.map((item) => item.periodLabel),
    datasets: [
      {
        label: t("finance.cashFlow.forecasted_income"),
        data: data.forecast.map((item) => item.forecastedIncome || 0),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderDash: [5, 5],
        fill: true,
        tension: 0.4,
      },
      {
        label: t("finance.cashFlow.forecasted_expense"),
        data: data.forecast.map((item) => item.forecastedExpense || 0),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderDash: [5, 5],
        fill: true,
        tension: 0.4,
      },
      {
        label: t("finance.cashFlow.forecasted_net"),
        data: data.forecast.map((item) => item.forecastedNetCashFlow || 0),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "var(--text-color)",
        },
      },
      title: {
        display: true,
        text: t("finance.cashFlow.forecast"),
        color: "var(--text-color)",
        font: {
          size: 18,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "var(--text-color)",
          callback: function (value) {
            return "₪" + value.toLocaleString();
          },
        },
        grid: {
          color: "var(--border-color)",
        },
      },
      x: {
        ticks: {
          color: "var(--text-color)",
        },
        grid: {
          color: "var(--border-color)",
        },
      },
    },
  };

  return (
    <div className="bg-bg rounded-xl p-6 shadow-lg border border-border-color">
      <div className="h-96">
        <LineChart data={chartData} options={options} />
      </div>
    </div>
  );
};

// Main Component
const CashFlow = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(
    format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [activeTab, setActiveTab] = useState("analysis");

  // Fetch Cash Flow Analysis
  const { data: cashFlowResponse, isLoading: cashFlowLoading, error: cashFlowError } = useQuery({
    queryKey: ["cashFlowAnalysis", period, startDate, endDate],
    queryFn: async () => {
      const response = await axiosInstance.get("/finance/cash-flow/analysis", {
        params: { period, startDate, endDate },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch cash flow data");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error fetching cash flow:", error);
      toast.error(t("finance.cashFlow.error_fetching") || "Error fetching cash flow data");
    },
  });

  const cashFlowData = cashFlowResponse?.data || [];
  const cashFlowMetadata = cashFlowResponse?.metadata || {};

  // Fetch Cumulative Cash Flow
  const { data: cumulativeData, isLoading: cumulativeLoading, error: cumulativeError } = useQuery({
    queryKey: ["cumulativeCashFlow", period, startDate, endDate],
    queryFn: async () => {
      const response = await axiosInstance.get("/finance/cash-flow/cumulative", {
        params: { period, startDate, endDate },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch cumulative cash flow");
      }
      return response.data.data || [];
    },
    onError: (error) => {
      console.error("Error fetching cumulative cash flow:", error);
    },
  });

  // Fetch by Category
  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ["cashFlowByCategory", startDate, endDate],
    queryFn: async () => {
      const response = await axiosInstance.get("/finance/cash-flow/by-category", {
        params: { startDate, endDate },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch category data");
      }
      return response.data.data || [];
    },
    onError: (error) => {
      console.error("Error fetching category data:", error);
    },
  });

  // Fetch by Bank Account
  const { data: bankAccountData, isLoading: bankAccountLoading, error: bankAccountError } = useQuery({
    queryKey: ["cashFlowByBankAccount", startDate, endDate],
    queryFn: async () => {
      const response = await axiosInstance.get("/finance/cash-flow/by-bank-account", {
        params: { startDate, endDate },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch bank account data");
      }
      return response.data.data || [];
    },
    onError: (error) => {
      console.error("Error fetching bank account data:", error);
    },
  });

  // Fetch Forecast
  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useQuery({
    queryKey: ["cashFlowForecast"],
    queryFn: async () => {
      const response = await axiosInstance.get("/finance/cash-flow/forecast", {
        params: { months: 6 },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch forecast data");
      }
      return response.data.data || {};
    },
    onError: (error) => {
      console.error("Error fetching forecast data:", error);
    },
  });

  // Check for negative cash flow alerts
  const alerts = useMemo(() => {
    const alertsList = [];
    if (cashFlowData) {
      const negativePeriods = cashFlowData.filter(
        (item) => item.netCashFlow < 0
      );
      if (negativePeriods.length > 0) {
        alertsList.push({
          type: "negative",
          message: t("finance.cashFlow.negative_cash_flow_alert", {
            count: negativePeriods.length,
          }),
        });
      }
    }
    return alertsList;
  }, [cashFlowData, t]);

  return (
    <div className="min-h-screen bg-bg p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            {t("finance.cashFlow.title")}
          </h1>
          <p className="text-text/70">{t("finance.cashFlow.description")}</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="rounded-xl p-4 flex items-center gap-3 border"
                style={{
                  backgroundColor: "rgba(249, 115, 22, 0.1)",
                  borderColor: "rgba(249, 115, 22, 0.5)",
                }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: "rgba(249, 115, 22, 1)" }} />
                <p style={{ color: "var(--text-color)" }}>
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Error Messages */}
        {(cashFlowError || cumulativeError || categoryError || bankAccountError || forecastError) && (
          <div
            className="mb-6 rounded-xl p-4 flex items-center gap-3 border"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.5)",
            }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: "rgba(239, 68, 68, 1)" }} />
            <p style={{ color: "var(--text-color)" }}>
              {t("finance.cashFlow.error_loading_data") || "Error loading data. Please check your finance records."}
            </p>
          </div>
        )}

        {/* No Data Message */}
        {!cashFlowLoading && !cashFlowError && (!cashFlowData || cashFlowData.length === 0) && (
          <div
            className="mb-6 rounded-xl p-6 text-center border"
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderColor: "rgba(59, 130, 246, 0.5)",
            }}
          >
            <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(59, 130, 246, 1)" }} />
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              {t("finance.cashFlow.no_data_title") || "No Cash Flow Data Available"}
            </p>
            <p className="mb-4" style={{ color: "var(--text-color)" }}>
              {t("finance.cashFlow.no_data_message") || "There are no completed financial transactions in the selected period. Make sure you have finance records with 'Completed' status."}
            </p>
            {cashFlowMetadata.totalRecords !== undefined && (
              <div className="mt-4 text-sm" style={{ color: "var(--text-color)" }}>
                <p>
                  {t("finance.cashFlow.total_records") || "Total Finance Records"}: {cashFlowMetadata.totalRecords || 0}
                </p>
                <p>
                  {t("finance.cashFlow.completed_records") || "Completed Records"}: {cashFlowMetadata.completedRecords || 0}
                </p>
                {cashFlowMetadata.totalRecords > 0 && cashFlowMetadata.completedRecords === 0 && (
                  <p className="mt-2 font-semibold" style={{ color: "rgba(249, 115, 22, 1)" }}>
                    {t("finance.cashFlow.no_completed_records") || "⚠️ You have finance records, but none are marked as 'Completed'. Please update your finance records status."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statistics Cards */}
        <StatisticsCards data={cashFlowData} loading={cashFlowLoading} />

        {/* Filters */}
        <div className="bg-bg rounded-xl shadow-lg border border-border-color p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("finance.cashFlow.period")}
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="daily">{t("finance.cashFlow.daily")}</option>
                <option value="weekly">{t("finance.cashFlow.weekly")}</option>
                <option value="monthly">{t("finance.cashFlow.monthly")}</option>
                <option value="quarterly">{t("finance.cashFlow.quarterly")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("finance.cashFlow.start_date")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("finance.cashFlow.end_date")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate(format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd"));
                  setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
                }}
                className="w-full px-4 py-2 bg-button-bg text-button-text rounded-lg hover:bg-primary transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t("finance.cashFlow.reset")}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-bg rounded-xl shadow-lg border border-border-color p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "analysis"
                  ? "bg-button-bg text-button-text shadow-lg"
                  : "bg-accent text-text hover:bg-secondary"
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-2" />
              {t("finance.cashFlow.analysis")}
            </button>
            <button
              onClick={() => setActiveTab("cumulative")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "cumulative"
                  ? "bg-button-bg text-button-text shadow-lg"
                  : "bg-accent text-text hover:bg-secondary"
              }`}
            >
              <Activity className="inline w-4 h-4 mr-2" />
              {t("finance.cashFlow.cumulative")}
            </button>
            <button
              onClick={() => setActiveTab("category")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "category"
                  ? "bg-button-bg text-button-text shadow-lg"
                  : "bg-accent text-text hover:bg-secondary"
              }`}
            >
              <PieChartIcon className="inline w-4 h-4 mr-2" />
              {t("finance.cashFlow.by_category")}
            </button>
            <button
              onClick={() => setActiveTab("forecast")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "forecast"
                  ? "bg-button-bg text-button-text shadow-lg"
                  : "bg-accent text-text hover:bg-secondary"
              }`}
            >
              <TrendingUp className="inline w-4 h-4 mr-2" />
              {t("finance.cashFlow.forecast")}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "analysis" && (
          <CashFlowLineChart data={cashFlowData} loading={cashFlowLoading} />
        )}

        {activeTab === "cumulative" && (
          <CumulativeCashFlowChart
            data={cumulativeData}
            loading={cumulativeLoading}
          />
        )}

        {activeTab === "category" && (
          <CategoryBreakdownChart data={categoryData} loading={categoryLoading} />
        )}

        {activeTab === "forecast" && (
          <ForecastChart data={forecastData} loading={forecastLoading} />
        )}

        {/* Bank Accounts Table */}
        {activeTab === "analysis" && (
          <div className="mt-6 bg-bg rounded-xl shadow-lg border border-border-color overflow-hidden">
            <div className="p-6 border-b border-border-color">
              <h2 className="text-xl font-bold text-text">
                {t("finance.cashFlow.by_bank_account")}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text">
                      {t("finance.cashFlow.bank_account")}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text">
                      {t("finance.cashFlow.income")}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text">
                      {t("finance.cashFlow.expense")}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text">
                      {t("finance.cashFlow.net_cash_flow")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {bankAccountLoading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-text/70">
                        {t("finance.cashFlow.loading")}
                      </td>
                    </tr>
                  ) : !bankAccountData || bankAccountData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-text/70">
                        {t("finance.cashFlow.no_data")}
                      </td>
                    </tr>
                  ) : (
                    bankAccountData.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-accent/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-text font-medium">
                          {item.bankAccount}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-semibold">
                          ₪{item.income.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-red-600 font-semibold">
                          ₪{item.expense.toLocaleString()}
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${
                            item.netCashFlow >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ₪{item.netCashFlow.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlow;

