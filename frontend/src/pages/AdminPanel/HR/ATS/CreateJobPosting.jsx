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
  Loader2,
  DollarSign,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

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
                background: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
              }}
            >
              <Briefcase className="w-7 h-7" style={{ color: "var(--button-text)" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("hr.ats.create_job_posting") || "Create Job Posting"}
              </h1>
              <p className="text-gray-600 mt-1">
                {t("hr.ats.create_new_job_posting") || "Create a new job posting"}
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
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {t("hr.ats.job_title") || "Job Title"} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
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
                {t("hr.ats.description") || "Description"} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                required
              />
            </div>

            {/* Department, Location, Employment Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.department") || "Department"}
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.location") || "Location"}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.employment_type") || "Employment Type"}
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="full-time">{t("hr.ats.full_time") || "Full Time"}</option>
                  <option value="part-time">{t("hr.ats.part_time") || "Part Time"}</option>
                  <option value="contract">{t("hr.ats.contract") || "Contract"}</option>
                  <option value="internship">{t("hr.ats.internship") || "Internship"}</option>
                </select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.salary_min") || "Min Salary"}
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
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.salary_max") || "Max Salary"}
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
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.currency") || "Currency"}
                </label>
                <select
                  value={formData.salaryRange.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryRange: { ...formData.salaryRange, currency: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
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
                {t("hr.ats.requirements") || "Requirements"}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                  className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("hr.ats.add_requirement") || "Add requirement..."}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-4 py-2 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--button-text)",
                  }}
                >
                  {t("common.add") || "Add"}
                </button>
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
                {t("hr.ats.responsibilities") || "Responsibilities"}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addResponsibility())}
                  className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("hr.ats.add_responsibility") || "Add responsibility..."}
                />
                <button
                  type="button"
                  onClick={addResponsibility}
                  className="px-4 py-2 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--button-text)",
                  }}
                >
                  {t("common.add") || "Add"}
                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.closing_date") || "Closing Date"}
                </label>
                <input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.ats.status") || "Status"}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="draft">{t("hr.ats.draft") || "Draft"}</option>
                  <option value="published">{t("hr.ats.published") || "Published"}</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
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
                {t("common.save") || "Save"}
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

export default CreateJobPosting;

