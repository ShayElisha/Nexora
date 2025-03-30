import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

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

  return (
    <div className="min-h-screen mx-auto p-8 bg-bg animate-fade-in">
      <h1 className="text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
        {t("performanceReview.create_new_review")}
      </h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-lg animate-slide-in">
          <p className="flex items-center">
            <FaExclamationTriangle className="mr-2" /> {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        {/* בחירת עובדים */}
        <div className="animate-slide-up">
          <label className="block mb-2 text-text font-semibold">
            {t("performanceReview.select_employees")}
          </label>
          <select
            name="employeeIds"
            multiple
            value={formData.employeeIds}
            onChange={handleChange}
            className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text shadow-sm hover:shadow-md h-40"
            required
          >
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <p className="text-sm text-text mt-1 opacity-70">
            {t("performanceReview.select_employees_hint")}
          </p>
        </div>

        {/* כותרת */}
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <label className="block mb-2 text-text font-semibold">
            {t("performanceReview.title")}
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text placeholder-gray-400 shadow-sm hover:shadow-md"
            required
          />
        </div>

        {/* תאריך יעד */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <label className="block mb-2 text-text font-semibold">
            {t("performanceReview.deadline")}
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text shadow-sm hover:shadow-md"
            required
          />
        </div>

        {/* שאלות */}
        <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <label className="block mb-2 text-text font-semibold">
            {t("performanceReview.questions")}
          </label>
          {formData.questions.map((question, index) => (
            <div
              key={index}
              className="mb-4 p-4 border border-border-color rounded-lg shadow-md bg-white space-y-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <input
                type="text"
                placeholder={t("performanceReview.question_placeholder")}
                value={question.text}
                onChange={(e) =>
                  handleQuestionChange(index, "text", e.target.value)
                }
                className="w-full p-3 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-gray-50 text-text placeholder-gray-400 shadow-sm hover:shadow-md"
                required
              />
              <select
                value={question.responseType}
                onChange={(e) =>
                  handleQuestionChange(index, "responseType", e.target.value)
                }
                className="w-full p-3 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-gray-50 text-text shadow-sm hover:shadow-md"
              >
                <option value="rating">
                  {t("performanceReview.responseType.rating")}
                </option>
                <option value="text">
                  {t("performanceReview.responseType.text")}
                </option>
              </select>
              <select
                value={question.category}
                onChange={(e) =>
                  handleQuestionChange(index, "category", e.target.value)
                }
                className="w-full p-3 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-gray-50 text-text shadow-sm hover:shadow-md"
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
              {formData.questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center"
                >
                  <FaTrash className="mr-2" />{" "}
                  {t("performanceReview.remove_question")}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="bg-gradient-to-r from-primary to-secondary text-button-text px-4 py-2 rounded-full hover:bg-secondary transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center mt-2"
          >
            <FaPlus className="mr-2" /> {t("performanceReview.add_question")}
          </button>
        </div>

        {/* כפתור שליחה */}
        <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-4 rounded-full text-button-text font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              loading
                ? "bg-button-bg opacity-60 cursor-not-allowed"
                : "bg-gradient-to-r from-button-bg to-accent"
            }`}
          >
            {loading
              ? t("performanceReview.sending")
              : t("performanceReview.create_reviews")}
          </button>
        </div>
      </form>

      {/* אנימציות מותאמות */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddPerformanceReview;
