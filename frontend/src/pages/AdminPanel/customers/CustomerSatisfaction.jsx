import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Star,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  MessageSquare,
  Loader2,
  AlertCircle,
  Smile,
  Frown,
  Meh,
} from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const CustomerSatisfaction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: surveys = [], isLoading, isError } = useQuery({
    queryKey: ["customerSatisfaction", filterType],
    queryFn: async () => {
      const params = filterType !== "All" ? { surveyType: filterType } : {};
      const res = await axiosInstance.get("/customers/satisfaction/all", { params });
      return res.data.data || [];
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["satisfactionAnalytics"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers/satisfaction/analytics");
      return res.data.data;
    },
  });

  const filteredSurveys = surveys.filter((survey) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      survey.customerId?.name?.toLowerCase().includes(searchLower) ||
      survey.customerId?.email?.toLowerCase().includes(searchLower)
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
            {t("crm.error_loading_satisfaction") || "Error loading satisfaction data"}
          </p>
        </div>
      </div>
    );
  }

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
              {t("crm.customer_satisfaction") || "Customer Satisfaction"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("crm.satisfaction_description") || "Track customer satisfaction and NPS scores"}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("crm.create_survey") || "Create Survey"}
          </button>
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
                    {t("crm.avg_satisfaction") || "Avg Satisfaction"}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                    {analytics.averageSatisfaction || "0.00"}
                  </p>
                </div>
                <Star size={32} style={{ color: 'var(--color-primary)' }} />
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
                    {t("crm.nps_score") || "NPS Score"}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                    {analytics.nps || "0.00"}
                  </p>
                </div>
                <TrendingUp size={32} style={{ color: 'var(--color-primary)' }} />
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
                    {t("crm.total_surveys") || "Total Surveys"}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                    {analytics.totalSurveys || 0}
                  </p>
                </div>
                <MessageSquare size={32} style={{ color: 'var(--color-primary)' }} />
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
                    {t("crm.response_rate") || "Response Rate"}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                    {analytics.responseRate?.toFixed(1) || "0.0"}%
                  </p>
                </div>
                <Users size={32} style={{ color: 'var(--color-primary)' }} />
              </div>
            </motion.div>
          </div>
        )}

        {/* NPS Category Distribution */}
        {analytics?.categoryDistribution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              {t("crm.nps_distribution") || "NPS Distribution"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <Smile size={32} className="mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">
                  {analytics.categoryDistribution.Promoter || 0}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t("crm.promoters") || "Promoters"}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Meh size={32} className="mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">
                  {analytics.categoryDistribution.Passive || 0}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t("crm.passives") || "Passives"}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <Frown size={32} className="mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">
                  {analytics.categoryDistribution.Detractor || 0}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t("crm.detractors") || "Detractors"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("crm.search_surveys") || "Search surveys..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="All">{t("crm.all_types") || "All Types"}</option>
              <option value="Satisfaction">{t("crm.satisfaction") || "Satisfaction"}</option>
              <option value="NPS">{t("crm.nps") || "NPS"}</option>
              <option value="CSAT">{t("crm.csat") || "CSAT"}</option>
            </select>
          </div>
        </div>

        {/* Surveys List */}
        <div className="space-y-4">
          {filteredSurveys.map((survey) => (
            <motion.div
              key={survey._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    {survey.customerId?.name || t("crm.unknown_customer") || "Unknown Customer"}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {survey.customerId?.email || ""}
                  </p>
                </div>
                <div className="text-right">
                  {survey.satisfactionScore && (
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.round(survey.satisfactionScore / 2) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                      ))}
                      <span className="ml-2 font-semibold" style={{ color: 'var(--text-color)' }}>
                        {survey.satisfactionScore}/10
                      </span>
                    </div>
                  )}
                  {survey.npsScore !== undefined && survey.npsScore !== null && (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      NPS: {survey.npsScore}
                    </p>
                  )}
                </div>
              </div>
              {survey.feedback && (
                <p className="text-sm mb-2" style={{ color: 'var(--text-color)' }}>
                  {survey.feedback}
                </p>
              )}
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {new Date(survey.responseDate).toLocaleDateString()} - {survey.surveyType}
              </p>
            </motion.div>
          ))}
        </div>

        {filteredSurveys.length === 0 && (
          <div className="text-center py-12">
            <Star size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {t("crm.no_surveys") || "No surveys found. Create your first survey!"}
            </p>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("crm.create_survey") || "Create Survey"}
              </h2>
              {/* Form would go here */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                >
                  {t("crm.cancel") || "Cancel"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    toast.success(t("crm.survey_created") || "Survey created");
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

export default CustomerSatisfaction;

