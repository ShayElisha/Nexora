import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Ticket, ArrowLeft, Send, Loader2 } from "lucide-react";

const CreateSupportTicket = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General Question",
    priority: "Medium",
  });

  const categories = [
    { value: "Bug Report", label: t("supportTickets.bugReport"), icon: "🐛" },
    { value: "Feature Request", label: t("supportTickets.featureRequest"), icon: "✨" },
    { value: "Technical Support", label: t("supportTickets.technicalSupport"), icon: "🔧" },
    { value: "Billing", label: t("supportTickets.billing"), icon: "💳" },
    { value: "General Question", label: t("supportTickets.generalQuestion"), icon: "❓" },
    { value: "Account Issue", label: t("supportTickets.accountIssue"), icon: "👤" },
  ];

  const priorities = [
    { value: "Low", label: t("supportTickets.low"), color: "text-[var(--color-secondary)]" },
    { value: "Medium", label: t("supportTickets.medium"), color: "text-yellow-600" },
    { value: "High", label: t("supportTickets.high"), color: "text-orange-600" },
    { value: "Urgent", label: t("supportTickets.urgent"), color: "text-red-600" },
  ];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/support-tickets", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["supportTickets"]);
      toast.success(t("supportTickets.createdSuccessfully"));
      navigate("/dashboard/support-tickets");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || t("supportTickets.failedToCreate")
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error(t("supportTickets.fillRequiredFields"));
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard/support-tickets")}
            className="p-2 h-11 w-11 flex items-center justify-center rounded-lg border"
            style={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          >
            <Ticket size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
              {t("supportTickets.createTicket")}
            </h1>
            <p className="text-lg mt-1" style={{ color: "var(--color-secondary)" }}>
              {t("supportTickets.createSubtitle")}
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl p-6 shadow-lg border"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              {t("supportTickets.titleLabel")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={t("supportTickets.titlePlaceholder")}
              required
              className="w-full h-11 px-4 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              {t("supportTickets.category")} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <motion.button
                  key={cat.value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setFormData({ ...formData, category: cat.value })
                  }
                  className={`p-4 rounded-xl border text-center transition-all ${
                    formData.category === cat.value
                      ? "border-blue-500 bg-blue-50"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      formData.category === cat.value
                        ? "rgba(59, 130, 246, 0.1)"
                        : "var(--bg-color)",
                    borderColor:
                      formData.category === cat.value
                        ? "#3b82f6"
                        : "var(--border-color)",
                  }}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-sm font-medium">{cat.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              {t("supportTickets.priorityLabel")} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {priorities.map((pri) => (
                <motion.button
                  key={pri.value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setFormData({ ...formData, priority: pri.value })
                  }
                  className={`flex-1 px-4 h-11 rounded-lg border font-medium transition-all ${
                    formData.priority === pri.value
                      ? "border-blue-500 bg-blue-50"
                      : ""
                  } ${pri.color}`}
                  style={{
                    backgroundColor:
                      formData.priority === pri.value
                        ? "rgba(59, 130, 246, 0.1)"
                        : "var(--bg-color)",
                    borderColor:
                      formData.priority === pri.value
                        ? "#3b82f6"
                        : "var(--border-color)",
                  }}
                >
                  {pri.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              {t("supportTickets.description")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t("supportTickets.descriptionPlaceholder")}
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl border resize-none"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/support-tickets")}
              className="flex-1 px-6 h-11 rounded-lg border font-medium"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              {t("supportTickets.cancel")}
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={createMutation.isLoading}
              className="flex-1 px-6 h-11 rounded-lg font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {createMutation.isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t("supportTickets.creating")}
                </>
              ) : (
                <>
                  <Send size={20} />
                  {t("supportTickets.createTicket")}
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateSupportTicket;

