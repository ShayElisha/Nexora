// src/pages/procurement/Budgets.jsx
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// ============== UpdateBudgetModal Component ==============
const UpdateBudgetModal = ({ budget, onClose }) => {
  const queryClient = useQueryClient();
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

  // עדכון ה־state בכל שינוי בשדות הטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // שליחה לשרת: PUT /budget/:id
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.put(`/budget/${budget._id}`, {
        ...formData,
        resetSigners: true, // במקרה שרוצים לאפס חתימות
      });
      toast.success("Budget updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      onClose();
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Error updating budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* רקע חצי-שקוף */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"
        onClick={onClose}
      />
      {/* תוכן המודאל */}
      <div className="relative bg-white rounded-2xl p-8 w-full max-w-lg z-10 shadow-2xl transform transition-all duration-300">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Update Budget
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* departmentOrProjectName */}
          <div>
            <label className="block text-md font-semibold mb-2 text-gray-700">
              Department / Project Name:
            </label>
            <input
              type="text"
              name="departmentOrProjectName"
              value={formData.departmentOrProjectName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-all"
              required
            />
          </div>

          {/* amount */}
          <div>
            <label className="block text-md font-semibold mb-2 text-gray-700">
              Amount:
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-all"
            />
          </div>

          {/* currency */}
          <div>
            <label className="block text-md font-semibold mb-2 text-gray-700">
              Currency:
            </label>
            <input
              type="text"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              placeholder="e.g. USD"
              className="w-full p-3 border border-gray-300 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-all"
            />
          </div>

          {/* startDate / endDate */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-md font-semibold mb-2 text-gray-700">
                Start Date:
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-md font-semibold mb-2 text-gray-700">
                End Date:
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           transition-all"
              />
            </div>
          </div>

          {/* notes */}
          <div>
            <label className="block text-md font-semibold mb-2 text-gray-700">
              Notes:
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-all"
            ></textarea>
          </div>

          {/* כפתורי שמירה/ביטול */}
          <div className="flex justify-end space-x-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-gray-300 
                         text-gray-700 hover:bg-gray-200 
                         focus:outline-none transition-transform 
                         transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 
                         text-white font-semibold shadow-lg hover:from-blue-700 
                         hover:to-blue-800 transition-transform transform hover:scale-105 
                         disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Budget"}
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

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const queryClient = useQueryClient();

  // שליפת התקציבים
  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const response = await axiosInstance.get(`/budget`);
      return response.data.data; // מניח שהשדה data.data מכיל את המערך
    },
    onError: (err) => {
      toast.error(`${t("budget.error_create_budget")}: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="text-center mt-10 text-lg text-gray-700">
        {t("loading")}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-10">
        {t("error")}: {error.message}
      </div>
    );
  }

  // פתיחת/סגירת שורת פירוט
  const handleRowClick = (budgetId) => {
    setExpandedRow((prev) => (prev === budgetId ? null : budgetId));
  };

  // פתיחת מודאל "Update Budget"
  const handleOpenUpdateModal = (budget) => {
    setSelectedBudgetForUpdate(budget);
  };

  // סגירת המודאל
  const handleCloseUpdateModal = () => {
    setSelectedBudgetForUpdate(null);
  };

  // סינון חיפוש
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 py-10">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-8 text-center tracking-tight">
          {t("budget.budgets")}
        </h1>

        {/* שורת חיפוש */}
        <div className="mb-6 flex items-center justify-center">
          <input
            type="text"
            placeholder={t("search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 rounded-xl bg-white text-gray-700 w-full max-w-md 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       shadow-md transition-all"
          />
        </div>

        {/* כפתור להוספת תקציב חדש */}
        <div className="flex justify-center mb-6">
          <Link
            to="/dashboard/finance/add-budget"
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 
                       text-white rounded-xl shadow-lg font-semibold 
                       hover:from-green-600 hover:to-green-700 transition-transform 
                       transform hover:scale-105"
          >
            {t("budget.add_budget")}
          </Link>
        </div>

        {/* טבלת תקציבים */}
        <div className="overflow-x-auto shadow-2xl rounded-xl bg-white">
          <table className="min-w-full text-gray-800">
            <thead className="bg-gradient-to-r from-blue-100 to-blue-200 text-gray-700 text-lg">
              <tr className="text-center">
                {" "}
                {/* כותרות מיושרות למרכז */}
                <th className="py-3 px-4 border-b border-gray-300">
                  {t("budget.department_project_name")}
                </th>
                <th className="py-3 px-4 border-b border-gray-300">
                  {t("budget.budget_amount")}
                </th>
                <th className="py-3 px-4 border-b border-gray-300">
                  {t("budget.spent_amount")}
                </th>
                <th className="py-3 px-4 border-b border-gray-300">
                  {t("budget.currency")}
                </th>
                <th className="py-3 px-4 border-b border-gray-300">
                  {t("budget.period")}
                </th>
                <th className="py-3 px-4 border-b border-gray-300">
                  {t("budget.status")}
                </th>
                <th className="py-3 px-4 border-b border-gray-300">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-6 px-4 text-center text-gray-500"
                  >
                    {t("budget.no_budgets_available")}
                  </td>
                </tr>
              ) : (
                filteredBudgets.map((budget) => {
                  const isExpanded = expandedRow === budget._id;
                  const startStr = budget.startDate
                    ? new Date(budget.startDate).toLocaleDateString()
                    : "";
                  const endStr = budget.endDate
                    ? new Date(budget.endDate).toLocaleDateString()
                    : "";

                  // חיפוש החותם המתאים ל-createdBy (אם קיים)
                  let creatorName = "";
                  if (
                    budget.signers &&
                    budget.signers.length > 0 &&
                    budget.createdBy
                  ) {
                    const creatorSigner = budget.signers.find(
                      (signer) =>
                        String(signer.employeeId) === String(budget.createdBy)
                    );
                    if (creatorSigner) {
                      creatorName = creatorSigner.name;
                    }
                  }

                  return (
                    <React.Fragment key={budget._id}>
                      {/* שורה ראשית */}
                      <tr
                        className="cursor-pointer hover:bg-gray-100 
                                   border-b border-gray-300 transition-colors text-center"
                        onClick={() => handleRowClick(budget._id)}
                      >
                        <td className="py-2 px-4">
                          {budget.departmentOrProjectName}
                        </td>
                        <td className="py-2 px-4">{budget.amount}</td>
                        <td className="py-2 px-4">{budget.spentAmount}</td>
                        <td className="py-2 px-4">{budget.currency}</td>
                        <td className="py-2 px-4">{`${startStr} - ${endStr}`}</td>
                        <td className="py-2 px-4">
                          <span className="font-semibold">
                            {t(`budget.${budget.status}`, {
                              defaultValue: budget.status,
                            })}
                          </span>
                        </td>
                        <td className="py-2 px-4 space-x-2">
                          {/* לינק לפרטים */}
                          <Link
                            to={`/dashboard/finance/budget-details/${budget._id}`}
                            className="inline-block text-blue-600 
                                       hover:text-blue-700 font-semibold 
                                       underline-offset-2 hover:underline
                                       transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("details")}
                          </Link>
                          {/* כפתור עדכון התקציב */}
                          <button
                            className="inline-block text-purple-600 
                                       hover:text-purple-700 font-semibold 
                                       underline-offset-2 hover:underline
                                       transition-colors p-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUpdateModal(budget);
                            }}
                          >
                            {t("update")}
                          </button>
                        </td>
                      </tr>

                      {/* שורת פירוט מורחבת */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td
                            colSpan={7}
                            className="p-4 border-b border-gray-300 text-center"
                          >
                            {/* שם העובד שיצר את התקציב */}
                            <div className="mb-3 text-gray-700">
                              <strong>{t("budget.created_by")}:</strong>{" "}
                              {creatorName || t("budget.unknown_creator")}
                            </div>

                            {/* רשימת מוצרים (items) */}
                            <div className="mb-4 text-gray-700">
                              <strong className="text-lg">
                                {t("budget.items")}
                              </strong>
                              {budget.items && budget.items.length > 0 ? (
                                <div className="overflow-x-auto mt-2">
                                  <table className="w-full border border-gray-300 text-sm">
                                    <thead className="bg-gray-100 text-gray-700">
                                      <tr className="text-center">
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.product_name")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.quantity")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.unit_price")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.total_price")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.added_at")}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {budget.items.map((item, idx) => (
                                        <tr
                                          key={item._id || idx}
                                          className="hover:bg-gray-50 transition-colors text-center"
                                        >
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {item.productId?.productName ||
                                              t("budget.no_name")}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {item.quantity}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {item.unitPrice}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {item.totalPrice}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
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
                                <div className="mt-2 text-gray-500">
                                  {t("budget.no_items")}
                                </div>
                              )}
                            </div>

                            {/* חתימות (signers) */}
                            {budget.signers && budget.signers.length > 0 && (
                              <div className="text-gray-700">
                                <strong className="text-lg">
                                  {t("budget.signers")}
                                </strong>
                                <div className="overflow-x-auto mt-2">
                                  <table className="w-full border border-gray-300 text-sm">
                                    <thead className="bg-gray-100 text-gray-700">
                                      <tr className="text-center">
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.signer_name")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.signer_role")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.has_signed")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.signature_time")}
                                        </th>
                                        <th className="py-2 px-3 border-b border-gray-300">
                                          {t("budget.signature")}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {budget.signers.map((signer, sIndex) => (
                                        <tr
                                          key={signer._id || sIndex}
                                          className="hover:bg-gray-50 transition-colors text-center"
                                        >
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {signer.name}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {signer.role}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {signer.hasSigned ? "Yes" : "No"}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {signer.timeStamp
                                              ? new Date(
                                                  signer.timeStamp
                                                ).toLocaleString()
                                              : "-"}
                                          </td>
                                          <td className="py-2 px-3 border-b border-gray-200">
                                            {signer.signatureUrl ? (
                                              <img
                                                src={signer.signatureUrl}
                                                alt="signature"
                                                className="max-h-16"
                                              />
                                            ) : (
                                              "-"
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* מודאל עדכון תקציב (רק אם לחצו על כפתור Update) */}
      {selectedBudgetForUpdate && (
        <UpdateBudgetModal
          budget={selectedBudgetForUpdate}
          onClose={handleCloseUpdateModal}
        />
      )}
    </div>
  );
};

export default Budgets;
