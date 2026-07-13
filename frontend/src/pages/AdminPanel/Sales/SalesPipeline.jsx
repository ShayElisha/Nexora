import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Calendar,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const SalesPipeline = () => {
  const { t } = useTranslation();
  const [selectedStage, setSelectedStage] = useState(null);

  const { data: pipeline = [], isLoading } = useQuery({
    queryKey: ["sales-pipeline"],
    queryFn: async () => {
      const res = await axiosInstance.get("/sales/pipeline");
      return res.data.data || [];
    },
  });

  const stages = [
    "Prospecting",
    "Qualification",
    "Needs Analysis",
    "Proposal",
    "Negotiation",
    "Closed Won",
    "Closed Lost",
  ];

  const getStageColor = (stage) => {
    const colors = {
      Prospecting: {
        bg: "bg-gray-500",
        card: "bg-gray-50 dark:bg-gray-800",
        text: "text-gray-700 dark:text-gray-300",
      },
      Qualification: {
        bg: "bg-blue-500",
        card: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
      },
      "Needs Analysis": {
        bg: "bg-yellow-500",
        card: "bg-yellow-50 dark:bg-yellow-900/20",
        text: "text-yellow-700 dark:text-yellow-300",
      },
      Proposal: {
        bg: "bg-orange-500",
        card: "bg-orange-50 dark:bg-orange-900/20",
        text: "text-orange-700 dark:text-orange-300",
      },
      Negotiation: {
        bg: "bg-purple-500",
        card: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-700 dark:text-purple-300",
      },
      "Closed Won": {
        bg: "bg-green-500",
        card: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
      },
      "Closed Lost": {
        bg: "bg-red-500",
        card: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
      },
    };
    return colors[stage] || colors.Prospecting;
  };

  const totalAmount = pipeline.reduce((sum, stage) => sum + (stage.totalAmount || 0), 0);
  const totalCount = pipeline.reduce((sum, stage) => sum + (stage.count || 0), 0);
  const wonCount = pipeline.find((s) => s._id === "Closed Won")?.count || 0;
  const winRate = totalCount > 0 ? ((wonCount / totalCount) * 100).toFixed(1) : 0;
  const avgDealSize = totalCount > 0 ? (totalAmount / totalCount).toFixed(0) : 0;

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("sales.pipeline") || "Sales Pipeline"}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
            {t("sales.pipeline_description") || "Visualize and track your sales pipeline performance"}
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="rounded-2xl shadow-lg border p-6"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Target className="text-white" size={24} />
              </div>
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>
              {t("sales.total_opportunities") || "Total Opportunities"}
            </p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
              {totalCount}
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg border p-6"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                <DollarSign className="text-white" size={24} />
              </div>
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>
              {t("sales.total_value") || "Total Value"}
            </p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
              {totalAmount.toLocaleString()} ILS
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg border p-6"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                }}
              >
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>
              {t("sales.win_rate") || "Win Rate"}
            </p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
              {winRate}%
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg border p-6"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-secondary)" }}
              >
                <Calendar className="text-white" size={24} />
              </div>
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>
              {t("sales.avg_deal_size") || "Avg Deal Size"}
            </p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
              {avgDealSize.toLocaleString()} ILS
            </p>
          </motion.div>
        </div>

        {/* Pipeline Stages */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: "var(--color-primary)" }}></div>
            <p className="mt-4" style={{ color: "var(--text-color)" }}>
              {t("common.loading") || "Loading..."}
            </p>
          </div>
        ) : pipeline.length === 0 ? (
          <motion.div
            className="text-center py-16 rounded-2xl border"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-xl mb-2" style={{ color: "var(--text-color)" }}>
              {t("sales.no_pipeline_data") || "No pipeline data available"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
              {t("sales.create_opportunities_to_see_pipeline") || "Create opportunities to see them in the pipeline"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl shadow-lg border p-6"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {stages.map((stage, index) => {
                const stageData = pipeline.find((s) => s._id === stage);
                const count = stageData?.count || 0;
                const amount = stageData?.totalAmount || 0;
                const opportunities = stageData?.opportunities || [];
                const stageColors = getStageColor(stage);
                const isSelected = selectedStage === stage;

                return (
                  <motion.div
                    key={stage}
                    className="min-w-[280px] flex-shrink-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`${stageColors.bg} text-white p-4 rounded-t-xl cursor-pointer transition-all`}
                      onClick={() => setSelectedStage(isSelected ? null : stage)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{stage}</h3>
                        {isSelected && <ArrowRight size={18} className="transform rotate-90" />}
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm opacity-90">
                          {count} {t("sales.opportunities") || "opportunities"}
                        </div>
                        <div className="text-lg font-semibold">{amount.toLocaleString()} ILS</div>
                      </div>
                    </div>
                    <div
                      className={`${stageColors.card} p-4 rounded-b-xl border border-t-0 space-y-2 max-h-96 overflow-y-auto`}
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      {opportunities.length === 0 ? (
                        <p className="text-center text-sm py-4" style={{ color: "var(--color-secondary)" }}>
                          {t("sales.no_opportunities_in_stage") || "No opportunities in this stage"}
                        </p>
                      ) : (
                        <>
                          {opportunities.slice(0, isSelected ? opportunities.length : 3).map((opp) => (
                            <motion.div
                              key={opp._id}
                              className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all"
                              style={{
                                backgroundColor: "var(--bg-color)",
                                borderColor: "var(--border-color)",
                              }}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => window.location.href = `/dashboard/sales/opportunities/${opp._id}`}
                            >
                              <div className="font-semibold text-sm mb-1" style={{ color: "var(--text-color)" }}>
                                {opp.opportunityName}
                              </div>
                              <div className="text-xs" style={{ color: "var(--color-secondary)" }}>
                                {opp.amount?.toLocaleString() || 0} {opp.currency || "ILS"}
                              </div>
                              {opp.probability && (
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="h-1.5 rounded-full"
                                      style={{
                                        width: `${opp.probability}%`,
                                        backgroundColor: "var(--color-primary)",
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>
                                    {opp.probability}% {t("sales.probability") || "probability"}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                          {opportunities.length > 3 && !isSelected && (
                            <div
                              className="text-sm text-center py-2 cursor-pointer hover:underline"
                              style={{ color: "var(--color-primary)" }}
                              onClick={() => setSelectedStage(stage)}
                            >
                              +{opportunities.length - 3} {t("sales.more") || "more"}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SalesPipeline;
