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
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Filter,
  Package,
} from "lucide-react";

const InventoryQualityList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResult, setFilterResult] = useState("all");

  const { data: qualityChecks = [], isLoading } = useQuery({
    queryKey: ["inventory-quality"],
    queryFn: async () => {
      const res = await axiosInstance.get("/inventory-advanced/quality");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/inventory-advanced/quality/${id}`);
    },
    onSuccess: () => {
      toast.success(t("inventory.quality_check_deleted") || "Quality check deleted successfully");
      queryClient.invalidateQueries(["inventory-quality"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete quality check");
    },
  });

  const filteredChecks = qualityChecks.filter((check) => {
    const matchesSearch =
      check.qualityCheckNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.productId?.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || check.checkType === filterType;
    const matchesResult = filterResult === "all" || check.overallResult === filterResult;
    return matchesSearch && matchesType && matchesResult;
  });

  const getResultColor = (result) => {
    const colors = {
      Pass: "bg-green-100 text-green-800",
      Fail: "bg-red-100 text-red-800",
      Conditional: "bg-yellow-100 text-yellow-800",
    };
    return colors[result] || "bg-gray-100 text-gray-800";
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
                {t("inventory.quality_checks") || "Quality Checks"}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {t("inventory.quality_checks_description") || "Manage and track quality control checks"}
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/inventory/quality/add")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus size={20} />
              {t("inventory.add_quality_check") || "Add Quality Check"}
            </button>
          </div>

          <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: "var(--text-secondary)" }} />
                  <input
                    type="text"
                    placeholder={t("inventory.search_quality_checks") || "Search quality checks..."}
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
                  <option value="Incoming">Incoming</option>
                  <option value="Outgoing">Outgoing</option>
                  <option value="Periodic">Periodic</option>
                  <option value="Random">Random</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Return">Return</option>
                </select>
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  <option value="all">{t("inventory.all_results") || "All Results"}</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Conditional">Conditional</option>
                </select>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--color-primary)" }}></div>
                  <p className="mt-4" style={{ color: "var(--text-secondary)" }}>Loading...</p>
                </div>
              ) : filteredChecks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                  <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
                  <p style={{ color: "var(--text-secondary)" }}>
                    {t("inventory.no_quality_checks") || "No quality checks found"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border-t" style={{ borderColor: "var(--border-color)" }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.check_number") || "Check #"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.product") || "Product"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.check_type") || "Type"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.quantity_checked") || "Quantity"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.passed") || "Passed"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.rejected") || "Rejected"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.result") || "Result"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.check_date") || "Date"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.actions") || "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChecks.map((check) => (
                        <motion.tr
                          key={check._id}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          style={{ borderColor: "var(--border-color)" }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="p-3 font-mono" style={{ color: "var(--text-color)" }}>{check.qualityCheckNumber}</td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>{check.productId?.productName || "-"}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                              {check.checkType}
                            </span>
                          </td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>{check.quantityChecked}</td>
                          <td className="p-3 text-green-600">{check.passed || 0}</td>
                          <td className="p-3 text-red-600">{check.rejected || 0}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-sm ${getResultColor(check.overallResult)}`}>
                              {check.overallResult || "-"}
                            </span>
                          </td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>
                            {check.checkDate ? new Date(check.checkDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/dashboard/inventory/quality/${check._id}`)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                style={{ color: "var(--color-primary)" }}
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  const confirmMessage = t("inventory.confirm_delete_quality") || "Are you sure you want to delete this quality check?";
                                  if (window.confirm(confirmMessage)) {
                                    deleteMutation.mutate(check._id);
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

export default InventoryQualityList;

