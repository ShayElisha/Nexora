// src/components/procurement/HistorySignature.jsx
import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";
import { useTranslation } from "react-i18next";

const HistorySignature = () => {
  const { t } = useTranslation(); // שימוש במילון 'historySignature'

  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const response = await axiosInstance.get(`/procurement/signatures`, {
          withCredentials: true,
        });
        console.log("API Response:", response.data.data);

        if (response.data.success) {
          setSignatures(response.data.data);
        } else {
          setError(
            response.data.message ||
              t("historySignature.errors.procurement_error")
          );
        }
      } catch (err) {
        setError(
          t("historySignature.errors.failed_to_fetch_signatures", {
            message: err.message,
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, [t]); // הוספת t כתלות כדי להבטיח עדכון תרגומים בעת שינוי השפה

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
      <div className="flex">
        <Sidebar />
        <div className="ml-64 p-6 max-w-7xl mx-auto text-center">
          <p>{t("historySignature.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="ml-64 p-6 max-w-7xl mx-auto text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 max-w-7xl mx-auto">
        {/* ===================== Signatures History Table ===================== */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          {t("historySignature.mySignaturesHistory")}
        </h2>
        {signatures.length === 0 ? (
          <p className="text-center text-gray-500">
            {t("no_signatures_found")}
          </p>
        ) : (
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2">
                  {t("historySignature.purchaseOrder")}
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  {t("historySignature.supplierName")}
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  {t("historySignature.document")}
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  {t("historySignature.signature")}
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  {t("historySignature.signedAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {signatures.map((signature, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.purchaseOrder || t("historySignature.n_a")}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.supplierName || t("historySignature.n_a")}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.documentUrl ? (
                      <button
                        onClick={() =>
                          openModal(
                            <iframe
                              src={signature.documentUrl}
                              className="w-full h-96"
                              title={t("historySignature.documentViewer")}
                            />
                          )
                        }
                        className="text-blue-500 hover:underline"
                      >
                        {t("historySignature.viewDocument")}
                      </button>
                    ) : (
                      t("historySignature.no_document")
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.signatureUrl ? (
                      <img
                        src={signature.signatureUrl}
                        alt={t("historySignature.signature")}
                        className="w-20 h-auto cursor-pointer"
                        onClick={() =>
                          openModal(
                            <img
                              src={signature.signatureUrl}
                              alt={t("historySignature.signature")}
                              className="w-full h-auto"
                            />
                          )
                        }
                      />
                    ) : (
                      t("historySignature.no_signature")
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.signedAt
                      ? new Date(signature.signedAt).toLocaleString()
                      : t("historySignature.n_a")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default HistorySignature;
