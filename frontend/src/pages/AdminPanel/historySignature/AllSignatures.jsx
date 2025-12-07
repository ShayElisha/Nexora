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
  Package,
  DollarSign,
  Calendar,
  Shield,
  Filter,
} from "lucide-react";

const AllSignatures = () => {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState([]);
  const [budgetSignatures, setBudgetSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("procurement");

  const appendError = (msg) => {
    setErrorMessage((prev) => (prev ? `${prev} | ${msg}` : msg));
  };

  useEffect(() => {
    const fetchData = async () => {
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("allSignatures.loading")}</p>
        </motion.div>
      </div>
    );
  }

  const stats = {
    totalProcurement: documents.length,
    totalBudget: budgetSignatures.length,
    pendingProcurement: documents.filter((d) => {
      const allSigned = d.signers && d.signers.length > 0 && d.signers.every(s => s.hasSigned);
      return !allSigned;
    }).length,
    pendingBudget: budgetSignatures.filter((b) => {
      const allSigned = b.signers && b.signers.length > 0 && b.signers.every(s => s.hasSigned);
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <FileSignature size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("allSignatures.title")}
        </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("allSignatures.manage_all_signatures")}
              </p>
            </div>
          </div>

        {/* Error Message */}
        {errorMessage && (
            <motion.div
              className="p-4 rounded-xl mb-6 flex items-center gap-3 border-2 border-red-500 bg-red-50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={24} className="text-red-500" />
              <p className="text-red-700 font-medium">{errorMessage}</p>
            </motion.div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Package size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("allSignatures.total_procurement")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.totalProcurement}
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
                  <DollarSign size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("allSignatures.total_budgets")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.totalBudget}
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
                    {t("allSignatures.pending_procurement")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.pendingProcurement}
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                  <Clock size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("allSignatures.pending_budgets")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.pendingBudget}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("procurement")}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                activeTab === "procurement" ? "shadow-lg" : "shadow-md"
              }`}
              style={{
                backgroundColor: activeTab === "procurement" ? 'var(--color-primary)' : 'var(--border-color)',
                color: activeTab === "procurement" ? 'var(--button-text)' : 'var(--text-color)',
              }}
            >
              <Package className="inline mr-2" size={20} />
            {t("allSignatures.allDocuments")}
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                activeTab === "budget" ? "shadow-lg" : "shadow-md"
              }`}
              style={{
                backgroundColor: activeTab === "budget" ? 'var(--color-primary)' : 'var(--border-color)',
                color: activeTab === "budget" ? 'var(--button-text)' : 'var(--text-color)',
              }}
            >
              <DollarSign className="inline mr-2" size={20} />
              {t("allSignatures.budgetSignatures")}
            </button>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "procurement" ? (
            <motion.div
              key="procurement"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-2xl shadow-lg border overflow-hidden"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.purchaseOrder")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.supplierName")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.approvalStatus")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.signers")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.document")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                        <td colSpan="6" className="px-4 py-16 text-center">
                          <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                          <p style={{ color: 'var(--color-secondary)' }}>
                      {t("allSignatures.no_documents_found")}
                          </p>
                    </td>
                  </tr>
                ) : (
                      documents.map((doc, index) => {
                        // Check if all signers have signed
                        const allSigned = doc.signers && doc.signers.length > 0 && doc.signers.every(s => s.hasSigned);
                        const displayStatus = allSigned ? "approved" : (doc.approvalStatus || "pending");
                        
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
                        {doc.PurchaseOrder || "N/A"}
                              </span>
                            </div>
                      </td>
                          <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                        {doc.supplierName || "N/A"}
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
                                ? t("allSignatures.approved")
                                : displayStatus === "rejected"
                                ? t("allSignatures.rejected")
                                : t("allSignatures.pending")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {doc.signers.map((signer, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 p-2 rounded-lg"
                                  style={{ backgroundColor: 'var(--border-color)' }}
                                >
                                {signer.signatureUrl ? (
                                  <img
                                    src={signer.signatureUrl}
                                    alt={t("allSignatures.signature")}
                                      className="w-10 h-10 object-contain rounded cursor-pointer hover:scale-125 transition-all"
                                      style={{ backgroundColor: 'white' }}
                                    onClick={() =>
                                      openModal(
                                        <img
                                          src={signer.signatureUrl}
                                          alt={t("allSignatures.signature")}
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
                                  {signer.name || t("allSignatures.unknown")}
                                </p>
                                    <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                                      {signer.hasSigned ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                          <CheckCircle size={10} />
                                          {t("allSignatures.signed")}
                                        </span>
                                      ) : (
                                        <span className="text-yellow-600 flex items-center gap-1">
                                          <Clock size={10} />
                                          {t("allSignatures.pending")}
                                        </span>
                                      )}
                                </p>
                              </div>
                                </div>
                          ))}
                            </div>
                      </td>
                          <td className="px-4 py-4">
                        {doc.summeryProcurement ? (
                          <button
                            onClick={() =>
                              openModal(
                                <iframe
                                  src={doc.summeryProcurement}
                                  title={t("allSignatures.documentViewer")}
                                      className="w-full h-[500px] rounded-lg"
                                ></iframe>
                              )
                            }
                                className="px-3 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-2"
                                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          >
                                <Eye size={16} />
                            {t("allSignatures.viewDocument")}
                          </button>
                        ) : (
                              <span style={{ color: 'var(--color-secondary)' }}>
                                {t("allSignatures.no_document")}
                              </span>
                        )}
                      </td>
                          <td className="px-4 py-4">
                            <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                        {doc.status || t("allSignatures.n_a")}
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
          ) : (
            <motion.div
              key="budget"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-2xl shadow-lg border overflow-hidden"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.budgetItem")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.startDate")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.endDate")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.amount")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.signers")}
                  </th>
                      <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                    {t("allSignatures.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {budgetSignatures.length === 0 ? (
                  <tr>
                        <td colSpan="6" className="px-4 py-16 text-center">
                          <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                          <p style={{ color: 'var(--color-secondary)' }}>
                      {t("allSignatures.no_budget_signatures_found")}
                          </p>
                    </td>
                  </tr>
                ) : (
                      budgetSignatures.map((budget, index) => {
                        // Check if all signers have signed
                        const allSigned = budget.signers && budget.signers.length > 0 && budget.signers.every(s => s.hasSigned);
                        const displayStatus = allSigned ? "approved" : (budget.status || "pending");
                        
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
                              <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
                              <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                                {budget.departmentOrProjectName || t("allSignatures.n_a")}
                              </span>
                            </div>
                      </td>
                          <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                            {budget.startDate
                              ? new Date(budget.startDate).toLocaleDateString()
                          : t("allSignatures.n_a")}
                      </td>
                          <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                            {budget.endDate
                              ? new Date(budget.endDate).toLocaleDateString()
                          : t("allSignatures.n_a")}
                      </td>
                          <td className="px-4 py-4">
                            <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                              {budget.amount ? `${budget.amount} ₪` : t("allSignatures.n_a")}
                            </span>
                      </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {budget.signers?.map((signer, i) => (
                                <div
                              key={i}
                                  className="flex items-center gap-2 p-2 rounded-lg"
                                  style={{ backgroundColor: 'var(--border-color)' }}
                            >
                                {signer.signatureUrl ? (
                                  <img
                                    src={signer.signatureUrl}
                                    alt={t("allSignatures.signature")}
                                      className="w-10 h-10 object-contain rounded cursor-pointer hover:scale-125 transition-all"
                                      style={{ backgroundColor: 'white' }}
                                    onClick={() =>
                                      openModal(
                                        <img
                                          src={signer.signatureUrl}
                                          alt={t("allSignatures.signature")}
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
                                  {signer.name || t("allSignatures.unknown")}
                                </p>
                                    <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                                      {signer.hasSigned ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                          <CheckCircle size={10} />
                                          {t("allSignatures.signed")}
                                        </span>
                                      ) : (
                                        <span className="text-yellow-600 flex items-center gap-1">
                                          <Clock size={10} />
                                          {t("allSignatures.pending")}
                                        </span>
                                      )}
                                </p>
                              </div>
                                </div>
                          ))}
                            </div>
                      </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                displayStatus === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : displayStatus === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : displayStatus === "draft"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {displayStatus === "approved" 
                                ? t("allSignatures.approved")
                                : displayStatus === "rejected"
                                ? t("allSignatures.rejected")
                                : displayStatus === "draft"
                                ? t("allSignatures.draft")
                                : displayStatus || t("allSignatures.n_a")}
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
          )}
        </AnimatePresence>

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

export default AllSignatures;
