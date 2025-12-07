import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  Search,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";

const ApplicantsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["applicants", statusFilter, stageFilter],
    queryFn: async () => {
      const res = await axiosInstance.get("/ats/applicants", {
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          stage: stageFilter !== "all" ? stageFilter : undefined,
        },
      });
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/ats/applicants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["applicants"]);
      toast.success(t("hr.ats.applicant_deleted") || "Applicant deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete applicant");
    },
  });

  const filteredApplicants = applicants.filter((applicant) =>
    `${applicant.firstName} ${applicant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    applicant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      applied: "bg-blue-100 text-blue-800",
      screening: "bg-yellow-100 text-yellow-800",
      interview_scheduled: "bg-purple-100 text-purple-800",
      interviewed: "bg-indigo-100 text-indigo-800",
      offer_extended: "bg-green-100 text-green-800",
      offer_accepted: "bg-emerald-100 text-emerald-800",
      offer_declined: "bg-orange-100 text-orange-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.applied;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("hr.ats.applicants") || "Applicants"}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("hr.ats.manage_applicants") || "Manage and track job applicants"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("hr.ats.search_applicants") || "Search applicants..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t("hr.ats.all_statuses") || "All Statuses"}</option>
            <option value="applied">{t("hr.ats.applied") || "Applied"}</option>
            <option value="screening">{t("hr.ats.screening") || "Screening"}</option>
            <option value="interview_scheduled">{t("hr.ats.interview_scheduled") || "Interview Scheduled"}</option>
            <option value="interviewed">{t("hr.ats.interviewed") || "Interviewed"}</option>
            <option value="offer_extended">{t("hr.ats.offer_extended") || "Offer Extended"}</option>
            <option value="offer_accepted">{t("hr.ats.offer_accepted") || "Offer Accepted"}</option>
            <option value="rejected">{t("hr.ats.rejected") || "Rejected"}</option>
          </select>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t("hr.ats.all_stages") || "All Stages"}</option>
            <option value="application">{t("hr.ats.application") || "Application"}</option>
            <option value="phone_screen">{t("hr.ats.phone_screen") || "Phone Screen"}</option>
            <option value="technical_interview">{t("hr.ats.technical_interview") || "Technical Interview"}</option>
            <option value="final_interview">{t("hr.ats.final_interview") || "Final Interview"}</option>
            <option value="offer">{t("hr.ats.offer") || "Offer"}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("hr.ats.name") || "Name"}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("hr.ats.email") || "Email"}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("hr.ats.phone") || "Phone"}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("hr.ats.job_posting") || "Job Posting"}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("hr.ats.status") || "Status"}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("hr.ats.application_date") || "Application Date"}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("common.actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((applicant) => (
                <motion.tr
                  key={applicant._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">
                        {applicant.firstName} {applicant.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {applicant.email}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {applicant.phone}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {applicant.jobPostingId?.title || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(applicant.status)}`}>
                      {applicant.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(applicant.applicationDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/hr/ats/applicants/${applicant._id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title={t("common.view") || "View"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/hr/ats/applicants/${applicant._id}/edit`)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                        title={t("common.edit") || "Edit"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(applicant._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title={t("common.delete") || "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplicants.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t("hr.ats.no_applicants") || "No applicants found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantsList;

