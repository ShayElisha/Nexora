// src/pages/procurement/AllSignatures.jsx
import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";

const AllSignatures = () => {
  const { t } = useTranslation(); // שימוש במילון 'allSignatures'

  const [documents, setDocuments] = useState([]);
  const [budgetSignatures, setBudgetSignatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // טיפול בשגיאות – נציג הודעות במקום להפיל את המסך
  const [errorMessage, setErrorMessage] = useState(null);

  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // פונקציה לעדכון הודעות שגיאה (מצרפת הודעות אם כבר קיימת אחת)
  const appendError = (msg) => {
    setErrorMessage((prev) => (prev ? `${prev} | ${msg}` : msg));
  };

  useEffect(() => {
    const fetchData = async () => {
      // 1) Fetch לרכש
      try {
        const procurementResponse = await axiosInstance.get(
          "/procurement/all-signatures",
          { withCredentials: true }
        );
        if (procurementResponse.data?.success) {
          setDocuments(procurementResponse.data.data || []);
        } else {
          appendError(
            procurementResponse.data?.message ||
              t("allSignatures.errors.procurement_error")
          );
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setDocuments([]);
        } else {
          appendError(
            t("allSignatures.errors.failed_to_fetch_documents", {
              message: err.message,
            })
          );
        }
      }

      // 2) Fetch לתקציב
      try {
        const budgetResponse = await axiosInstance.get("/budget", {
          withCredentials: true,
        });
        if (budgetResponse.data?.success) {
          setBudgetSignatures(budgetResponse.data.data || []);
        } else {
          appendError(
            budgetResponse.data?.message ||
              t("allSignatures.errors.budget_error")
          );
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setBudgetSignatures([]);
        } else {
          appendError(
            t("allSignatures.errors.failed_to_fetch_documents", {
              message: err.message,
            })
          );
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [t]);

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <p>{t("allSignatures.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6 bg-bg text-text">
      <div className="w-4/5">
        {/* הצגת הודעות שגיאה במידה וקיימות */}
        {errorMessage && (
          <div className="text-center text-red-500 mb-4">{errorMessage}</div>
        )}

        {/* טבלה ראשונה – מסמכים (רכש) */}
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">
          {t("allSignatures.allDocuments")}
        </h2>

        <div className="max-h-[600px] overflow-auto mb-8 border border-border-color">
          <table className="w-full border-collapse">
            <thead className="bg-secondary">
              <tr>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.purchaseOrder")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.supplierName")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.approvalStatus")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.signers")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.document")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="border border-border-color px-4 py-2 text-center text-gray-500"
                  >
                    {t("allSignatures.no_documents_found")}
                  </td>
                </tr>
              ) : (
                documents.map((doc, index) => (
                  <tr key={index} className="hover:bg-secondary/50">
                    <td className="border border-border-color px-4 py-2">
                      {doc.PurchaseOrder || "N/A"}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {doc.supplierName || "N/A"}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {doc.approvalStatus || t("allSignatures.pending")}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      <ul className="max-h-20 overflow-y-scroll space-y-4">
                        {doc.signers.map((signer, i) => (
                          <li
                            key={i}
                            className="flex items-center space-x-4 bg-bg p-3 rounded-lg shadow border border-border-color"
                          >
                            <div className="flex-shrink-0">
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt={t("allSignatures.signature")}
                                  className="w-12 h-12 object-contain border border-border-color rounded-md cursor-pointer"
                                  onClick={() =>
                                    openModal(
                                      <img
                                        src={signer.signatureUrl}
                                        alt={t("allSignatures.signature")}
                                        className="w-full h-auto"
                                      />
                                    )
                                  }
                                />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-border-color rounded-md">
                                  {t("allSignatures.no_image")}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-text">
                                {signer.name || t("allSignatures.unknown")}
                              </p>
                              <p className="text-sm text-gray-500">
                                {signer.hasSigned
                                  ? t("allSignatures.signed")
                                  : t("allSignatures.pending")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {doc.summeryProcurement ? (
                        <button
                          onClick={() =>
                            openModal(
                              <iframe
                                src={doc.summeryProcurement}
                                title={t("allSignatures.documentViewer")}
                                className="w-full h-96"
                              ></iframe>
                            )
                          }
                          className="text-primary hover:underline"
                        >
                          {t("allSignatures.viewDocument")}
                        </button>
                      ) : (
                        t("allSignatures.no_document")
                      )}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {doc.status || t("allSignatures.n_a")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* טבלה שנייה – תקציב */}
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">
          {t("allSignatures.budgetSignatures")}
        </h2>

        <div className="max-h-[600px] overflow-auto border border-border-color">
          <table className="w-full border-collapse">
            <thead className="bg-secondary">
              <tr>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.budgetItem")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.startDate")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.endDate")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.amount")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.signers")}
                </th>
                <th className="border border-border-color px-4 py-2">
                  {t("allSignatures.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {budgetSignatures.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="border border-border-color px-4 py-2 text-center text-gray-500"
                  >
                    {t("no_budget_signatures_found")}
                  </td>
                </tr>
              ) : (
                budgetSignatures.map((budgetItem, index) => (
                  <tr key={index} className="hover:bg-secondary/50">
                    <td className="border border-border-color px-4 py-2">
                      {budgetItem.departmentOrProjectName ||
                        t("allSignatures.n_a")}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {budgetItem.startDate
                        ? new Date(budgetItem.startDate).toLocaleDateString()
                        : t("allSignatures.n_a")}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {budgetItem.endDate
                        ? new Date(budgetItem.endDate).toLocaleDateString()
                        : t("allSignatures.n_a")}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {budgetItem.amount || t("allSignatures.n_a")}
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      <ul className="max-h-20 overflow-y-scroll space-y-4">
                        {budgetItem.signers?.map((signer, i) => (
                          <li
                            key={i}
                            className="flex items-center space-x-4 bg-bg p-3 rounded-lg shadow border border-border-color"
                          >
                            <div className="flex-shrink-0">
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt={t("allSignatures.signature")}
                                  className="w-12 h-12 object-contain border border-border-color rounded-md cursor-pointer"
                                  onClick={() =>
                                    openModal(
                                      <img
                                        src={signer.signatureUrl}
                                        alt={t("allSignatures.signature")}
                                        className="w-full h-auto"
                                      />
                                    )
                                  }
                                />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-border-color rounded-md">
                                  {t("allSignatures.no_image")}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-text">
                                {signer.name || t("allSignatures.unknown")}
                              </p>
                              <p className="text-sm text-gray-500">
                                {signer.hasSigned
                                  ? t("allSignatures.signed")
                                  : t("allSignatures.pending")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-border-color px-4 py-2">
                      {budgetItem.status || t("allSignatures.n_a")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===================== Modal ===================== */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-bg rounded-lg p-6 max-w-3xl w-full relative">
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-text hover:text-primary"
              >
                ✖
              </button>
              {modalContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSignatures;
