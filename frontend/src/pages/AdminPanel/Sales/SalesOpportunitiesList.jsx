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
      Prospecting: "bg-gray-100 text-gray-800",
      Qualification: "bg-blue-100 text-blue-800",
      "Needs Analysis": "bg-yellow-100 text-yellow-800",
      Proposal: "bg-orange-100 text-orange-800",
      Negotiation: "bg-purple-100 text-purple-800",
      "Closed Won": "bg-green-100 text-green-800",
      "Closed Lost": "bg-red-100 text-red-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
            {t("sales.opportunities") || "Sales Opportunities"}
          </h1>
          <button
            onClick={() => navigate("/dashboard/sales/opportunities/add")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            {t("sales.add_opportunity") || "Add Opportunity"}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t("sales.search_opportunities") || "Search opportunities..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-4 py-2 border rounded-lg"
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
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">{t("sales.all_statuses") || "All Statuses"}</option>
              <option value="Open">Open</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">{t("sales.opportunity_name") || "Opportunity"}</th>
                    <th className="text-left p-3">{t("sales.customer") || "Customer"}</th>
                    <th className="text-left p-3">{t("sales.stage") || "Stage"}</th>
                    <th className="text-left p-3">{t("sales.amount") || "Amount"}</th>
                    <th className="text-left p-3">{t("sales.probability") || "Probability"}</th>
                    <th className="text-left p-3">{t("sales.close_date") || "Close Date"}</th>
                    <th className="text-left p-3">{t("sales.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => (
                    <motion.tr
                      key={opp._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3">
                        <div className="font-semibold">{opp.opportunityName}</div>
                        {opp.assignedTo && (
                          <div className="text-sm text-gray-500">
                            <User size={14} className="inline mr-1" />
                            {opp.assignedTo?.name} {opp.assignedTo?.lastName}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{opp.customerId?.name || opp.leadId?.name || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStageColor(opp.stage)}`}>
                          {opp.stage}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold">
                          {opp.amount?.toLocaleString()} {opp.currency}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${opp.probability || 0}%` }}
                            />
                          </div>
                          <span className="text-sm">{opp.probability || 0}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {opp.expectedCloseDate
                          ? new Date(opp.expectedCloseDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/sales/opportunities/${opp._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t("sales.confirm_delete") || "Are you sure?")) {
                                deleteMutation.mutate(opp._id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesOpportunitiesList;

