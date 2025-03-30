import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { FaEdit, FaEye, FaExclamationTriangle, FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

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
      alert(
        t("performanceReview.error_submitting_answers") +
          ": " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-bg to-bg min-h-screen animate-fade-in">
      <h1 className="text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
        {t("performanceReview.list_title")}
      </h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-lg animate-slide-in">
          <p className="flex items-center">
            <FaExclamationTriangle className="mr-2" /> {error}
          </p>
        </div>
      )}

      {/* שורת חיפוש */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={t("performanceReview.search_placeholder")}
            className="w-full p-4 pl-12 border border-border-color rounded-full shadow-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-white text-text placeholder-gray-400"
          />
          <FaSearch
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary"
            size={20}
          />
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <p className="text-text text-center text-lg font-medium animate-fade-in">
          {t("performanceReview.no_reviews")}
        </p>
      ) : (
        <div className="overflow-x-auto shadow-2xl rounded-xl bg-white transform transition-all duration-500 hover:shadow-3xl">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-primary to-secondary text-button-text">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("performanceReview.table_title")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("performanceReview.table_employee")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("performanceReview.table_deadline")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("performanceReview.table_status")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("performanceReview.table_reviewer")}
                </th>
                <th className="py-4 px-6 text-center text-sm font-bold tracking-wider">
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
                  <tr
                    key={review._id}
                    className={`border-b transition-all duration-300 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-accent hover:shadow-inner animate-slide-up`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6 text-text font-medium">
                      {review.title}
                    </td>
                    <td className="py-4 px-6 text-text">
                      {review.employeeId?.firstName}{" "}
                      {review.employeeId?.lastName}
                    </td>
                    <td className="py-4 px-6 text-text">
                      {new Date(review.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-4 py-1 rounded-full text-sm font-semibold transition-transform duration-200 transform hover:scale-105 ${
                          review.status === "Pending"
                            ? "bg-yellow-200 text-yellow-900"
                            : review.status === "In Progress"
                            ? "bg-blue-200 text-blue-900"
                            : "bg-green-200 text-green-900"
                        }`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-text">{reviewer}</td>
                    <td className="py-4 px-6 text-center">
                      {review.status === "Completed" ? (
                        <button
                          onClick={() => handleOpenViewModal(review)}
                          className="text-primary hover:text-secondary transition-all duration-200 transform hover:scale-125 hover:rotate-6"
                          title={t("performanceReview.view_answers")}
                        >
                          <FaEye size={24} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenEditModal(review)}
                          className="text-accent hover:text-primary transition-all duration-200 transform hover:scale-125 hover:rotate-6"
                          title={t("performanceReview.fill_form")}
                        >
                          <FaEdit size={24} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* מודל למילוי תשובות */}
      {isEditModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center transition-opacity duration-500 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-95 hover:scale-100 border border-border-color">
            <h2 className="text-2xl font-bold text-text mb-6 tracking-tight drop-shadow-sm">
              {t("performanceReview.answer_for")}: {selectedReview.title}
            </h2>
            {selectedReview.questions.map((q, idx) => (
              <div
                key={q._id}
                className="mb-6 animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <p className="font-semibold text-text mb-2">{q.text}</p>
                {q.responseType === "rating" ? (
                  <input
                    type="number"
                    min="1"
                    max={q.maxRating || 5}
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="w-full p-3 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-gray-50 text-text placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder={`${t(
                      "performanceReview.rating_placeholder"
                    )} (1-${q.maxRating || 5})`}
                    required
                  />
                ) : (
                  <textarea
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="w-full p-3 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-gray-50 text-text placeholder-gray-400 resize-none shadow-sm hover:shadow-md"
                    rows="4"
                    placeholder={t("performanceReview.text_placeholder")}
                    required
                  />
                )}
              </div>
            ))}
            {formError && (
              <p className="text-red-700 bg-red-100 p-3 rounded-lg mb-4 flex items-center shadow-md animate-shake">
                <FaExclamationTriangle className="mr-2" /> {formError}
              </p>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleSubmitAnswers}
                className={`px-6 py-2 rounded-full text-button-text font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  isFormComplete()
                    ? "bg-gradient-to-r from-button-bg to-accent"
                    : "bg-button-bg opacity-60 cursor-not-allowed"
                }`}
                disabled={!isFormComplete()}
              >
                {t("performanceReview.submit")}
              </button>
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gradient-to-r from-secondary to-primary text-button-text rounded-full hover:bg-secondary transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                {t("performanceReview.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל לצפייה בתשובות */}
      {isViewModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center transition-opacity duration-500 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-95 hover:scale-100 border border-border-color">
            <h2 className="text-2xl font-bold text-text mb-6 tracking-tight drop-shadow-sm">
              {t("performanceReview.view_for")}: {selectedReview.title}
            </h2>
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
                  className="mb-6 border-b border-border-color pb-4 animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <p className="font-semibold text-text mb-2">
                    {question.text}
                  </p>
                  <p className="text-text bg-gray-100 p-4 rounded-lg shadow-inner">
                    {t("performanceReview.answer")}:{" "}
                    <span className="font-medium">
                      {answer
                        ? answer.value
                        : t("performanceReview.not_answered")}
                    </span>
                  </p>
                </div>
              );
            })}
            <div className="flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gradient-to-r from-secondary to-primary text-button-text rounded-full hover:bg-secondary transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                {t("performanceReview.close")}
              </button>
            </div>
          </div>
        </div>
      )}

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
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
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
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PerformanceReviewList;
