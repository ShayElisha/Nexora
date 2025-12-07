import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";

const AddTender = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    publishDate: new Date().toISOString().split("T")[0],
    submissionDeadline: "",
    estimatedBudget: 0,
    currency: "ILS",
    status: "Draft",
    requirements: [],
    evaluationCriteria: [],
    notes: "",
  });

  const { data: tender } = useQuery({
    queryKey: ["tender", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/procurement-advanced/tenders/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (tender && isEdit) {
      setFormData({
        title: tender.title || "",
        description: tender.description || "",
        publishDate: tender.publishDate
          ? new Date(tender.publishDate).toISOString().split("T")[0]
          : "",
        submissionDeadline: tender.submissionDeadline
          ? new Date(tender.submissionDeadline).toISOString().split("T")[0]
          : "",
        estimatedBudget: tender.estimatedBudget || 0,
        currency: tender.currency || "ILS",
        status: tender.status || "Draft",
        requirements: tender.requirements || [],
        evaluationCriteria: tender.evaluationCriteria || [],
        notes: tender.notes || "",
      });
    }
  }, [tender, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/procurement-advanced/tenders/${id}`, data);
      }
      return axiosInstance.post("/procurement-advanced/tenders", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("procurement.tender_updated") || "Tender updated successfully"
          : t("procurement.tender_created") || "Tender created successfully"
      );
      queryClient.invalidateQueries(["tenders"]);
      navigate("/dashboard/procurement/tenders");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, ""],
    });
  };

  const removeRequirement = (index) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const updateRequirement = (index, value) => {
    const updated = [...formData.requirements];
    updated[index] = value;
    setFormData({ ...formData, requirements: updated });
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/procurement/tenders")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              style={{ color: 'var(--text-color)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isEdit ? t("procurement.edit_tender") || "Edit Tender" : t("procurement.add_tender") || "Add Tender"}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t("procurement.fill_tender_details") || "Fill in the details below to create a tender"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.basic_information") || "Basic Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.title") || "Title"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.description") || "Description"}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition resize-none"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.publish_date") || "Publish Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.deadline") || "Submission Deadline"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.submissionDeadline}
                    onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.estimated_budget") || "Estimated Budget"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.currency") || "Currency"}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="ILS">ILS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.status") || "Status"}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="Draft">{t("procurement.draft") || "Draft"}</option>
                    <option value="Published">{t("procurement.published") || "Published"}</option>
                    <option value="Open">{t("procurement.open") || "Open"}</option>
                    <option value="Closed">{t("procurement.closed") || "Closed"}</option>
                    <option value="Under Evaluation">{t("procurement.under_evaluation") || "Under Evaluation"}</option>
                    <option value="Awarded">{t("procurement.awarded") || "Awarded"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.requirements") || "Requirements"}
                </h2>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus size={18} />
                  {t("procurement.add_requirement") || "Add Requirement"}
                </button>
              </div>
              {formData.requirements.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {t("procurement.no_requirements") || "No requirements added yet. Click 'Add Requirement' to get started."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.requirements.map((req, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                        style={{ 
                          borderColor: 'var(--border-color)', 
                          backgroundColor: 'var(--bg-color)', 
                          color: 'var(--text-color)',
                          '--tw-ring-color': 'var(--color-primary)'
                        }}
                        placeholder={t("procurement.requirement_placeholder") || "Enter requirement..."}
                      />
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.additional_information") || "Additional Information"}
              </h2>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                {t("procurement.notes") || "Notes"}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition resize-none"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)',
                  '--tw-ring-color': 'var(--color-primary)'
                }}
                rows={4}
                placeholder={t("procurement.notes_placeholder") || "Add any additional notes or comments..."}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {mutation.isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t("procurement.saving") || "Saving..."}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {t("procurement.save") || "Save"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/procurement/tenders")}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
              >
                <X size={20} />
                {t("procurement.cancel") || "Cancel"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTender;

