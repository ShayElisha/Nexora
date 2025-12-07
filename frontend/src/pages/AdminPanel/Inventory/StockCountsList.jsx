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
  Package,
  Calendar,
  CheckCircle,
  AlertCircle,
  Filter,
} from "lucide-react";

const StockCountsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data: stockCounts = [], isLoading } = useQuery({
    queryKey: ["stock-counts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/inventory-advanced/stock-counts");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/inventory-advanced/stock-counts/${id}`);
    },
    onSuccess: () => {
      toast.success(t("inventory.stock_count_deleted") || "Stock count deleted successfully");
      queryClient.invalidateQueries(["stock-counts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete stock count");
    },
  });

  const filteredCounts = stockCounts.filter((count) => {
    const matchesSearch = count.countNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || count.status === filterStatus;
    const matchesType = filterType === "all" || count.countType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: "bg-gray-100 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Reviewed: "bg-purple-100 text-purple-800",
      Adjusted: "bg-yellow-100 text-yellow-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("inventory.stock_counts") || "Stock Counts"}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {t("inventory.stock_counts_description") || "Manage and track inventory stock counts"}
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/inventory/stock-counts/add")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus size={20} />
              {t("inventory.add_stock_count") || "Add Stock Count"}
            </button>
          </div>

          <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: "var(--text-secondary)" }} />
                  <input
                    type="text"
                    placeholder={t("inventory.search_stock_counts") || "Search stock counts..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  <option value="all">{t("inventory.all_types") || "All Types"}</option>
                  <option value="Full">Full</option>
                  <option value="Partial">Partial</option>
                  <option value="Cycle">Cycle</option>
                  <option value="Spot">Spot</option>
                  <option value="Random">Random</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  <option value="all">{t("inventory.all_statuses") || "All Statuses"}</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Adjusted">Adjusted</option>
                </select>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--color-primary)" }}></div>
                  <p className="mt-4" style={{ color: "var(--text-secondary)" }}>Loading...</p>
                </div>
              ) : filteredCounts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                  <Package size={64} className="mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
                  <p style={{ color: "var(--text-secondary)" }}>
                    {t("inventory.no_stock_counts") || "No stock counts found"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border-t" style={{ borderColor: "var(--border-color)" }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.count_number") || "Count #"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.warehouse") || "Warehouse"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.count_type") || "Type"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.count_date") || "Count Date"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.items_counted") || "Items"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.variance") || "Variance"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.status") || "Status"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.actions") || "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCounts.map((count) => (
                        <motion.tr
                          key={count._id}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          style={{ borderColor: "var(--border-color)" }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="p-3 font-mono" style={{ color: "var(--text-color)" }}>{count.countNumber}</td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>{count.warehouseId?.name || "-"}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                              {count.countType}
                            </span>
                          </td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>
                            {count.countDate
                              ? new Date(count.countDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>
                            {count.statistics?.itemsCounted || 0} / {count.statistics?.totalItems || 0}
                          </td>
                          <td className="p-3">
                            <span
                              className={
                                count.statistics?.totalVarianceValue >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {count.statistics?.totalVarianceValue?.toLocaleString() || 0}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-sm ${getStatusColor(count.status)}`}>
                              {count.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/dashboard/inventory/stock-counts/${count._id}`)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                style={{ color: "var(--color-primary)" }}
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  const confirmMessage = t("inventory.confirm_delete_stock") || "Are you sure you want to delete this stock count?";
                                  if (window.confirm(confirmMessage)) {
                                    deleteMutation.mutate(count._id);
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              >
                                <Trash2 size={18} className="text-red-500" />
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
        </motion.div>
      </div>
    </div>
  );
};

export default StockCountsList;

