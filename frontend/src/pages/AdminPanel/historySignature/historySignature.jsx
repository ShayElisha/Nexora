// src/pages/procurement/HistorySignature.jsx
import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";

const HistorySignature = () => {
  const { t } = useTranslation();

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

        console.log("API Response:", response.data);

        if (response.data?.success) {
          setSignatures(response.data?.data || []);
        } else {
          setError(
            response.data?.message ||
              t("historySignature.errors.procurement_error")
          );
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setSignatures([]);
        } else {
          setError(
            t("historySignature.errors.failed_to_fetch_signatures", {
              message: err.message,
            })
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center text-red-500 font-semibold text-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className=" p-8 rounded-2xl shadow-2xl w-full max-w-5xl border bg-bg transform transition-all duration-500 hover:shadow-3xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 text-text tracking-tight drop-shadow-md">
          {t("historySignature.mySignaturesHistory")}
        </h1>

        <div className="max-h-[600px] overflow-auto border border-border-color rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-secondary text-text sticky top-0">
              <tr>
                <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                  {t("historySignature.purchaseOrder")}
                </th>
                <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                  {t("historySignature.supplierName")}
                </th>
                <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                  {t("historySignature.approvalStatus")}
                </th>
                <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                  {t("historySignature.signers")}
                </th>
                <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                  {t("historySignature.document")}
                </th>
                <th className="border border-border-color px-4 py-3 text-sm font-semibold">
                  {t("historySignature.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {signatures.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="border border-border-color px-4 py-3 text-center text-gray-500"
                  >
                    {t("historySignature.no_signatures_found")}
                  </td>
                </tr>
              ) : (
                signatures.map((signature, index) => (
                  <tr
                    key={index}
                    className="hover:bg-secondary/20 transition-all duration-200"
                  >
                    <td className="border border-border-color px-4 py-3 text-text">
                      {signature.purchaseOrder || t("historySignature.n_a")}
                    </td>
                    <td className="border border-border-color px-4 py-3 text-text">
                      {signature.supplierName || t("historySignature.n_a")}
                    </td>
                    <td className="border border-border-color px-4 py-3 text-text">
                      {signature.approvalStatus ||
                        t("historySignature.pending")}
                    </td>
                    <td className="border border-border-color px-4 py-3">
                      <ul className="max-h-20 overflow-y-auto space-y-2">
                        {(signature.signers || []).map((signer, i) => (
                          <li
                            key={i}
                            className="flex items-center space-x-3 bg-bg p-2 rounded-lg shadow-sm border border-border-color"
                          >
                            <div className="flex-shrink-0">
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt={t("historySignature.signature")}
                                  className="w-10 h-10 object-contain border border-border-color rounded-md cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-200"
                                  onClick={() =>
                                    openModal(
                                      <img
                                        src={signer.signatureUrl}
                                        alt={t("historySignature.signature")}
                                        className="w-full h-auto"
                                      />
                                    )
                                  }
                                />
                              ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-500 text-xs border border-border-color rounded-md">
                                  {t("historySignature.no_image")}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-text text-sm">
                                {signer.name || t("historySignature.unknown")}
                              </p>
                              <p className="text-xs text-gray-500">
                                {signer.hasSigned
                                  ? t("historySignature.signed")
                                  : t("historySignature.pending")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-border-color px-4 py-3 text-text">
                      {signature.documentUrl ? (
                        <button
                          onClick={() =>
                            openModal(
                              <iframe
                                src={signature.documentUrl}
                                title={t("historySignature.documentViewer")}
                                className="w-full h-96 rounded-lg"
                              ></iframe>
                            )
                          }
                          className="text-primary hover:underline focus:ring-2 focus:ring-primary rounded-md px-2 py-1 transition-all duration-200"
                        >
                          {t("historySignature.viewDocument")}
                        </button>
                      ) : (
                        t("historySignature.no_document")
                      )}
                    </td>
                    <td className="border border-border-color px-4 py-3 text-text">
                      {signature.status || t("historySignature.n_a")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

export default HistorySignature;
