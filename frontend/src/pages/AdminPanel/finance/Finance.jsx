// src/pages/procurement/Finance.jsx
import React, { useEffect, useState } from "react"; // חשוב לייבא React אם משתמשים ב-<React.Fragment>
import { axiosInstance } from "../../../lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Sidebar from "../layouts/Sidebar"; // עדכן את הנתיב בהתאם למיקום האמיתי של Sidebar
import { FaFileAlt } from "react-icons/fa";

const Finance = () => {
  const { t } = useTranslation();
  const [financeData, setFinanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("all");

  // state לניהול פתיחת/סגירת שורת פירוט
  const [expandedRow, setExpandedRow] = useState(null);

  // state לניהול מודאל הצגת מסמכים
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const queryClient = useQueryClient();

  // הבאת מידע על המשתמש המחובר (מתוך react-query, בהנחה שיש קוד שמטפל בזה)
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  // Fetch finance data (רשומות פיננסיות)
  const {
    mutate: getFinanceData,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      // דוגמה: GET /finance
      const response = await axiosInstance.get("/finance");
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["finance"]);
      setFinanceData(data);
    },
  });

  useEffect(() => {
    if (isLoggedIn) {
      getFinanceData();
    }
  }, [isLoggedIn, getFinanceData]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text">
        {t("auth.please_login")}
      </div>
    );
  }

  // סינון לפי searchTerm בשדות:
  // invoiceNumber, recordType, transactionStatus, category,
  // transactionCurrency, transactionAmount, transactionType, transactionDate
  let filteredData = financeData.filter((doc) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // הפיכת תאריך לפורמט קריא לפני includes
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

  // פילטר סטטוס (אופציונלי)
  if (filterOption && filterOption !== "all") {
    filteredData = filteredData.filter(
      (doc) => doc.transactionStatus.toLowerCase() === filterOption
    );
  }

  // מיון הנתונים לפי sortOption
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

  // קליק על שורה: פתיחת/סגירת שורת פירוט
  const handleRowClick = (rowId) => {
    setExpandedRow((prev) => (prev === rowId ? null : rowId));
  };

  // פתיחת מודאל מסמכים
  const handleDocumentsClick = (documents = []) => {
    setSelectedDocuments(documents);
    setShowDocumentsModal(true);
  };

  // סגירת מודאל מסמכים
  const handleCloseModal = () => {
    setShowDocumentsModal(false);
    setSelectedDocuments([]);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 container mx-auto max-w-full p-8">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          {t("finance.title")}
        </h1>

        {/* שורת חיפוש וכפתור רענון */}
        <div className="mb-4 flex justify-between">
          <input
            type="text"
            placeholder={t("finance.search_placeholder")}
            className="p-2 rounded bg-secondary text-text w-full focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="ml-4 bg-primary text-button-text px-4 py-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => getFinanceData()}
          >
            {t("buttons.refresh")}
          </button>
        </div>

        {/* תפריטי גלילה למיון ולפילטר סטטוס */}
        <div className="mb-4 flex space-x-4">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 rounded bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="p-2 rounded bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t("finance.filter_status_all")}</option>
            <option value="completed">{t("finance.completed")}</option>
            <option value="pending">{t("finance.pending")}</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* הצגת תוכן הטבלה או הודעת שגיאה/טעינה */}
        {isLoading ? (
          <div className="flex items-center justify-center text-text">
            {t("loading")}
          </div>
        ) : isError ? (
          <div className="text-red-500 text-center">
            {t("errors.loading_error")} {error?.message}
          </div>
        ) : (
          <div className="bg-secondary rounded-lg shadow-xl p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-bg text-text rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-border-color">
                    <th className="py-2 px-4">
                      {t("finance.transaction_date")}
                    </th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_type")}
                    </th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_amount")}
                    </th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_currency")}
                    </th>
                    <th className="py-2 px-4">{t("finance.category")}</th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_status")}
                    </th>
                    <th className="py-2 px-4">{t("finance.documents")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((doc) => {
                    const isExpanded = expandedRow === doc._id;
                    return (
                      <React.Fragment key={doc._id}>
                        <tr
                          className="border-b border-border-color cursor-pointer hover:bg-secondary/70"
                          onClick={() => handleRowClick(doc._id)}
                        >
                          <td className="py-2 px-4">
                            {new Date(doc.transactionDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4">
                            {t(
                              `finance.transaction_types.${doc.transactionType?.toLowerCase()}`,
                              { defaultValue: doc.transactionType }
                            )}
                          </td>
                          <td className="py-2 px-4">{doc.transactionAmount}</td>
                          <td className="py-2 px-4">
                            {doc.transactionCurrency}
                          </td>
                          <td className="py-2 px-4">{doc.category}</td>
                          <td
                            className={`py-2 px-4 ${
                              doc.transactionStatus?.toLowerCase() ===
                              "completed"
                                ? "text-green-400"
                                : doc.transactionStatus?.toLowerCase() ===
                                  "pending"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {t(
                              `finance.${doc.transactionStatus?.toLowerCase()}`,
                              { defaultValue: doc.transactionStatus }
                            )}
                          </td>
                          <td className="py-2 px-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // כדי למנוע פתיחת שורת פירוט
                                handleDocumentsClick(doc.attachmentURL || []);
                              }}
                              className="text-primary hover:text-primary/80"
                            >
                              <FaFileAlt size={20} />
                            </button>
                          </td>
                        </tr>

                        {/* שורת פירוט מורחבת (נפתחת רק אם row מורחב) */}
                        {isExpanded && (
                          <tr className="bg-secondary/40">
                            <td
                              colSpan={7}
                              className="py-3 px-6 border-b border-border-color"
                            >
                              <div className="p-2">
                                <div className="mb-2">
                                  <strong>
                                    {t("finance.invoice_number")}:
                                  </strong>{" "}
                                  {doc.invoiceNumber ||
                                    t("finance.not_available")}
                                </div>
                                <div className="mb-2">
                                  <strong>{t("finance.record_type")}:</strong>{" "}
                                  {doc.recordType || t("finance.not_available")}
                                </div>
                                {/* ניתן להוסיף עוד שדות בשורת הפרטים המורחבת */}
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
                <div className="text-center text-text mt-4">
                  {t("finance.no_data_found")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* מודאל להצגת קבצים (מסמכים מצורפים) */}
      {showDocumentsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white w-11/12 md:w-2/3 lg:w-1/2 p-4 rounded shadow-lg relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              X
            </button>
            <h2 className="text-xl font-bold mb-4">
              {t("finance.documents_title")}
            </h2>
            {selectedDocuments.length > 0 ? (
              <ul className="list-disc pl-5">
                {selectedDocuments.map((docUrl, index) => (
                  <li key={index} className="my-2">
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {docUrl}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div>{t("finance.no_documents_found")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
