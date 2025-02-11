// src/components/procurement/HistorySignature.jsx
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
      <div className="flex justify-center p-6 bg-bg text-text">
        <p>{t("historySignature.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-6 bg-bg text-text">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6 bg-bg text-text">
      <div className="w-4/5">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">
          {t("historySignature.mySignaturesHistory")}
        </h2>

        <table className="w-full border-collapse border border-border-color">
          <thead className="bg-secondary">
            <tr>
              <th className="border border-border-color px-4 py-2">
                {t("historySignature.purchaseOrder")}
              </th>
              <th className="border border-border-color px-4 py-2">
                {t("historySignature.supplierName")}
              </th>
              <th className="border border-border-color px-4 py-2">
                {t("historySignature.approvalStatus")}
              </th>
              <th className="border border-border-color px-4 py-2">
                {t("historySignature.signers")}
              </th>
              <th className="border border-border-color px-4 py-2">
                {t("historySignature.document")}
              </th>
              <th className="border border-border-color px-4 py-2">
                {t("historySignature.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {signatures.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="border border-border-color px-4 py-2 text-center text-gray-500"
                >
                  {t("historySignature.no_signatures_found")}
                </td>
              </tr>
            ) : (
              signatures.map((signature, index) => (
                <tr key={index} className="hover:bg-secondary/10">
                  <td className="border border-border-color px-4 py-2">
                    {signature.purchaseOrder || t("historySignature.n_a")}
                  </td>
                  <td className="border border-border-color px-4 py-2">
                    {signature.supplierName || t("historySignature.n_a")}
                  </td>
                  <td className="border border-border-color px-4 py-2">
                    {signature.approvalStatus || t("historySignature.pending")}
                  </td>
                  <td className="border border-border-color px-4 py-2">
                    <ul className="max-h-20 overflow-y-scroll space-y-4">
                      {signature.signers.map((signer, i) => (
                        <li
                          key={i}
                          className="flex items-center space-x-4 bg-bg p-3 rounded-lg shadow border border-border-color"
                        >
                          <div className="flex-shrink-0">
                            {signer.signatureUrl ? (
                              <img
                                src={signer.signatureUrl}
                                alt={t("historySignature.signature")}
                                className="w-12 h-12 object-contain border border-border-color rounded-md cursor-pointer"
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
                              <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-border-color rounded-md">
                                {t("historySignature.no_image")}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-text">
                              {signer.name || t("historySignature.unknown")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {signer.hasSigned
                                ? t("historySignature.signed")
                                : t("historySignature.pending")}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="border border-border-color px-4 py-2">
                    {signature.documentUrl ? (
                      <button
                        onClick={() =>
                          openModal(
                            <iframe
                              src={signature.documentUrl}
                              title={t("historySignature.documentViewer")}
                              className="w-full h-96"
                            ></iframe>
                          )
                        }
                        className="text-primary hover:underline"
                      >
                        {t("historySignature.viewDocument")}
                      </button>
                    ) : (
                      t("historySignature.no_document")
                    )}
                  </td>
                  <td className="border border-border-color px-4 py-2">
                    {signature.status || t("historySignature.n_a")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full relative">
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-500 hover:text-primary"
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
