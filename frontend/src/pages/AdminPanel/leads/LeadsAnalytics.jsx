import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
  Target,
  DollarSign,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  Calendar,
  Filter,
} from "lucide-react";

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

const LeadsAnalytics = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch conversion funnel
  const {
    data: funnelData = [],
    isLoading: funnelLoading,
  } = useQuery({
    queryKey: ["conversionFunnel", startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axiosInstance.get("/leads/analytics/conversion-funnel", { params });
      return res.data.data || [];
    },
  });

  // Fetch pipeline velocity
  const {
    data: velocityData = [],
    isLoading: velocityLoading,
  } = useQuery({
    queryKey: ["pipelineVelocity", startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axiosInstance.get("/leads/analytics/pipeline-velocity", { params });
      return res.data.data || [];
    },
  });

  // Fetch revenue forecast
  const {
    data: forecastData = [],
    isLoading: forecastLoading,
  } = useQuery({
    queryKey: ["revenueForecast"],
    queryFn: async () => {
      const res = await axiosInstance.get("/leads/analytics/revenue-forecast");
      return res.data.data || [];
    },
  });

  // Fetch source performance
  const {
    data: sourceData = [],
    isLoading: sourceLoading,
  } = useQuery({
    queryKey: ["sourcePerformance"],
    queryFn: async () => {
      const res = await axiosInstance.get("/leads/analytics/source-performance");
      return res.data.data || [];
    },
  });

  // Fetch win/loss analysis
  const {
    data: winLossData,
    isLoading: winLossLoading,
  } = useQuery({
    queryKey: ["winLossAnalysis"],
    queryFn: async () => {
      const res = await axiosInstance.get("/leads/analytics/win-loss-analysis");
      return res.data.data || {};
    },
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Prepare chart data
  const funnelChartData = useMemo(() => {
    return {
      labels: funnelData.map((item) => item.stage),
      datasets: [
        {
          label: t("analytics.leads_count") || "Leads",
          data: funnelData.map((item) => item.count),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
        },
        {
          label: t("analytics.total_value") || "Total Value",
          data: funnelData.map((item) => item.totalValue),
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 2,
        },
      ],
    };
  }, [funnelData, t]);

  const sourceChartData = useMemo(() => {
    return {
      labels: sourceData.map((item) => item.source),
      datasets: [
        {
          label: t("analytics.total_leads") || "Total Leads",
          data: sourceData.map((item) => item.totalLeads),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
        },
        {
          label: t("analytics.won_leads") || "Won",
          data: sourceData.map((item) => item.wonLeads),
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 2,
        },
        {
          label: t("analytics.lost_leads") || "Lost",
          data: sourceData.map((item) => item.lostLeads),
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 2,
        },
      ],
    };
  }, [sourceData, t]);

  const forecastChartData = useMemo(() => {
    return {
      labels: forecastData.map((item) => {
        if (item._id.month && item._id.year) {
          return `${item._id.month}/${item._id.year}`;
        }
        return "";
      }),
      datasets: [
        {
          label: t("analytics.total_value") || "Total Value",
          data: forecastData.map((item) => item.totalValue),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: t("analytics.weighted_value") || "Weighted Value",
          data: forecastData.map((item) => item.weightedValue),
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
          borderDash: [5, 5],
        },
      ],
    };
  }, [forecastData, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return "₪" + value.toLocaleString();
          },
        },
      },
    },
  };

  if (funnelLoading || velocityLoading || forecastLoading || sourceLoading || winLossLoading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
          <p style={{ color: "var(--text-color)" }}>
            {t("analytics.loading") || "Loading analytics..."}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-blue-600">
                <BarChart3 size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("analytics.title") || "Leads Analytics"}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("analytics.subtitle") || "Analyze your sales pipeline performance"}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 rounded-xl border"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-color)",
                }}
                placeholder={t("analytics.start_date") || "Start Date"}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 rounded-xl border"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-color)",
                }}
                placeholder={t("analytics.end_date") || "End Date"}
              />
            </div>
          </div>
        </motion.div>

        {/* Conversion Funnel */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="bg-bg rounded-xl p-6 shadow-lg border border-border-color"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
              {t("analytics.conversion_funnel") || "Conversion Funnel"}
            </h2>
            <div className="h-96">
              <BarChart data={funnelChartData} options={chartOptions} />
            </div>
          </div>
        </motion.div>

        {/* Source Performance */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="bg-bg rounded-xl p-6 shadow-lg border border-border-color"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
              {t("analytics.source_performance") || "Source Performance"}
            </h2>
            <div className="h-96">
              <BarChart data={sourceChartData} options={chartOptions} />
            </div>
          </div>
        </motion.div>

        {/* Win/Loss Analysis */}
        {winLossData && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="bg-bg rounded-xl p-6 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
                {t("analytics.win_loss_analysis") || "Win/Loss Analysis"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                    {t("analytics.won") || "Won"}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("analytics.count") || "Count"}
                      </span>
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        {winLossData.won?.count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("analytics.total_value") || "Total Value"}
                      </span>
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        ₪{winLossData.won?.totalValue?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("analytics.avg_value") || "Avg Value"}
                      </span>
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        ₪{winLossData.won?.avgValue?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                    {t("analytics.lost") || "Lost"}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("analytics.count") || "Count"}
                      </span>
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        {winLossData.lost?.count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("analytics.total_value") || "Total Value"}
                      </span>
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        ₪{winLossData.lost?.totalValue?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("analytics.avg_value") || "Avg Value"}
                      </span>
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        ₪{winLossData.lost?.avgValue?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: "var(--bg-color)" }}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("analytics.win_rate") || "Win Rate"}
                  </span>
                  <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                    {winLossData.winRate || 0}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Revenue Forecast */}
        {forecastData.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="bg-bg rounded-xl p-6 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
                {t("analytics.revenue_forecast") || "Revenue Forecast"}
              </h2>
              <div className="h-96">
                <LineChart data={forecastChartData} options={chartOptions} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LeadsAnalytics;

