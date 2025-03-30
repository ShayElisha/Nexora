// src/pages/procurement/AllSignatures.jsx
import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";

const AllSignatures = () => {
  const { t } = useTranslation(); // Using 'allSignatures' dictionary

  const [documents, setDocuments] = useState([]);
  const [budgetSignatures, setBudgetSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to append error messages
  const appendError = (msg) => {
    setErrorMessage((prev) => (prev ? `${prev} | ${msg}` : msg));
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch procurement data
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

      // Fetch budget data
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
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className=" p-8 rounded-2xl shadow-2xl w-full max-w-5xl border bg-bg transform transition-all duration-500 hover:shadow-3xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 text-text tracking-tight drop-shadow-md">
          {t("allSignatures.title")}
        </h1>

        {/* Error Message */}
        {errorMessage && (
          <div className="text-center text-red-500 mb-6 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Procurement Documents Table */}
        <div className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-primary">
            {t("allSignatures.allDocuments")}
          </h2>
          <div className="max-h-[400px] overflow-auto border border-border-color rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-secondary text-text sticky top-0">
                <tr>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.purchaseOrder")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.supplierName")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.approvalStatus")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.signers")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.document")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="border border-border-color px-4 py-3 text-center text-gray-500"
                    >
                      {t("allSignatures.no_documents_found")}
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, index) => (
                    <tr
                      key={index}
                      className="hover:bg-secondary/20 transition-all duration-200"
                    >
                      <td className="border border-border-color px-4 py-3 text-text">
                        {doc.PurchaseOrder || "N/A"}
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {doc.supplierName || "N/A"}
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {doc.approvalStatus || t("allSignatures.pending")}
                      </td>
                      <td className="border border-border-color px-4 py-3">
                        <ul className="max-h-20 overflow-y-auto space-y-2">
                          {doc.signers.map((signer, i) => (
                            <li
                              key={i}
                              className="flex items-center space-x-3 bg-bg p-2 rounded-lg shadow-sm border border-border-color"
                            >
                              <div className="flex-shrink-0">
                                {signer.signatureUrl ? (
                                  <img
                                    src={signer.signatureUrl}
                                    alt={t("allSignatures.signature")}
                                    className="w-10 h-10 object-contain border border-border-color rounded-md cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-200"
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
                                  <div className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-500 text-xs border border-border-color rounded-md">
                                    {t("allSignatures.no_image")}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-text text-sm">
                                  {signer.name || t("allSignatures.unknown")}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {signer.hasSigned
                                    ? t("allSignatures.signed")
                                    : t("allSignatures.pending")}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {doc.summeryProcurement ? (
                          <button
                            onClick={() =>
                              openModal(
                                <iframe
                                  src={doc.summeryProcurement}
                                  title={t("allSignatures.documentViewer")}
                                  className="w-full h-96 rounded-lg"
                                ></iframe>
                              )
                            }
                            className="text-primary hover:underline focus:ring-2 focus:ring-primary rounded-md px-2 py-1 transition-all duration-200"
                          >
                            {t("allSignatures.viewDocument")}
                          </button>
                        ) : (
                          t("allSignatures.no_document")
                        )}
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {doc.status || t("allSignatures.n_a")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Signatures Table */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-primary">
            {t("allSignatures.budgetSignatures")}
          </h2>
          <div className="max-h-[400px] overflow-auto border border-border-color rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-secondary text-text sticky top-0">
                <tr>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.budgetItem")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.startDate")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.endDate")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.amount")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.signers")}
                  </th>
                  <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                    {t("allSignatures.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {budgetSignatures.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="border border-border-color px-4 py-3 text-center text-gray-500"
                    >
                      {t("allSignatures.no_budget_signatures_found")}
                    </td>
                  </tr>
                ) : (
                  budgetSignatures.map((budgetItem, index) => (
                    <tr
                      key={index}
                      className="hover:bg-secondary/20 transition-all duration-200"
                    >
                      <td className="border border-border-color px-4 py-3 text-text">
                        {budgetItem.departmentOrProjectName ||
                          t("allSignatures.n_a")}
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {budgetItem.startDate
                          ? new Date(budgetItem.startDate).toLocaleDateString()
                          : t("allSignatures.n_a")}
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {budgetItem.endDate
                          ? new Date(budgetItem.endDate).toLocaleDateString()
                          : t("allSignatures.n_a")}
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {budgetItem.amount || t("allSignatures.n_a")}
                      </td>
                      <td className="border border-border-color px-4 py-3">
                        <ul className="max-h-20 overflow-y-auto space-y-2">
                          {budgetItem.signers?.map((signer, i) => (
                            <li
                              key={i}
                              className="flex items-center space-x-3 bg-bg p-2 rounded-lg shadow-sm border border-border-color"
                            >
                              <div className="flex-shrink-0">
                                {signer.signatureUrl ? (
                                  <img
                                    src={signer.signatureUrl}
                                    alt={t("allSignatures.signature")}
                                    className="w-10 h-10 object-contain border border-border-color rounded-md cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-200"
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
                                  <div className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-500 text-xs border border-border-color rounded-md">
                                    {t("allSignatures.no_image")}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-text text-sm">
                                  {signer.name || t("allSignatures.unknown")}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {signer.hasSigned
                                    ? t("allSignatures.signed")
                                    : t("allSignatures.pending")}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="border border-border-color px-4 py-3 text-text">
                        {budgetItem.status || t("allSignatures.n_a")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-bg rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-border-color relative transform transition-all duration-300">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-text hover:text-primary text-xl font-bold focus:outline-none transition-all duration-200"
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
