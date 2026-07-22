import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Filter,
  Target,
  AlertCircle,
} from "lucide-react";

const SalesOpportunitiesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["sales-opportunities"],
    queryFn: async () => {
      const res = await axiosInstance.get("/sales/opportunities");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/sales/opportunities/${id}`);
    },
    onSuccess: () => {
      toast.success(t("sales.opportunity_deleted") || "Opportunity deleted successfully");
      queryClient.invalidateQueries(["sales-opportunities"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete opportunity");
    },
  });

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.opportunityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === "all" || opp.stage === filterStage;
    const matchesStatus = filterStatus === "all" || opp.status === filterStatus;
    return matchesSearch && matchesStage && matchesStatus;
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
      Prospecting: "bg-[var(--bg-secondary)] text-[var(--text-color)]",
      Qualification: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Needs Analysis": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Proposal: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Negotiation: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Closed Won": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Closed Lost": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[stage] || colors.Prospecting;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
            >
              <TrendingUp size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("sales.opportunities") || "Sales Opportunities"}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("sales.manage_opportunities") || "Manage and track your sales opportunities"}
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => navigate("/dashboard/sales/opportunities/add")}
            className="flex items-center gap-2 px-6 h-11 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: "var(--button-bg)",
              color: "var(--button-text)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            {t("sales.add_opportunity") || "Add Opportunity"}
          </motion.button>
        </motion.div>

        {/* Filters Card */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 mb-6"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2"
                style={{ color: "var(--color-secondary)" }}
                size={20}
              />
              <input
                type="text"
                placeholder={t("sales.search_opportunities") || "Search opportunities..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 ps-12 pe-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  focusRingColor: "var(--color-primary)",
                }}
              />
            </div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("sales.all_stages") || "All Stages"}</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("sales.all_statuses") || "All Statuses"}</option>
              <option value="Open">Open</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </motion.div>

        {/* Opportunities Grid */}
          {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: "var(--color-primary)" }}></div>
            <p className="mt-4" style={{ color: "var(--text-color)" }}>
              {t("common.loading") || "Loading..."}
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <motion.div
            className="text-center py-16"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-xl mb-2" style={{ color: "var(--text-color)" }}>
              {t("sales.no_opportunities") || "No opportunities found"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
              {t("sales.create_first_opportunity") || "Create your first opportunity to get started"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp, index) => (
              <motion.div
                key={opp._id}
                className="rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                {/* Card Header */}
                <div
                  className="p-5 border-b"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      className="text-lg font-bold text-white line-clamp-2 flex-1"
                    >
                      {opp.opportunityName}
                    </h3>
                    <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => navigate(`/dashboard/sales/opportunities/${opp._id}`)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        title={t("common.edit") || "Edit"}
                          >
                        <Edit size={16} className="text-white" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t("sales.confirm_delete") || "Are you sure?")) {
                                deleteMutation.mutate(opp._id);
                              }
                            }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        title={t("common.delete") || "Delete"}
                          >
                        <Trash2 size={16} className="text-white" />
                          </button>
                        </div>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStageColor(opp.stage)}`}
                  >
                    {opp.stage}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                    <User size={16} style={{ color: "var(--color-secondary)" }} />
                    <span className="truncate">
                      {opp.customerId?.name || opp.leadId?.name || t("sales.no_customer") || "No Customer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                    <DollarSign size={16} style={{ color: "var(--color-accent)" }} />
                    <span className="font-bold">
                      {opp.amount?.toLocaleString() || 0} {opp.currency || "ILS"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("sales.probability") || "Probability"}:
                      </span>
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        {opp.probability || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: "var(--color-primary)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${opp.probability || 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {opp.expectedCloseDate && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                      <Calendar size={16} style={{ color: "var(--color-secondary)" }} />
                      <span>
                        {t("sales.close_date") || "Close Date"}:{" "}
                        {new Date(opp.expectedCloseDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {opp.assignedTo && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                      <Target size={16} style={{ color: "var(--color-secondary)" }} />
                      <span className="truncate">
                        {opp.assignedTo?.name} {opp.assignedTo?.lastName}
                      </span>
            </div>
          )}
        </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesOpportunitiesList;
