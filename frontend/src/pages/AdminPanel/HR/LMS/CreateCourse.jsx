import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Users,
  Award,
  Save,
  X,
  Loader2,
  FileText,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

const CreateCourse = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    instructor: "",
    enrollmentType: "open",
    status: "draft",
    price: "",
    currency: "USD",
    certificate: {
      enabled: false,
      requirements: "",
    },
    materials: [],
  });

  const [newMaterial, setNewMaterial] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await axiosInstance.post("/lms/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      toast.success(t("hr.lms.course_created") || "Course created successfully");
      navigate("/dashboard/hr/lms/courses");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create course");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setFormData({
        ...formData,
        materials: [...formData.materials, newMaterial.trim()],
      });
      setNewMaterial("");
    }
  };

  const removeMaterial = (index) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_, i) => i !== index),
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
              <BookOpen className="w-7 h-7" style={{ color: "var(--button-text)" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("hr.lms.create_course") || "Create Course"}
              </h1>
              <p className="text-gray-600 mt-1">
                {t("hr.lms.create_new_course") || "Create a new training course"}
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
                {t("hr.lms.course_title") || "Course Title"} *
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
                }}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {t("hr.lms.description") || "Description"} *
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

            {/* Category, Duration, Instructor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.lms.category") || "Category"}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  {t("hr.lms.duration") || "Duration (hours)"}
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
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
                  {t("hr.lms.instructor") || "Instructor"}
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>

            {/* Enrollment Type, Status, Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.lms.enrollment_type") || "Enrollment Type"}
                </label>
                <select
                  value={formData.enrollmentType}
                  onChange={(e) => setFormData({ ...formData, enrollmentType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="open">{t("hr.lms.open") || "Open"}</option>
                  <option value="invitation">{t("hr.lms.invitation") || "Invitation Only"}</option>
                  <option value="approval">{t("hr.lms.approval") || "Requires Approval"}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.lms.status") || "Status"}
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
                  <option value="draft">{t("hr.lms.draft") || "Draft"}</option>
                  <option value="published">{t("hr.lms.published") || "Published"}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("hr.lms.price") || "Price"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
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
            </div>

            {/* Certificate */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--footer-bg)", borderColor: "var(--border-color)", border: "1px solid" }}>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.certificate.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificate: { ...formData.certificate, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5"
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <label className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                  {t("hr.lms.enable_certificate") || "Enable Certificate"}
                </label>
              </div>
              {formData.certificate.enabled && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("hr.lms.certificate_requirements") || "Certificate Requirements"}
                  </label>
                  <textarea
                    value={formData.certificate.requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificate: { ...formData.certificate, requirements: e.target.value },
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Materials */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                {t("hr.lms.materials") || "Learning Materials"}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
                  className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("hr.lms.add_material") || "Add material..."}
                />
                <button
                  type="button"
                  onClick={addMaterial}
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
                {formData.materials.map((material, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: "var(--footer-bg)",
                      borderColor: "var(--border-color)",
                      border: "1px solid",
                    }}
                  >
                    <span style={{ color: "var(--text-color)" }}>{material}</span>
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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

export default CreateCourse;

