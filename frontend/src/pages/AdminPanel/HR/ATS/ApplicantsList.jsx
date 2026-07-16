import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "../../../../components/ui/EmptyState";
import SearchField from "../../../../components/ui/SearchField";
import { safeT } from "../../../../lib/i18nSafe";

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
      toast.success(safeT(t, "hr.ats.applicant_deleted", "המועמד נמחק"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete applicant");
    },
  });

  const filteredApplicants = applicants.filter(
    (applicant) =>
      `${applicant.firstName} ${applicant.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
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

  const fieldStyle = {
    borderColor: "var(--border-color)",
    backgroundColor: "var(--bg-color)",
    color: "var(--text-color)",
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[50vh]"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--text-color)" }}
          >
            {safeT(t, "hr.ats.applicants", "מועמדים")}
          </h1>
          <p className="mt-1" style={{ color: "var(--color-secondary)" }}>
            {safeT(t, "hr.ats.manage_applicants", "נהל ועקוב אחר מועמדים")}
          </p>
        </div>

        <div
          className="rounded-2xl shadow-xl p-6"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
            border: "1px solid",
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchField
              className="flex-1"
              placeholder={safeT(
                t,
                "hr.ats.search_applicants",
                "חפש מועמדים..."
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={fieldStyle}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={fieldStyle}
            >
              <option value="all">
                {safeT(t, "hr.ats.all_statuses", "כל הסטטוסים")}
              </option>
              <option value="applied">
                {safeT(t, "hr.ats.applied", "הוגש")}
              </option>
              <option value="screening">
                {safeT(t, "hr.ats.screening", "סינון")}
              </option>
              <option value="interview_scheduled">
                {safeT(t, "hr.ats.interview_scheduled", "ראיון נקבע")}
              </option>
              <option value="interviewed">
                {safeT(t, "hr.ats.interviewed", "רואיין")}
              </option>
              <option value="offer_extended">
                {safeT(t, "hr.ats.offer_extended", "הצעה נשלחה")}
              </option>
              <option value="offer_accepted">
                {safeT(t, "hr.ats.offer_accepted", "הצעה התקבלה")}
              </option>
              <option value="rejected">
                {safeT(t, "hr.ats.rejected", "נדחה")}
              </option>
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={fieldStyle}
            >
              <option value="all">
                {safeT(t, "hr.ats.all_stages", "כל השלבים")}
              </option>
              <option value="application">
                {safeT(t, "hr.ats.application", "הגשה")}
              </option>
              <option value="phone_screen">
                {safeT(t, "hr.ats.phone_screen", "שיחת טלפון")}
              </option>
              <option value="technical_interview">
                {safeT(t, "hr.ats.technical_interview", "ראיון טכני")}
              </option>
              <option value="final_interview">
                {safeT(t, "hr.ats.final_interview", "ראיון סופי")}
              </option>
              <option value="offer">{safeT(t, "hr.ats.offer", "הצעה")}</option>
            </select>
          </div>

          {filteredApplicants.length === 0 ? (
            <div
              className="rounded-xl border"
              style={{
                backgroundColor: "var(--footer-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <EmptyState
                icon={User}
                title={safeT(t, "hr.ats.no_applicants", "לא נמצאו מועמדים")}
                description={safeT(
                  t,
                  "hr.ats.no_applicants_hint",
                  "מועמדים חדשים יופיעו כאן לאחר הגשת מועמדות"
                )}
              />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--footer-bg)" }}>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    {[
                      ["hr.ats.name", "שם"],
                      ["hr.ats.email", "אימייל"],
                      ["hr.ats.phone", "טלפון"],
                      ["hr.ats.job_posting", "משרה"],
                      ["hr.ats.status", "סטטוס"],
                      ["hr.ats.application_date", "תאריך הגשה"],
                      ["common.actions", "פעולות"],
                    ].map(([key, fb]) => (
                      <th
                        key={key}
                        className="text-start py-3 px-4 font-semibold"
                        style={{ color: "var(--text-color)" }}
                      >
                        {safeT(t, key, fb)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map((applicant) => (
                    <motion.tr
                      key={applicant._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--footer-bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                        <div className="flex items-center gap-2">
                          <User
                            className="w-5 h-5"
                            style={{ color: "var(--color-secondary)" }}
                          />
                          <span className="font-medium">
                            {applicant.firstName} {applicant.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                        <div className="flex items-center gap-2">
                          <Mail
                            className="w-4 h-4"
                            style={{ color: "var(--color-secondary)" }}
                          />
                          {applicant.email}
                        </div>
                      </td>
                      <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                        <div className="flex items-center gap-2">
                          <Phone
                            className="w-4 h-4"
                            style={{ color: "var(--color-secondary)" }}
                          />
                          {applicant.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                        {applicant.jobPostingId?.title || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(applicant.status)}`}
                        >
                          {applicant.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                        {new Date(applicant.applicationDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/hr/ats/applicants/${applicant._id}`
                              )
                            }
                            className="p-2 rounded-lg transition-all hover:opacity-80"
                            style={{ color: "var(--color-primary)" }}
                            title={safeT(t, "common.view", "צפייה")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/hr/ats/applicants/${applicant._id}/edit`
                              )
                            }
                            className="p-2 rounded-lg transition-all hover:opacity-80"
                            style={{ color: "var(--color-secondary)" }}
                            title={safeT(t, "common.edit", "עריכה")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              deleteMutation.mutate(applicant._id)
                            }
                            className="p-2 rounded-lg transition-all hover:opacity-80 text-red-600"
                            title={safeT(t, "common.delete", "מחק")}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantsList;
