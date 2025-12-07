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
  Gavel,
  Calendar,
  DollarSign,
  Users,
  Filter,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";

const TendersList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: tenders = [], isLoading, isError } = useQuery({
    queryKey: ["tenders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/procurement-advanced/tenders");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/procurement-advanced/tenders/${id}`);
    },
    onSuccess: () => {
      toast.success(t("procurement.tender_deleted") || "Tender deleted successfully");
      queryClient.invalidateQueries(["tenders"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete tender");
    },
  });

  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch =
      tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.tenderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || tender.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-100 text-gray-800",
      Published: "bg-blue-100 text-blue-800",
      Open: "bg-green-100 text-green-800",
      Closed: "bg-red-100 text-red-800",
      "Under Evaluation": "bg-yellow-100 text-yellow-800",
      Awarded: "bg-purple-100 text-purple-800",
      Cancelled: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("procurement.loading") || "Loading..."}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("procurement.error_loading_tenders") || "Error loading tenders"}
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.tenders") || "Tenders"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("procurement.tenders_description") || "Manage and track tenders"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/procurement/tenders/add")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("procurement.add_tender") || "Add Tender"}
          </button>
        </div>

        <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("procurement.search_tenders") || "Search tenders..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_statuses") || "All Statuses"}</option>
              <option value="Draft">{t("procurement.draft") || "Draft"}</option>
              <option value="Published">{t("procurement.published") || "Published"}</option>
              <option value="Open">{t("procurement.open") || "Open"}</option>
              <option value="Closed">{t("procurement.closed") || "Closed"}</option>
              <option value="Under Evaluation">{t("procurement.under_evaluation") || "Under Evaluation"}</option>
              <option value="Awarded">{t("procurement.awarded") || "Awarded"}</option>
            </select>
          </div>

          </div>
          {filteredTenders.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <Gavel size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t("procurement.no_tenders") || "No tenders found"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.tender_number") || "Tender #"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.title") || "Title"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.publish_date") || "Publish Date"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.deadline") || "Deadline"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.budget") || "Budget"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.bids") || "Bids"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.status") || "Status"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenders.map((tender) => (
                    <motion.tr
                      key={tender._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3 font-mono" style={{ color: 'var(--text-color)' }}>
                        {tender.tenderNumber}
                      </td>
                      <td className="p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                        {tender.title}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {tender.publishDate
                          ? new Date(tender.publishDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {tender.submissionDeadline
                          ? new Date(tender.submissionDeadline).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {tender.estimatedBudget?.toLocaleString()} {tender.currency || "USD"}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {tender.bids?.length || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(tender.status)}`}>
                          {tender.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/procurement/tenders/${tender._id}`)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              const confirmMessage = t("procurement.confirm_delete") || "Are you sure you want to delete this tender?";
                              if (window.confirm(confirmMessage)) {
                                deleteMutation.mutate(tender._id);
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
      </motion.div>
    </div>
  );
};

export default TendersList;

