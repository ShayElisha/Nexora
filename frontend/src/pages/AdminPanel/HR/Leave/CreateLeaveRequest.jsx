import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  Save,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const CreateLeaveRequest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    leaveType: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await axiosInstance.post("/leave", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leave-requests"]);
      queryClient.invalidateQueries(["employee-self-service"]);
      toast.success(t("hr.leave.request_created") || "Leave request created successfully");
      navigate("/dashboard/hr/leave/requests");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create leave request");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error(t("hr.leave.select_dates") || "Please select start and end dates");
      return;
    }
    createMutation.mutate(formData);
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
              }}
            >
              <Calendar className="w-7 h-7" style={{ color: "var(--button-text)" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("hr.leave.create_request") || "Create Leave Request"}
              </h1>
              <p className="text-gray-600 mt-1">
                {t("hr.leave.submit_leave_request") || "Submit a new leave request"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="rounded-2xl shadow-xl p-6 sm:p-8"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
            border: "1px solid",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              {t("hr.leave.leave_type") || "Leave Type"} *
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              required
            >
              <option value="vacation">{t("hr.leave.vacation") || "Vacation"}</option>
              <option value="sick">{t("hr.leave.sick") || "Sick"}</option>
              <option value="personal">{t("hr.leave.personal") || "Personal"}</option>
              <option value="maternity">{t("hr.leave.maternity") || "Maternity"}</option>
              <option value="paternity">{t("hr.leave.paternity") || "Paternity"}</option>
              <option value="bereavement">{t("hr.leave.bereavement") || "Bereavement"}</option>
              <option value="unpaid">{t("hr.leave.unpaid") || "Unpaid"}</option>
              <option value="other">{t("hr.leave.other") || "Other"}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {t("hr.leave.start_date") || "Start Date"} *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {t("hr.leave.end_date") || "End Date"} *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                required
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="rounded-xl p-4" style={{ backgroundColor: "var(--footer-bg)", borderColor: "var(--border-color)", border: "1px solid" }}>
              <div className="flex items-center gap-2" style={{ color: "var(--color-primary)" }}>
                <Clock className="w-5 h-5" />
                <span className="font-semibold">
                  {calculateDays()} {t("hr.leave.days") || "days"}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              {t("hr.leave.reason") || "Reason"} (Optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              placeholder={t("hr.leave.reason_placeholder") || "Please provide a reason for your leave request..."}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={createMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
              style={{
                background: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
                color: "var(--button-text)",
              }}
            >
              {createMutation.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {t("hr.leave.submit_request") || "Submit Request"}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: "var(--footer-bg)",
                color: "var(--text-color)",
                borderColor: "var(--border-color)",
                border: "1px solid",
              }}
            >
              <X className="w-5 h-5 inline mr-2" />
              {t("common.cancel") || "Cancel"}
            </motion.button>
          </div>
        </div>
      </motion.form>
      </div>
    </div>
  );
};

export default CreateLeaveRequest;

