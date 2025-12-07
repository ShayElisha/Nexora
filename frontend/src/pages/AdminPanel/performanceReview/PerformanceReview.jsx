import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Search,
  Eye,
  Edit,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Calendar,
  X,
} from "lucide-react";

const PerformanceReviewList = () => {
  const { t } = useTranslation();

  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [formError, setFormError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get("/PerformanceReview", {
          withCredentials: true,
        });
        const sortedReviews = res.data.sort((a, b) => {
          const statusOrder = { Pending: 0, "In Progress": 1, Completed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        setReviews(sortedReviews);
        setFilteredReviews(sortedReviews);
      } catch (err) {
        setError(
          t("performanceReview.error_loading_reviews") +
            ": " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [t]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = reviews.filter((review) => {
      const title = review.title.toLowerCase();
      const employee = `${review.employeeId?.firstName || ""} ${
        review.employeeId?.lastName || ""
      }`.toLowerCase();
      const deadline = new Date(review.deadline)
        .toLocaleDateString()
        .toLowerCase();
      const status = review.status.toLowerCase();
      const reviewer =
        review.responses.length > 0
          ? `${review.responses[0].reviewerId?.firstName || ""} ${
              review.responses[0].reviewerId?.lastName || ""
            }`.toLowerCase()
          : t("performanceReview.not_answered");
      return (
        title.includes(query) ||
        employee.includes(query) ||
        deadline.includes(query) ||
        status.includes(query) ||
        reviewer.includes(query)
      );
    });
    setFilteredReviews(filtered);
  };

  const handleOpenEditModal = (review) => {
    setSelectedReview(review);
    const initialAnswers = {};
    review.questions.forEach((_, index) => {
      initialAnswers[index] = "";
    });
    setAnswers(initialAnswers);
    setIsEditModalOpen(true);
    setFormError("");
  };

  const handleOpenViewModal = (review) => {
    setSelectedReview(review);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedReview(null);
    setAnswers({});
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setFormError("");
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
    setFormError("");
  };

  const isFormComplete = () => {
    if (!selectedReview) return false;
    return Object.values(answers).every(
      (value) => value !== "" && value !== null && value !== undefined
    );
  };

  const handleSubmitAnswers = async () => {
    if (!selectedReview) return;

    if (!isFormComplete()) {
      setFormError(t("performanceReview.all_questions_required"));
      return;
    }

    try {
      const formattedAnswers = Object.entries(answers).map(
        ([index, value]) => ({
          questionId: selectedReview.questions[index]._id,
          value,
        })
      );

      await axiosInstance.put(
        `/PerformanceReview/${selectedReview._id}/reviewers`,
        { answers: formattedAnswers },
        { withCredentials: true }
      );

      const res = await axiosInstance.get("/PerformanceReview", {
        withCredentials: true,
      });
      const sortedReviews = res.data.sort((a, b) => {
        const statusOrder = { Pending: 0, "In Progress": 1, Completed: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
      setReviews(sortedReviews);
      setFilteredReviews(sortedReviews);
      handleCloseModal();
    } catch (err) {
      console.error("Error:", err);
      setFormError(
        t("performanceReview.error_submitting_answers") +
          ": " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "Pending").length,
    inProgress: reviews.filter((r) => r.status === "In Progress").length,
    completed: reviews.filter((r) => r.status === "Completed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("performanceReview.loading")}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <ClipboardList size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("performanceReview.list_title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("performanceReview.manage_reviews")}
              </p>
            </div>
          </div>

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

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <ClipboardList size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("performanceReview.total_reviews")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("performanceReview.pending")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.pending}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Edit size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("performanceReview.in_progress")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.inProgress}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("performanceReview.completed")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.completed}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-secondary)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={t("performanceReview.search_placeholder")}
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            />
          </div>
        </motion.div>

        {/* Table */}
        {filteredReviews.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl" style={{ color: 'var(--color-secondary)' }}>
              {t("performanceReview.no_reviews")}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl shadow-lg border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("performanceReview.table_title")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("performanceReview.table_employee")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("performanceReview.table_deadline")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("performanceReview.table_status")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("performanceReview.table_reviewer")}
                    </th>
                    <th className="px-4 py-4 text-center font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("performanceReview.table_action")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review, index) => {
                    const reviewer =
                      review.responses.length > 0
                        ? `${review.responses[0].reviewerId?.firstName || ""} ${
                            review.responses[0].reviewerId?.lastName || ""
                          }`.trim()
                        : t("performanceReview.not_answered");
                    return (
                      <motion.tr
                        key={review._id}
                        className="border-b hover:bg-opacity-50 transition-all"
                        style={{ borderColor: 'var(--border-color)' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'var(--border-color)' }}
                      >
                        <td className="px-4 py-4 font-medium" style={{ color: 'var(--text-color)' }}>
                          {review.title}
                        </td>
                        <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                          {review.employeeId?.firstName} {review.employeeId?.lastName}
                        </td>
                        <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                          {new Date(review.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              review.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : review.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {review.status === "Pending" && <Clock className="inline mr-1" size={12} />}
                            {review.status === "In Progress" && <Edit className="inline mr-1" size={12} />}
                            {review.status === "Completed" && <CheckCircle className="inline mr-1" size={12} />}
                            {review.status}
                          </span>
                        </td>
                        <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                          {reviewer}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {review.status === "Completed" ? (
                            <button
                              onClick={() => handleOpenViewModal(review)}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                              title={t("performanceReview.view_answers")}
                            >
                              <Eye size={20} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenEditModal(review)}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                              title={t("performanceReview.fill_form")}
                            >
                              <Edit size={20} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditModalOpen && selectedReview && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={handleCloseModal}
            >
              <motion.div
                className="rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("performanceReview.answer_for")}: {selectedReview.title}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-full hover:scale-110 transition-all"
                    style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  {selectedReview.questions.map((q, idx) => (
                    <div key={q._id} className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}>
                      <p className="font-bold mb-3" style={{ color: 'var(--text-color)' }}>
                        {idx + 1}. {q.text}
                      </p>
                      {q.responseType === "rating" ? (
                        <input
                          type="number"
                          min="1"
                          max={q.maxRating || 5}
                          value={answers[idx] || ""}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                          style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                          placeholder={`${t("performanceReview.rating_placeholder")} (1-${q.maxRating || 5})`}
                          required
                        />
                      ) : (
                        <textarea
                          value={answers[idx] || ""}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                          style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                          rows="4"
                          placeholder={t("performanceReview.text_placeholder")}
                          required
                        />
                      )}
                    </div>
                  ))}

                  {formError && (
                    <motion.div
                      className="p-3 rounded-xl flex items-center gap-2 border-2 border-red-500 bg-red-50"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <AlertCircle size={20} className="text-red-500" />
                      <p className="text-red-700 font-medium text-sm">{formError}</p>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  >
                    {t("performanceReview.cancel")}
                  </button>
                  <button
                    onClick={handleSubmitAnswers}
                    disabled={!isFormComplete()}
                    className="px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                  >
                    {t("performanceReview.submit")}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* View Modal */}
        <AnimatePresence>
          {isViewModalOpen && selectedReview && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={handleCloseModal}
            >
              <motion.div
                className="rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("performanceReview.view_for")}: {selectedReview.title}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-full hover:scale-110 transition-all"
                    style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedReview.questions.map((question, idx) => {
                    const response = selectedReview.responses.find((r) =>
                      r.answers.some(
                        (a) => a.questionId.toString() === question._id.toString()
                      )
                    );
                    const answer = response?.answers.find(
                      (a) => a.questionId.toString() === question._id.toString()
                    );
                    return (
                      <div
                        key={question._id}
                        className="p-4 rounded-xl border"
                        style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
                      >
                        <p className="font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                          {idx + 1}. {question.text}
                        </p>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                            {t("performanceReview.answer")}:
                          </p>
                          <p className="font-medium mt-1" style={{ color: 'var(--text-color)' }}>
                            {answer
                              ? answer.value
                              : t("performanceReview.not_answered")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                  >
                    {t("performanceReview.close")}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PerformanceReviewList;
