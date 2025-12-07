import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  TrendingDown,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CustomerRetention = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: retentionData = [], isLoading, isError } = useQuery({
    queryKey: ["customerRetention", filterRisk],
    queryFn: async () => {
      const params = filterRisk !== "All" ? { riskLevel: filterRisk } : {};
      const res = await axiosInstance.get("/customers/retention/all", { params });
      return res.data.data || [];
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["retentionAnalytics"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers/retention/analytics");
      return res.data.data;
    },
  });

  const calculateMutation = useMutation({
    mutationFn: () => axiosInstance.post("/customers/retention/calculate"),
    onSuccess: () => {
      queryClient.invalidateQueries(["customerRetention"]);
      queryClient.invalidateQueries(["retentionAnalytics"]);
      toast.success(t("crm.retention_calculated") || "Retention risk calculated");
    },
    onError: () => {
      toast.error(t("crm.error_calculating_retention") || "Error calculating retention");
    },
  });

  const filteredData = retentionData.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.customerId?.name?.toLowerCase().includes(searchLower) ||
      item.customerId?.email?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("crm.error_loading_retention") || "Error loading retention data"}
          </p>
        </div>
      </div>
    );
  }

  const riskChartData = analytics?.riskDistribution
    ? {
        labels: Object.keys(analytics.riskDistribution),
        datasets: [
          {
            label: t("crm.customers") || "Customers",
            data: Object.values(analytics.riskDistribution),
            backgroundColor: [
              "rgba(34, 197, 94, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(139, 92, 246, 0.7)",
            ],
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("crm.customer_retention") || "Customer Retention"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("crm.retention_description") || "Identify at-risk customers and take retention actions"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
            >
              <RefreshCw size={20} className={calculateMutation.isLoading ? "animate-spin" : ""} />
              {t("crm.calculate_risk") || "Calculate Risk"}
            </button>
            <button
              onClick={() => setShowActionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Plus size={20} />
              {t("crm.add_action") || "Add Action"}
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("crm.at_risk_customers") || "At Risk Customers"}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {analytics.atRiskCustomers || 0}
                  </p>
                </div>
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("crm.avg_risk_score") || "Avg Risk Score"}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                    {analytics.averageRiskScore || "0.00"}
                  </p>
                </div>
                <TrendingDown size={32} style={{ color: 'var(--color-primary)' }} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("crm.total_customers") || "Total Customers"}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                    {analytics.totalCustomers || 0}
                  </p>
                </div>
                <Users size={32} style={{ color: 'var(--color-primary)' }} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("crm.retained") || "Retained"}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    {analytics.statusDistribution?.Retained || 0}
                  </p>
                </div>
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Risk Distribution Chart */}
        {riskChartData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              {t("crm.risk_distribution") || "Risk Distribution"}
            </h3>
            <Pie data={riskChartData} />
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("crm.search_customers") || "Search customers..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="All">{t("crm.all_risks") || "All Risks"}</option>
              <option value="Low">{t("crm.low_risk") || "Low Risk"}</option>
              <option value="Medium">{t("crm.medium_risk") || "Medium Risk"}</option>
              <option value="High">{t("crm.high_risk") || "High Risk"}</option>
              <option value="Critical">{t("crm.critical_risk") || "Critical Risk"}</option>
            </select>
          </div>
        </div>

        {/* Retention Data List */}
        <div className="space-y-4">
          {filteredData.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    {item.customerId?.name || t("crm.unknown_customer") || "Unknown Customer"}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {item.customerId?.email || ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t("crm.risk_score") || "Risk Score"}
                    </p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                      {item.riskScore || 0}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.riskLevel === "Critical"
                        ? "bg-purple-100 text-purple-800"
                        : item.riskLevel === "High"
                        ? "bg-red-100 text-red-800"
                        : item.riskLevel === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {item.riskLevel}
                  </span>
                </div>
              </div>

              {/* Risk Factors */}
              {item.riskFactors && item.riskFactors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("crm.risk_factors") || "Risk Factors"}
                  </p>
                  <div className="space-y-1">
                    {item.riskFactors.slice(0, 3).map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={14} className="text-red-500" />
                        <span style={{ color: 'var(--text-secondary)' }}>{factor.description}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            factor.severity === "High"
                              ? "bg-red-100 text-red-800"
                              : factor.severity === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {factor.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Order Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {item.daysSinceLastOrder !== undefined
                      ? `${t("crm.days_since_last_order") || "Days since last order"}: ${item.daysSinceLastOrder}`
                      : t("crm.no_orders") || "No orders"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(item);
                    setShowActionModal(true);
                  }}
                  className="px-3 py-1 rounded-lg text-sm hover:opacity-90 transition"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  {t("crm.take_action") || "Take Action"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {t("crm.no_retention_data") || "No retention data found. Calculate risk to get started!"}
            </p>
          </div>
        )}

        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("crm.add_retention_action") || "Add Retention Action"}
              </h2>
              {/* Form would go here */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                >
                  {t("crm.cancel") || "Cancel"}
                </button>
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedCustomer(null);
                    toast.success(t("crm.action_added") || "Action added");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {t("crm.save") || "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CustomerRetention;

