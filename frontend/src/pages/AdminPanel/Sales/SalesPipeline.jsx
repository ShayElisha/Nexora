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
      Prospecting: "bg-gray-500",
      Qualification: "bg-blue-500",
      "Needs Analysis": "bg-yellow-500",
      Proposal: "bg-orange-500",
      Negotiation: "bg-purple-500",
      "Closed Won": "bg-green-500",
      "Closed Lost": "bg-red-500",
    };
    return colors[stage] || "bg-gray-500";
  };

  const totalAmount = pipeline.reduce((sum, stage) => sum + (stage.totalAmount || 0), 0);
  const totalCount = pipeline.reduce((sum, stage) => sum + (stage.count || 0), 0);

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
          {t("sales.pipeline") || "Sales Pipeline"}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-600" size={24} />
              <span className="text-gray-600">{t("sales.total_opportunities") || "Total Opportunities"}</span>
            </div>
            <div className="text-2xl font-bold">{totalCount}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={24} />
              <span className="text-gray-600">{t("sales.total_value") || "Total Value"}</span>
            </div>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-purple-600" size={24} />
              <span className="text-gray-600">{t("sales.win_rate") || "Win Rate"}</span>
            </div>
            <div className="text-2xl font-bold">
              {totalCount > 0
                ? ((pipeline.find((s) => s._id === "Closed Won")?.count || 0) / totalCount * 100).toFixed(1)
                : 0}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-orange-600" size={24} />
              <span className="text-gray-600">{t("sales.avg_deal_size") || "Avg Deal Size"}</span>
            </div>
            <div className="text-2xl font-bold">
              {totalCount > 0 ? (totalAmount / totalCount).toLocaleString() : 0}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {stages.map((stage, index) => {
                const stageData = pipeline.find((s) => s._id === stage);
                const count = stageData?.count || 0;
                const amount = stageData?.totalAmount || 0;

                return (
                  <motion.div
                    key={stage}
                    className="min-w-[200px] flex-shrink-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`${getStageColor(stage)} text-white p-4 rounded-t-lg`}
                      onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
                    >
                      <h3 className="font-bold text-lg">{stage}</h3>
                      <div className="mt-2">
                        <div className="text-sm">{count} {t("sales.opportunities") || "opportunities"}</div>
                        <div className="text-sm font-semibold">{amount.toLocaleString()} ILS</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-b-lg border border-t-0">
                      {stageData?.opportunities?.slice(0, 3).map((opp) => (
                        <div key={opp._id} className="mb-2 p-2 bg-white dark:bg-gray-800 rounded text-sm">
                          <div className="font-semibold">{opp.opportunityName}</div>
                          <div className="text-gray-600">{opp.amount?.toLocaleString()} {opp.currency}</div>
                        </div>
                      ))}
                      {count > 3 && (
                        <div className="text-sm text-gray-500 text-center">
                          +{count - 3} {t("sales.more") || "more"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPipeline;

