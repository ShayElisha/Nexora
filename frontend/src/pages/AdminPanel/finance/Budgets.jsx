import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// ============== UpdateBudgetModal Component ==============
const UpdateBudgetModal = ({ budget, onClose }) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    departmentOrProjectName: budget.departmentOrProjectName || "",
    amount: budget.amount || 0,
    currency: budget.currency || "",
    startDate: budget.startDate
      ? new Date(budget.startDate).toISOString().slice(0, 10)
      : "",
    endDate: budget.endDate
      ? new Date(budget.endDate).toISOString().slice(0, 10)
      : "",
    notes: budget.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.put(`/budget/${budget._id}`, {
        ...formData,
        resetSigners: true,
      });
      toast.success(t("budget.updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      onClose();
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error(t("budget.error_updating"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-accent rounded-xl p-6 w-full max-w-lg z-10 shadow-2xl transform transition-all duration-300">
        <h2 className="text-2xl sm:text-3xl font-bold text-text mb-6 text-center tracking-tight drop-shadow-md">
          {t("budget.update_budget")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.department_project_name")}
            </label>
            <input
              type="text"
              name="departmentOrProjectName"
              value={formData.departmentOrProjectName}
              onChange={handleChange}
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.budget_amount")}
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.currency")}
            </label>
            <input
              type="text"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              placeholder="e.g. USD"
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
                {t("budget.start_date")}
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
                {t("budget.end_date")}
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.notes")}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-bg border border-border-color text-text rounded-full shadow-md hover:bg-gray-200 transition-all duration-200"
            >
              {t("budget.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-button-bg text-button-text rounded-full shadow-lg hover:bg-secondary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? t("budget.updating") : t("budget.update_budget")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============== Budgets Component ==============
const Budgets = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedBudgetForUpdate, setSelectedBudgetForUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const budgetsPerPage = 12; // 12 budgets per page

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();

  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const response = await axiosInstance.get(`/budget`);
      return response.data.data;
    },
    onError: (err) => {
      toast.error(`${t("budget.error_create_budget")}: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 font-medium text-lg mt-10">
        {t("budget.error")}: {error.message}
      </div>
    );
  }

  const handleRowClick = (budgetId) => {
    setExpandedRow((prev) => (prev === budgetId ? null : budgetId));
  };

  const handleOpenUpdateModal = (budget) => {
    setSelectedBudgetForUpdate(budget);
  };

  const handleCloseUpdateModal = () => {
    setSelectedBudgetForUpdate(null);
  };

  const filteredBudgets = (budgets || []).filter((budget) => {
    const term = searchTerm.toLowerCase();
    const deptName = budget.departmentOrProjectName?.toLowerCase() || "";
    const amountStr = budget.amount?.toString()?.toLowerCase() || "";
    const spentStr = budget.spentAmount?.toString()?.toLowerCase() || "";
    const currencyStr = budget.currency?.toLowerCase() || "";
    const statusStr = budget.status?.toLowerCase() || "";
    const startDateStr = budget.startDate
      ? new Date(budget.startDate).toLocaleDateString().toLowerCase()
      : "";
    const endDateStr = budget.endDate
      ? new Date(budget.endDate).toLocaleDateString().toLowerCase()
      : "";
    const periodStr = `${startDateStr}-${endDateStr}`;

    return (
      deptName.includes(term) ||
      amountStr.includes(term) ||
      spentStr.includes(term) ||
      currencyStr.includes(term) ||
      statusStr.includes(term) ||
      periodStr.includes(term)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBudgets.length / budgetsPerPage);
  const indexOfLastBudget = currentPage * budgetsPerPage;
  const indexOfFirstBudget = indexOfLastBudget - budgetsPerPage;
  const currentBudgets = filteredBudgets.slice(
    indexOfFirstBudget,
    indexOfLastBudget
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === i
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (startPage > 1) {
        pageNumbers.push(
          <button
            key={1}
            onClick={() => paginate(1)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === 1
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(
            <span key="start-dots" className="mx-1">
              ...
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === i
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-dots" className="mx-1">
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => paginate(totalPages)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === totalPages
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="min-h-screen py-10 animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
          {t("budget.budgets")}
        </h1>

        <div className="mb-6 flex justify-center">
          <input
            type="text"
            placeholder={t("budget.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200 placeholder-opacity-50"
          />
        </div>

        <div className="flex justify-center mb-8">
          <Link
            to="/dashboard/finance/add-budget"
            className="px-6 py-3 bg-button-bg text-button-text rounded-full shadow-lg hover:bg-secondary transition-all duration-200"
          >
            {t("budget.add_budget")}
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl shadow-2xl bg-bg border border-border-color">
          <table className="min-w-full text-text">
            <thead className="bg-button-bg text-button-text">
              <tr className="text-center">
                <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                  {t("budget.department_project_name")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                  {t("budget.budget_amount")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                  {t("budget.spent_amount")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                  {t("budget.currency")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                  {t("budget.period")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                  {t("budget.status")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                  {t("budget.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-6 px-4 text-center text-text opacity-70 italic"
                  >
                    {t("budget.no_budgets_available")}
                  </td>
                </tr>
              ) : (
                currentBudgets.map((budget) => {
                  const isExpanded = expandedRow === budget._id;
                  const startStr = budget.startDate
                    ? new Date(budget.startDate).toLocaleDateString()
                    : "-";
                  const endStr = budget.endDate
                    ? new Date(budget.endDate).toLocaleDateString()
                    : "-";
                  const creatorName =
                    budget.signers?.find(
                      (signer) =>
                        String(signer.employeeId) === String(budget.createdBy)
                    )?.name || t("budget.unknown_creator");

                  return (
                    <React.Fragment key={budget._id}>
                      <tr
                        className="border-b border-border-color hover:bg-accent cursor-pointer text-center"
                        onClick={() => handleRowClick(budget._id)}
                      >
                        <td className="py-3 px-4 text-sm">
                          {budget.departmentOrProjectName || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {budget.amount || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {budget.spentAmount || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {budget.currency || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm">{`${startStr} - ${endStr}`}</td>
                        <td className="py-3 px-4 text-sm font-semibold">
                          {t(`budget.${budget.status}`, {
                            defaultValue: budget.status,
                          })}
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <Link
                            to={`/dashboard/finance/budget-details/${budget._id}`}
                            className="text-primary hover:text-secondary font-semibold transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("budget.details")}
                          </Link>
                          <button
                            className="text-purple-500 hover:text-purple-600 font-semibold transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUpdateModal(budget);
                            }}
                          >
                            {t("budget.update")}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-bg border-b border-border-color">
                          <td colSpan="7" className="p-4 text-text">
                            <div className="space-y-4">
                              <div>
                                <strong className="text-sm font-semibold">
                                  {t("budget.created_by")}:
                                </strong>{" "}
                                <span className="text-sm">{creatorName}</span>
                              </div>
                              <div>
                                <strong className="text-sm font-semibold">
                                  {t("budget.items")}:
                                </strong>
                                {budget.items && budget.items.length > 0 ? (
                                  <div className="overflow-x-auto mt-2">
                                    <table className="w-full border border-border-color text-sm">
                                      <thead className="bg-button-bg text-button-text">
                                        <tr className="text-center">
                                          <th className="py-2 px-3">
                                            {t("budget.product_name")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.quantity")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.unit_price")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.total_price")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.added_at")}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {budget.items.map((item, idx) => (
                                          <tr
                                            key={item._id || idx}
                                            className="border-b border-border-color hover:bg-accent text-center"
                                          >
                                            <td className="py-2 px-3">
                                              {item.productId?.productName ||
                                                t("budget.no_name")}
                                            </td>
                                            <td className="py-2 px-3">
                                              {item.quantity || "-"}
                                            </td>
                                            <td className="py-2 px-3">
                                              {item.unitPrice || "-"}
                                            </td>
                                            <td className="py-2 px-3">
                                              {item.totalPrice || "-"}
                                            </td>
                                            <td className="py-2 px-3">
                                              {item.addedAt
                                                ? new Date(
                                                    item.addedAt
                                                  ).toLocaleString()
                                                : "-"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="mt-2 text-sm opacity-70">
                                    {t("budget.no_items")}
                                  </div>
                                )}
                              </div>
                              {budget.signers && budget.signers.length > 0 && (
                                <div>
                                  <strong className="text-sm font-semibold">
                                    {t("budget.signers")}:
                                  </strong>
                                  <div className="overflow-x-auto mt-2">
                                    <table className="w-full border border-border-color text-sm">
                                      <thead className="bg-button-bg text-button-text">
                                        <tr className="text-center">
                                          <th className="py-2 px-3">
                                            {t("budget.signer_name")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.signer_role")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.has_signed")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.signature_time")}
                                          </th>
                                          <th className="py-2 px-3">
                                            {t("budget.signature")}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {budget.signers.map(
                                          (signer, sIndex) => (
                                            <tr
                                              key={signer._id || sIndex}
                                              className="border-b border-border-color hover:bg-accent text-center"
                                            >
                                              <td className="py-2 px-3">
                                                {signer.name || "-"}
                                              </td>
                                              <td className="py-2 px-3">
                                                {signer.role || "-"}
                                              </td>
                                              <td className="py-2 px-3">
                                                {signer.hasSigned
                                                  ? t("budget.yes")
                                                  : t("budget.no")}
                                              </td>
                                              <td className="py-2 px-3">
                                                {signer.timeStamp
                                                  ? new Date(
                                                      signer.timeStamp
                                                    ).toLocaleString()
                                                  : "-"}
                                              </td>
                                              <td className="py-2 px-3">
                                                {signer.signatureUrl ? (
                                                  <img
                                                    src={signer.signatureUrl}
                                                    alt="signature"
                                                    className="max-h-12 mx-auto"
                                                  />
                                                ) : (
                                                  "-"
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredBudgets.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-full ${
                  currentPage === 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-button-bg text-button-text hover:bg-secondary"
                }`}
              >
                ←
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-full ${
                  currentPage === totalPages
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-button-bg text-button-text hover:bg-secondary"
                }`}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedBudgetForUpdate && (
        <UpdateBudgetModal
          budget={selectedBudgetForUpdate}
          onClose={handleCloseUpdateModal}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Budgets;
