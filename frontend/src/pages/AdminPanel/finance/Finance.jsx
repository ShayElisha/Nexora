import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FaFileAlt } from "react-icons/fa";

const Finance = () => {
  const { t } = useTranslation();
  const [financeData, setFinanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const queryClient = useQueryClient();

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  const {
    mutate: getFinanceData,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/finance");
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["finance"]);
      setFinanceData(data);
    },
    onError: (error) => console.error("Error fetching finance data:", error),
  });

  useEffect(() => {
    if (isLoggedIn) getFinanceData();
  }, [isLoggedIn, getFinanceData]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg text-text animate-fade-in">
        <p className="text-lg sm:text-xl font-semibold text-red-500">
          {t("auth.please_login")}
        </p>
      </div>
    );
  }

  let filteredData = financeData.filter((doc) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const formattedDate = new Date(doc.transactionDate)
      .toLocaleDateString()
      .toLowerCase();
    return (
      doc?.invoiceNumber?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
      doc?.recordType?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
      doc?.transactionStatus?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
      doc?.category?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
      doc?.transactionCurrency?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
      doc?.transactionAmount
        ?.toString()
        ?.toLowerCase()
        ?.includes(lowerCaseSearchTerm) ||
      doc?.transactionType?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
      formattedDate.includes(lowerCaseSearchTerm)
    );
  });

  if (filterOption !== "all") {
    filteredData = filteredData.filter(
      (doc) => doc.transactionStatus.toLowerCase() === filterOption
    );
  }

  if (sortOption) {
    filteredData.sort((a, b) => {
      switch (sortOption) {
        case "transactionDate_asc":
          return new Date(a.transactionDate) - new Date(b.transactionDate);
        case "transactionDate_desc":
          return new Date(b.transactionDate) - new Date(a.transactionDate);
        case "transactionAmount_asc":
          return a.transactionAmount - b.transactionAmount;
        case "transactionAmount_desc":
          return b.transactionAmount - a.transactionAmount;
        case "transactionType_asc":
          return a.transactionType.localeCompare(b.transactionType);
        case "transactionType_desc":
          return b.transactionType.localeCompare(a.transactionType);
        default:
          return 0;
      }
    });
  }

  const handleRowClick = (rowId) => {
    setExpandedRow((prev) => (prev === rowId ? null : rowId));
  };

  const handleDocumentsClick = (documents = []) => {
    setSelectedDocuments(Array.isArray(documents) ? documents : [documents]);
    setShowDocumentsModal(true);
  };

  const handleCloseModal = () => {
    setShowDocumentsModal(false);
    setSelectedDocuments([]);
  };

  return (
    <div className="flex min-h-screen  animate-fade-in">
      <div className="flex-1 container mx-auto max-w-full p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center mb-4 sm:mb-6 text-text tracking-tight drop-shadow-md">
          {t("finance.title")}
        </h1>

        {/* Search and Refresh */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between gap-4">
          <input
            type="text"
            placeholder={t("finance.search_placeholder")}
            className="w-full sm:w-2/3 border border-border-color rounded-xl p-3 bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-200 shadow-sm placeholder-opacity-50"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="w-full sm:w-auto bg-button-bg text-button-text px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-md transform transition-all duration-300 hover:scale-105 hover:bg-secondary"
            onClick={() => getFinanceData()}
          >
            {t("buttons.refresh")}
          </button>
        </div>

        {/* Sort and Filter */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full sm:w-1/2 border border-border-color rounded-xl p-3 bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-200 shadow-sm"
          >
            <option value="">{t("finance.sort_by")}</option>
            <option value="transactionDate_asc">
              {t("finance.sort_date_asc")}
            </option>
            <option value="transactionDate_desc">
              {t("finance.sort_date_desc")}
            </option>
            <option value="transactionAmount_asc">
              {t("finance.sort_amount_asc")}
            </option>
            <option value="transactionAmount_desc">
              {t("finance.sort_amount_desc")}
            </option>
            <option value="transactionType_asc">
              {t("finance.sort_type_asc")}
            </option>
            <option value="transactionType_desc">
              {t("finance.sort_type_desc")}
            </option>
          </select>
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="w-full sm:w-1/2 border border-border-color rounded-xl p-3 bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-200 shadow-sm"
          >
            <option value="all">{t("finance.filter_status_all")}</option>
            <option value="completed">{t("finance.completed")}</option>
            <option value="pending">{t("finance.pending")}</option>
            <option value="cancelled">{t("finance.cancelled")}</option>
          </select>
        </div>

        {/* Table or Loading/Error */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-bg">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-red-500 text-center text-lg sm:text-xl font-semibold bg-accent p-4 rounded-lg shadow-sm border border-border-color">
            {t("errors.loading_error")} {error?.message}
          </div>
        ) : (
          <div className=" rounded-2xl shadow-2xl p-4 sm:p-6 border bg-bg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-text rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-button-bg text-button-text">
                    <th className="py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold tracking-wide">
                      {t("finance.transaction_date")}
                    </th>
                    <th className="py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold tracking-wide">
                      {t("finance.transaction_type")}
                    </th>
                    <th className="py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold tracking-wide">
                      {t("finance.transaction_amount")}
                    </th>
                    <th className="py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold tracking-wide">
                      {t("finance.transaction_currency")}
                    </th>
                    <th className="py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold tracking-wide">
                      {t("finance.category")}
                    </th>
                    <th className="py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold tracking-wide">
                      {t("finance.transaction_status")}
                    </th>
                    <th className="py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold tracking-wide">
                      {t("finance.documents")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((doc) => {
                    const isExpanded = expandedRow === doc._id;
                    return (
                      <React.Fragment key={doc._id}>
                        <tr
                          className="border-b border-border-color cursor-pointer hover:bg-secondary transition-all duration-200"
                          onClick={() => handleRowClick(doc._id)}
                        >
                          <td className="py-3 px-4 sm:px-6 text-sm sm:text-base">
                            {new Date(doc.transactionDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-sm sm:text-base">
                            {t(
                              `finance.transaction_types.${doc.transactionType?.toLowerCase()}`,
                              { defaultValue: doc.transactionType }
                            )}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-sm sm:text-base">
                            {doc.transactionAmount}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-sm sm:text-base">
                            {doc.transactionCurrency}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-sm sm:text-base">
                            {doc.category}
                          </td>
                          <td
                            className={`py-3 px-4 sm:px-6 text-sm sm:text-base font-medium ${
                              doc.transactionStatus?.toLowerCase() ===
                              "completed"
                                ? "text-green-500"
                                : doc.transactionStatus?.toLowerCase() ===
                                  "pending"
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {t(
                              `finance.${doc.transactionStatus?.toLowerCase()}`,
                              { defaultValue: doc.transactionStatus }
                            )}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-sm sm:text-base">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDocumentsClick(doc.attachmentURL || []);
                              }}
                              className="text-primary hover:text-secondary transition-colors duration-200 transform hover:scale-110"
                            >
                              <FaFileAlt size={20} />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-bg animate-slide-down">
                            <td
                              colSpan={7}
                              className="py-4 px-6 sm:px-8 border-b border-border-color"
                            >
                              <div className="space-y-2 text-sm sm:text-base">
                                <p>
                                  <strong className="text-primary font-semibold">
                                    {t("finance.invoice_number")}:
                                  </strong>{" "}
                                  {doc.invoiceNumber ||
                                    t("finance.not_available")}
                                </p>
                                <p>
                                  <strong className="text-primary font-semibold">
                                    {t("finance.record_type")}:
                                  </strong>{" "}
                                  {doc.recordType || t("finance.not_available")}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="text-center text-text mt-4 sm:mt-6 text-sm sm:text-base font-semibold opacity-70">
                  {t("finance.no_data_found")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Modal */}
        {showDocumentsModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60 animate-fade-in">
            <div className="bg-bg w-11/12 sm:w-2/3 lg:w-1/2 p-4 sm:p-6 rounded-2xl shadow-2xl border border-border-color transform transition-all scale-95 hover:scale-100">
              <button
                onClick={handleCloseModal}
                className="absolute top-2 right-2 text-text hover:text-gray-800 text-xl sm:text-2xl font-bold transition-all duration-200 transform hover:scale-110"
              >
                ×
              </button>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-text tracking-tight drop-shadow-md">
                {t("finance.documents_title")}
              </h2>
              {selectedDocuments.length > 0 ? (
                <ul className="space-y-2 text-sm sm:text-base">
                  {selectedDocuments.map((docUrl, index) => (
                    <li
                      key={index}
                      className="bg-accent p-3 rounded-lg shadow-sm border border-border-color hover:bg-primary hover:text-button-text transition-all duration-200"
                    >
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {docUrl}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text text-center opacity-70">
                  {t("finance.no_documents_found")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Custom Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideDown {
            from { opacity: 0; max-height: 0; }
            to { opacity: 1; max-height: 200px; }
          }
          .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
          .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
};

export default Finance;
