import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  User,
  CheckCircle,
  Clock,
  FileSignature,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("historySignature.loading")}</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <div className="text-red-500 font-medium text-lg">{error}</div>
        </div>
      </div>
    );
  }

  const stats = {
    total: signatures.length,
    signed: signatures.filter((s) => {
      const allSigned = s.signers && s.signers.length > 0 && s.signers.every(signer => signer.hasSigned);
      return allSigned;
    }).length,
    pending: signatures.filter((s) => {
      const allSigned = s.signers && s.signers.length > 0 && s.signers.every(signer => signer.hasSigned);
      return !allSigned;
    }).length,
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Shield size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("historySignature.mySignaturesHistory")}
        </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("historySignature.view_your_signature_history")}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("historySignature.total_signatures")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("historySignature.signed")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.signed}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("historySignature.pending")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.pending}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          className="rounded-2xl shadow-lg border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("historySignature.purchaseOrder")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("historySignature.supplierName")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("historySignature.approvalStatus")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("historySignature.signers")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("historySignature.document")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("historySignature.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {signatures.length === 0 ? (
                <tr>
                    <td colSpan="6" className="px-4 py-16 text-center">
                      <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                      <p style={{ color: 'var(--color-secondary)' }}>
                    {t("historySignature.no_signatures_found")}
                      </p>
                  </td>
                </tr>
                ) : (
                  signatures.map((signature, index) => {
                    // Check if all signers have signed
                    const allSigned = signature.signers && signature.signers.length > 0 && signature.signers.every(s => s.hasSigned);
                    const displayStatus = allSigned ? "approved" : (signature.approvalStatus || "pending");
                    
                    return (
                    <motion.tr
                      key={index}
                      className="border-b hover:bg-opacity-50 transition-all"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ backgroundColor: 'var(--border-color)' }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                          <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                            {signature.purchaseOrder || t("historySignature.n_a")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                        {signature.supplierName || t("historySignature.n_a")}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            displayStatus === "approved"
                              ? "bg-green-100 text-green-700"
                              : displayStatus === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {displayStatus === "approved" ? (
                            <CheckCircle className="inline mr-1" size={12} />
                          ) : (
                            <Clock className="inline mr-1" size={12} />
                          )}
                          {displayStatus === "approved" 
                            ? t("historySignature.approved")
                            : displayStatus === "rejected"
                            ? t("historySignature.rejected")
                            : t("historySignature.pending")}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                        {(signature.signers || []).map((signer, i) => (
                            <div
                            key={i}
                              className="flex items-center gap-2 p-2 rounded-lg"
                              style={{ backgroundColor: 'var(--border-color)' }}
                          >
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt={t("historySignature.signature")}
                                  className="w-10 h-10 object-contain rounded cursor-pointer hover:scale-125 transition-all"
                                  style={{ backgroundColor: 'white' }}
                                  onClick={() =>
                                    openModal(
                                      <img
                                        src={signer.signatureUrl}
                                        alt={t("historySignature.signature")}
                                        className="w-full h-auto rounded-xl"
                                      />
                                    )
                                  }
                                />
                              ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-500 text-xs rounded">
                                  N/A
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs truncate" style={{ color: 'var(--text-color)' }}>
                                {signer.name || t("historySignature.unknown")}
                              </p>
                                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                                  {signer.hasSigned ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle size={10} />
                                      {t("historySignature.signed")}
                                    </span>
                                  ) : (
                                    <span className="text-yellow-600 flex items-center gap-1">
                                      <Clock size={10} />
                                      {t("historySignature.pending")}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                        ))}
                        </div>
                    </td>
                      <td className="px-4 py-4">
                      {signature.documentUrl ? (
                        <button
                          onClick={() =>
                            openModal(
                              <iframe
                                src={signature.documentUrl}
                                title={t("historySignature.documentViewer")}
                                  className="w-full h-[500px] rounded-lg"
                              ></iframe>
                            )
                          }
                            className="px-3 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-2"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                        >
                            <Eye size={16} />
                          {t("historySignature.viewDocument")}
                        </button>
                      ) : (
                          <span style={{ color: 'var(--color-secondary)' }}>
                            {t("historySignature.no_document")}
                          </span>
                      )}
                    </td>
                      <td className="px-4 py-4">
                        <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                      {signature.status || t("historySignature.n_a")}
                        </span>
                      </td>
                    </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
        {isModalOpen && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                onClick={closeModal}
            >
              <motion.div
                className="rounded-2xl p-6 max-w-4xl w-full shadow-2xl border relative"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 p-2 rounded-full hover:scale-110 transition-all"
                  style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                >
                  <X size={20} />
              </button>
                <div className="mt-8">
              {modalContent}
                </div>
              </motion.div>
          </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HistorySignature;
