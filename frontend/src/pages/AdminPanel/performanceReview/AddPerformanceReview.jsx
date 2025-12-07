import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Users,
  FileText,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  Star,
  Tag,
} from "lucide-react";

const AddPerformanceReview = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    employeeIds: [],
    title: "",
    deadline: "",
    status: "Pending",
    questions: [{ text: "", responseType: "rating", category: "Other" }],
  });

  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/employees");
        setEmployees(Array.isArray(res.data.data) ? res.data.data : res.data);
      } catch (err) {
        setError(t("performanceReview.error_loading_employees"));
      }
    };
    fetchEmployees();
  }, [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "employeeIds") {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (option) => option.value
      );
      setFormData((prev) => ({ ...prev, employeeIds: selectedOptions }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { text: "", responseType: "rating", category: "Other" },
      ],
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      setFormData((prev) => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/PerformanceReview", formData, {
        withCredentials: true,
      });

      if (res.status === 201) {
        navigate("/performance-reviews");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          t("performanceReview.error_creating_reviews")
      );
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = () => {
    const totalFields = 3 + formData.questions.length;
    let filledFields = 0;
    if (formData.employeeIds.length > 0) filledFields++;
    if (formData.title) filledFields++;
    if (formData.deadline) filledFields++;
    formData.questions.forEach((q) => {
      if (q.text) filledFields++;
    });
    return Math.round((filledFields / totalFields) * 100);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <ClipboardList size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("performanceReview.create_new_review")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("performanceReview.create_review_description")}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: 'var(--text-color)' }}>
                {t("performanceReview.form_progress")}
              </span>
              <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                {progressPercentage()}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="p-4 rounded-xl mb-6 flex items-center gap-3 border-2 border-red-500 bg-red-50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AlertCircle size={24} className="text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 lg:p-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Employees */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Users className="inline mr-2" size={16} />
                {t("performanceReview.select_employees")} *
              </label>
              <select
                name="employeeIds"
                multiple
                value={formData.employeeIds}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 h-40"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                required
              >
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.role || "Employee"}
                  </option>
                ))}
              </select>
              <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>
                {t("performanceReview.select_employees_hint")}
              </p>
              
              {/* Selected Employees Display */}
              {formData.employeeIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.employeeIds.map((empId) => {
                    const employee = employees.find((e) => e._id === empId);
                    if (!employee) return null;
                    return (
                      <span
                        key={empId}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"
                      >
                        {employee.firstName} {employee.lastName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <FileText className="inline mr-2" size={16} />
                {t("performanceReview.title")} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("performanceReview.enter_title")}
                required
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Calendar className="inline mr-2" size={16} />
                {t("performanceReview.deadline")} *
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                required
              />
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <MessageSquare size={18} />
                  {t("performanceReview.questions")}
                </label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                >
                  <Plus size={16} />
                  {t("performanceReview.add_question")}
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {formData.questions.map((question, index) => (
                    <motion.div
                      key={index}
                      className="p-4 border rounded-xl"
                      style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>
                          {t("performanceReview.question")} #{index + 1}
                        </span>
                        {formData.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="p-2 rounded-lg hover:scale-110 transition-all text-red-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder={t("performanceReview.question_placeholder")}
                          value={question.text}
                          onChange={(e) =>
                            handleQuestionChange(index, "text", e.target.value)
                          }
                          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2"
                          style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                          required
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-secondary)' }}>
                              {t("performanceReview.response_type")}
                            </label>
                            <select
                              value={question.responseType}
                              onChange={(e) =>
                                handleQuestionChange(index, "responseType", e.target.value)
                              }
                              className="w-full p-2 border rounded-xl focus:outline-none focus:ring-2"
                              style={{
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--bg-color)',
                                color: 'var(--text-color)',
                              }}
                            >
                              <option value="rating">
                                {t("performanceReview.responseType.rating")}
                              </option>
                              <option value="text">
                                {t("performanceReview.responseType.text")}
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-secondary)' }}>
                              {t("performanceReview.category_label")}
                            </label>
                            <select
                              value={question.category}
                              onChange={(e) =>
                                handleQuestionChange(index, "category", e.target.value)
                              }
                              className="w-full p-2 border rounded-xl focus:outline-none focus:ring-2"
                              style={{
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--bg-color)',
                                color: 'var(--text-color)',
                              }}
                            >
                              <option value="Skills">
                                {t("performanceReview.category.skills")}
                              </option>
                              <option value="Performance">
                                {t("performanceReview.category.performance")}
                              </option>
                              <option value="Teamwork">
                                {t("performanceReview.category.teamwork")}
                              </option>
                              <option value="Other">
                                {t("performanceReview.category.other")}
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  {t("performanceReview.sending")}
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  {t("performanceReview.create_reviews")}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddPerformanceReview;
