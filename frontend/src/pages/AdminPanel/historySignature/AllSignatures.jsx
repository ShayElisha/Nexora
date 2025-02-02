import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";
import { useTranslation } from "react-i18next";

const AllSignatures = () => {
  const { t } = useTranslation(); // שימוש במילון 'allSignatures'

  const [documents, setDocuments] = useState([]);
  const [budgetSignatures, setBudgetSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch procurement signatures
        const procurementResponse = await axiosInstance.get(
          "/procurement/all-signatures",
          { withCredentials: true }
        );
        console.log("procurementResponse.data => ", procurementResponse.data);

        if (procurementResponse.data.success) {
          setDocuments(procurementResponse.data.data);
        } else {
          // If success is false, append or set an error message
          setError((prevError) =>
            prevError
              ? `${prevError} | ${
                  procurementResponse.data.message ||
                  t("allSignatures.errors.procurement_error")
                }`
              : procurementResponse.data.message ||
                t("allSignatures.errors.procurement_error")
          );
        }

        // 2. Fetch budget signatures
        const budgetResponse = await axiosInstance.get("/budget", {
          withCredentials: true,
        });
        console.log("budgetResponse.data => ", budgetResponse.data);

        if (budgetResponse.data.success) {
          setBudgetSignatures(budgetResponse.data.data);
        } else {
          setError((prevError) =>
            prevError
              ? `${prevError} | ${
                  budgetResponse.data.message || t("allSignatures.errors.budget_error")
                }`
              : budgetResponse.data.message || t("allSignatures.errors.budget_error")
          );
        }
      } catch (err) {
        // Catch any request or network errors
        setError(
          t("allSignatures.errors.failed_to_fetch_documents", { message: err.message })
        );
      } finally {
        // Always hide the loading indicator
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return <div className="text-center">{t("allSignatures.loading")}</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {t("allSignatures.allDocuments")}
        </h2>

        {documents.length === 0 ? (
          <p className="text-center text-gray-500">{t("allSignatures.no_documents_found")}</p>
        ) : (
          <div className="max-h-[600px] overflow-auto mb-8 border border-gray-300">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.purchaseOrder")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.supplierName")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.approvalStatus")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.signers")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.document")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.PurchaseOrder || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.supplierName || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.approvalStatus || ("allSignatures.pending")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <ul className="max-h-20 overflow-y-scroll space-y-4">
                        {doc.signers.map((signer, i) => (
                          <li
                            key={i}
                            className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg shadow"
                          >
                            <div className="flex-shrink-0">
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt="Signature"
                                  className="w-12 h-12 object-contain border border-gray-300 rounded-md cursor-pointer"
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
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-gray-300 rounded-md">
                                  {t("allSignatures.no_image")}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                {signer.name || t("allSignatures.unknown")}
                              </p>
                              <p className="text-sm text-gray-500">
                                {signer.hasSigned ? t("allSignatures.signed") : t("allSignatures.pending")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
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
                          className="text-blue-500 hover:underline"
                        >
                          {t("allSignatures.viewDocument")}
                        </button>
                      ) : (
                        t("allSignatures.no_document")
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.status || t("allSignatures.n_a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== Budget Signatures Table ===================== */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          {t("allSignatures.budgetSignatures")}
        </h2>

        {budgetSignatures.length === 0 ? (
          <p className="text-center text-gray-500">
            {t("no_budget_signatures_found")}
          </p>
        ) : (
          <div className="max-h-[600px] overflow-auto border border-gray-300">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.budgetItem")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.startDate")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.endDate")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.amount")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.signers")}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t("allSignatures.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {budgetSignatures.map((budgetItem, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.departmentOrProjectName || t("allSignatures.n_a")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.startDate
                        ? new Date(budgetItem.startDate).toLocaleDateString()
                        : t("allSignatures.n_a")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.endDate
                        ? new Date(budgetItem.startDate).toLocaleDateString()
                        : t("allSignatures.n_a")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.amount || t("allSignatures.n_a")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <ul className="max-h-20 overflow-y-scroll space-y-4">
                        {budgetItem.signers?.map((signer, i) => (
                          <li
                            key={i}
                            className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg shadow"
                          >
                            <div className="flex-shrink-0">
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt={t("allSignatures.signature")}
                                  className="w-12 h-12 object-contain border border-gray-300 rounded-md cursor-pointer"
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
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-gray-300 rounded-md">
                                  {t("allSignatures.no_image")}
                                  </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                {signer.name || t("allSignatures.unknown")}
                              </p>
                              <p className="text-sm text-gray-500">
                                {signer.hasSigned ? t("allSignatures.signed") : t("allSignatures.pending")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.status || t("allSignatures.n_a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== Modal ===================== */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full relative">
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
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
