import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Filter,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const JobPostingsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: jobPostings = [], isLoading } = useQuery({
    queryKey: ["job-postings", statusFilter],
    queryFn: async () => {
      const res = await axiosInstance.get("/ats/job-postings", {
        params: { status: statusFilter !== "all" ? statusFilter : undefined },
      });
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/ats/job-postings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["job-postings"]);
      toast.success(t("hr.ats.job_posting_deleted") || "Job posting deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete job posting");
    },
  });

  const filteredPostings = jobPostings.filter((posting) =>
    posting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    posting.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      published: "bg-green-100 text-green-800",
      closed: "bg-red-100 text-red-800",
      archived: "bg-gray-100 text-gray-600",
    };
    return colors[status] || colors.draft;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: "var(--bg-color)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
              {t("hr.ats.job_postings") || "Job Postings"}
            </h1>
            <p className="mt-1" style={{ color: "var(--color-secondary)" }}>
              {t("hr.ats.manage_job_postings") || "Manage and track job postings"}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard/hr/ats/job-postings/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg"
            style={{
              background: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
              color: "var(--button-text)",
            }}
          >
            <Plus className="w-5 h-5" />
            {t("hr.ats.create_job_posting") || "Create Job Posting"}
          </motion.button>
        </div>

        <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", border: "1px solid" }}>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "var(--color-secondary)" }} />
            <input
              type="text"
              placeholder={t("hr.ats.search_job_postings") || "Search job postings..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
          >
            <option value="all">{t("hr.ats.all_statuses") || "All Statuses"}</option>
            <option value="draft">{t("hr.ats.draft") || "Draft"}</option>
            <option value="published">{t("hr.ats.published") || "Published"}</option>
            <option value="closed">{t("hr.ats.closed") || "Closed"}</option>
            <option value="archived">{t("hr.ats.archived") || "Archived"}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPostings.map((posting) => (
            <motion.div
              key={posting._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 hover:shadow-md transition-shadow"
              style={{
                borderColor: "var(--border-color)",
                border: "1px solid",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>{posting.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(posting.status)}`}>
                  {posting.status}
                </span>
              </div>

              {posting.department && (
                <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "var(--color-secondary)" }}>
                  <Briefcase className="w-4 h-4" />
                  {posting.department.name}
                </div>
              )}

              {posting.location && (
                <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "var(--color-secondary)" }}>
                  <MapPin className="w-4 h-4" />
                  {posting.location}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm mb-4" style={{ color: "var(--color-secondary)" }}>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {posting.applicationsCount || 0} {t("hr.ats.applications") || "applications"}
                </div>
                {posting.closingDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(posting.closingDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-color)" }}>
                {posting.description}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/dashboard/hr/ats/job-postings/${posting._id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: "var(--footer-bg)",
                    color: "var(--color-primary)",
                  }}
                >
                  <Eye className="w-4 h-4" />
                  {t("common.view") || "View"}
                </button>
                <button
                  onClick={() => navigate(`/dashboard/hr/ats/job-postings/${posting._id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: "var(--footer-bg)",
                    color: "var(--text-color)",
                  }}
                >
                  <Edit className="w-4 h-4" />
                  {t("common.edit") || "Edit"}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(posting._id)}
                  className="px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: "var(--footer-bg)",
                    color: "#ef4444",
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPostings.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
              {t("hr.ats.no_job_postings") || "No job postings found"}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default JobPostingsList;

