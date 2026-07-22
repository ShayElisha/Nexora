import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  Save,
  X,
  DollarSign,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import FormActions, { InlineAddButton } from "../../../../components/ui/FormActions";
import DateInput from "../../../../components/ui/DateInput";
import { safeT } from "../../../../lib/i18nSafe";

const CreateJobPosting = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    location: "",
    employmentType: "full-time",
    salaryRange: {
      min: "",
      max: "",
      currency: "USD",
    },
    requirements: [],
    responsibilities: [],
    closingDate: "",
    status: "draft",
  });

  const [newRequirement, setNewRequirement] = useState("");
  const [newResponsibility, setNewResponsibility] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await axiosInstance.post("/ats/job-postings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["job-postings"]);
      toast.success(t("hr.ats.job_posting_created") || "Job posting created successfully");
      navigate("/dashboard/hr/ats/job-postings");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create job posting");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()],
      });
      setNewRequirement("");
    }
  };

  const removeRequirement = (index) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData({
        ...formData,
        responsibilities: [...formData.responsibilities, newResponsibility.trim()],
      });
      setNewResponsibility("");
    }
  };

  const removeResponsibility = (index) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-5xl mx-auto">
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
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              <Briefcase className="w-7 h-7" style={{ color: "var(--button-text)" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {safeT(t, "hr.ats.create_job_posting", "צור משרה חדשה")}
              </h1>
              <p className="mt-1" style={{ color: "var(--color-secondary)" }}>
                {safeT(t, "hr.ats.create_new_job_posting", "צור משרה חדשה")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="rounded-2xl shadow-xl p-6 sm:p-8"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
            border: "1px solid",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {safeT(t, "hr.ats.job_title", "כותרת המשרה")} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  focusRingColor: "var(--color-primary)",
                }}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {safeT(t, "hr.ats.description", "תיאור")} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                required
              />
            </div>

            {/* Department, Location, Employment Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.department", "מחלקה")}
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.location", "מיקום")}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.employment_type", "סוג העסקה")}
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="full-time">{safeT(t, "hr.ats.full_time", "משרה מלאה")}</option>
                  <option value="part-time">{safeT(t, "hr.ats.part_time", "משרה חלקית")}</option>
                  <option value="contract">{safeT(t, "hr.ats.contract", "חוזה")}</option>
                  <option value="internship">{safeT(t, "hr.ats.internship", "התמחות")}</option>
                </select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.salary_min", "שכר מינימום")}
                </label>
                <input
                  type="number"
                  value={formData.salaryRange.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryRange: { ...formData.salaryRange, min: e.target.value },
                    })
                  }
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.salary_max", "שכר מקסימום")}
                </label>
                <input
                  type="number"
                  value={formData.salaryRange.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryRange: { ...formData.salaryRange, max: e.target.value },
                    })
                  }
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.currency", "מטבע")}
                </label>
                <select
                  value={formData.salaryRange.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryRange: { ...formData.salaryRange, currency: e.target.value },
                    })
                  }
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="ILS">ILS</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {safeT(t, "hr.ats.requirements", "דרישות")}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                  className="flex-1 h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={safeT(t, "hr.ats.add_requirement", "הוסף דרישה...")}
                />
                <InlineAddButton
                  onClick={addRequirement}
                  label={safeT(t, "common.add", "הוסף")}
                />
              </div>
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: "var(--footer-bg)",
                      borderColor: "var(--border-color)",
                      border: "1px solid",
                    }}
                  >
                    <span style={{ color: "var(--text-color)" }}>{req}</span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {safeT(t, "hr.ats.responsibilities", "אחריות")}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addResponsibility())}
                  className="flex-1 h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={safeT(t, "hr.ats.add_responsibility", "הוסף אחריות...")}
                />
                <InlineAddButton
                  onClick={addResponsibility}
                  label={safeT(t, "common.add", "הוסף")}
                />
              </div>
              <div className="space-y-2">
                {formData.responsibilities.map((resp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: "var(--footer-bg)",
                      borderColor: "var(--border-color)",
                      border: "1px solid",
                    }}
                  >
                    <span style={{ color: "var(--text-color)" }}>{resp}</span>
                    <button
                      type="button"
                      onClick={() => removeResponsibility(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing Date & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.closing_date", "תאריך סגירה")}
                </label>
                <DateInput
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {safeT(t, "hr.ats.status", "סטטוס")}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="draft">{safeT(t, "hr.ats.draft", "טיוטה")}</option>
                  <option value="published">{safeT(t, "hr.ats.published", "פורסם")}</option>
                </select>
              </div>
            </div>

            <FormActions
              onCancel={() => navigate(-1)}
              loading={createMutation.isLoading}
              submitLabel={safeT(t, "common.save", "שמור")}
              cancelLabel={safeT(t, "common.cancel", "ביטול")}
              submitIcon={Save}
              cancelIcon={X}
            />
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateJobPosting;

