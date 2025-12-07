import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  CreditCard,
  Tag,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  X,
} from "lucide-react";

const Finance = () => {
  const { t } = useTranslation();
  const [financeData, setFinanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const recordsPerPage = 12;

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

  const { mutate: updateFinanceRecord, isLoading: isUpdating } = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put(`/finance/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["finance"]);
      getFinanceData();
      setShowEditModal(false);
      setEditingRecord(null);
      toast.success(t("finance.record_updated") || "Record updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("finance.update_failed") || "Failed to update record");
    },
  });

  useEffect(() => {
    if (isLoggedIn) getFinanceData();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <p className="text-xl font-semibold text-red-500">
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

  // Calculate statistics
  const stats = {
    totalIncome: filteredData
      .filter(d => d.transactionType === "Income")
      .reduce((sum, d) => sum + d.transactionAmount, 0),
    totalExpense: filteredData
      .filter(d => d.transactionType === "Expense")
      .reduce((sum, d) => sum + d.transactionAmount, 0),
    totalTransactions: filteredData.length,
    pending: filteredData.filter(d => d.transactionStatus === "Pending").length,
  };

  stats.netBalance = stats.totalIncome - stats.totalExpense;

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-emerald-600"
            >
              <DollarSign size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("finance.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("finance.manageFinancialRecords")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: t("finance.totalIncome"), 
              value: `${stats.totalIncome.toLocaleString()} ₪`, 
              icon: TrendingUp, 
              color: "#10b981",
              gradient: "from-green-500 to-green-600"
            },
            { 
              label: t("finance.totalExpense"), 
              value: `${stats.totalExpense.toLocaleString()} ₪`, 
              icon: TrendingDown, 
              color: "#ef4444",
              gradient: "from-red-500 to-red-600"
            },
            { 
              label: t("finance.netBalance"), 
              value: `${stats.netBalance.toLocaleString()} ₪`, 
              icon: DollarSign, 
              color: stats.netBalance >= 0 ? "#10b981" : "#ef4444",
              gradient: stats.netBalance >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"
            },
            { 
              label: t("finance.pendingTransactions"), 
              value: stats.pending, 
              icon: Clock, 
              color: "#f59e0b",
              gradient: "from-amber-500 to-amber-600"
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all"
              style={{ 
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)'
              }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} shadow-lg`}
                >
                  <stat.icon size={24} color="white" />
                </div>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <motion.div
          className="mb-8 rounded-2xl shadow-lg p-6 border"
          style={{ 
            backgroundColor: 'var(--bg-color)',
            borderColor: 'var(--border-color)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder={t("finance.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--color-secondary)' }} />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                style={{ 
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              >
                <option value="">{t("finance.sort_by")}</option>
                <option value="transactionDate_desc">{t("finance.sort_date_desc")}</option>
                <option value="transactionDate_asc">{t("finance.sort_date_asc")}</option>
                <option value="transactionAmount_desc">{t("finance.sort_amount_desc")}</option>
                <option value="transactionAmount_asc">{t("finance.sort_amount_asc")}</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex gap-2">
              {["all", "completed", "pending", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterOption(status)}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    filterOption === status 
                      ? 'shadow-lg scale-105' 
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: filterOption === status ? 'var(--color-primary)' : 'var(--border-color)',
                    color: filterOption === status ? 'var(--button-text)' : 'var(--text-color)'
                  }}
                >
                  {t(`finance.${status}`)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => getFinanceData()}
            className="mt-4 w-full md:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 shadow-lg"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--button-text)'
            }}
          >
            <RefreshCw size={20} />
            {t("buttons.refresh")}
          </button>
        </motion.div>

        {/* Finance Records */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              className="w-16 h-16 border-4 border-t-4 rounded-full"
              style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>
        ) : isError ? (
          <div className="text-center py-16 rounded-2xl shadow-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
            <XCircle size={64} className="mx-auto mb-4 text-red-500" />
            <p className="text-xl font-semibold text-red-500">
              {t("errors.loading_error")}: {error?.message}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {currentRecords.map((doc, index) => (
                <motion.div
                  key={doc._id}
                  variants={cardVariant}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl shadow-lg overflow-hidden border hover:shadow-xl transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)'
                  }}
                  onClick={() => handleRowClick(doc._id)}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Type Icon */}
                      <div className="lg:col-span-1 flex justify-center">
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            doc.transactionType === "Income" 
                              ? 'bg-green-100' 
                              : 'bg-red-100'
                          }`}
                        >
                          {doc.transactionType === "Income" ? (
                            <TrendingUp size={24} className="text-green-600" />
                          ) : (
                            <TrendingDown size={24} className="text-red-600" />
                          )}
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="lg:col-span-3">
                        <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-color)' }}>
                          {doc.invoiceNumber || t("finance.no_invoice")}
                        </p>
                        <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                          <Calendar size={14} />
                          {new Date(doc.transactionDate).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Category */}
                      <div className="lg:col-span-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2" style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--button-text)',
                          opacity: 0.9
                        }}>
                          <Tag size={14} />
                          {doc.category}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="lg:col-span-3 text-center">
                        <p className={`text-2xl font-bold ${
                          doc.transactionType === "Income" ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {doc.transactionAmount.toLocaleString()} {doc.transactionCurrency}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                          {t(`finance.transaction_types.${doc.transactionType?.toLowerCase()}`)}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="lg:col-span-2">
                        <span className={`px-3 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${
                          doc.transactionStatus === "Completed" 
                            ? 'bg-green-100 text-green-700' 
                            : doc.transactionStatus === "Pending"
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {doc.transactionStatus === "Completed" ? <CheckCircle size={16} /> :
                           doc.transactionStatus === "Pending" ? <Clock size={16} /> :
                           <XCircle size={16} />}
                          {t(`finance.${doc.transactionStatus?.toLowerCase()}`)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-1 flex gap-2 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentsClick(doc.attachmentURL || []);
                          }}
                          className="p-2 rounded-lg hover:scale-110 transition-all"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          title={t("finance.view_documents")}
                        >
                          <FileText size={20} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRecord(doc);
                            setShowEditModal(true);
                          }}
                          className="p-2 rounded-lg hover:scale-110 transition-all"
                          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                          title={t("finance.edit_record") || "Edit Record"}
                        >
                          <Edit size={20} />
                        </button>
                        {expandedRow === doc._id ? (
                          <ChevronUp size={24} style={{ color: 'var(--color-primary)' }} />
                        ) : (
                          <ChevronDown size={24} style={{ color: 'var(--color-primary)' }} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRow === doc._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t p-6"
                      style={{ 
                        backgroundColor: 'var(--bg-color)',
                        borderColor: 'var(--border-color)',
                        opacity: 0.95
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong style={{ color: 'var(--color-primary)' }}>{t("finance.record_type")}:</strong>{" "}
                            <span style={{ color: 'var(--text-color)' }}>{doc.recordType || t("finance.not_available")}</span>
                          </p>
                          <p className="text-sm">
                            <strong style={{ color: 'var(--color-primary)' }}>{t("finance.invoice_number")}:</strong>{" "}
                            <span style={{ color: 'var(--text-color)' }}>{doc.invoiceNumber || t("finance.not_available")}</span>
                          </p>
                          <p className="text-sm">
                            <strong style={{ color: 'var(--color-primary)' }}>{t("finance.payment_terms") || "Payment Terms"}:</strong>{" "}
                            <span style={{ color: 'var(--text-color)' }}>
                              {doc.paymentTerms === "Immediate" ? (t("finance.payment_immediate") || "Immediate Payment") :
                               doc.paymentTerms === "Net 30" ? (t("finance.payment_net_30") || "Net 30 Days") :
                               doc.paymentTerms === "Net 45" ? (t("finance.payment_net_45") || "Net 45 Days") :
                               doc.paymentTerms === "Net 60" ? (t("finance.payment_net_60") || "Net 60 Days") :
                               doc.paymentTerms === "Net 90" ? (t("finance.payment_net_90") || "Net 90 Days") :
                               doc.paymentTerms || t("finance.not_available")}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong style={{ color: 'var(--color-primary)' }}>{t("finance.created_at")}:</strong>{" "}
                            <span style={{ color: 'var(--text-color)' }}>{new Date(doc.createdAt).toLocaleString()}</span>
                          </p>
                          <p className="text-sm">
                            <strong style={{ color: 'var(--color-primary)' }}>{t("finance.updated_at")}:</strong>{" "}
                            <span style={{ color: 'var(--text-color)' }}>{new Date(doc.updatedAt).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredData.length === 0 && (
              <motion.div
                className="text-center py-16 rounded-2xl shadow-lg"
                style={{ backgroundColor: 'var(--bg-color)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CreditCard size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
                <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                  {t("finance.no_data_found")}
                </p>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-color)'
                  }}
                >
                  ←
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === pageNum ? 'shadow-lg scale-110' : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: currentPage === pageNum ? 'var(--color-primary)' : 'var(--border-color)',
                        color: currentPage === pageNum ? 'var(--button-text)' : 'var(--text-color)'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-color)'
                  }}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}

        {/* Documents Modal */}
        {showDocumentsModal && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="rounded-2xl shadow-2xl p-6 max-w-2xl w-full border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <FileText size={28} style={{ color: 'var(--color-primary)' }} />
                  {t("finance.documents_title")}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:scale-110 transition-all"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              {selectedDocuments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedDocuments.map((docUrl, index) => (
                    <motion.a
                      key={index}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl border hover:shadow-lg transition-all"
                      style={{ 
                        backgroundColor: 'var(--bg-color)',
                        borderColor: 'var(--border-color)'
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                          {t("finance.document")} {index + 1}
                        </span>
                      </div>
                    </motion.a>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8" style={{ color: 'var(--color-secondary)' }}>
                  {t("finance.no_documents_found")}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Edit Finance Record Modal */}
        {showEditModal && editingRecord && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-bg rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-color)' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("finance.edit_record") || "Edit Finance Record"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingRecord(null);
                    }}
                    className="p-2 rounded-lg hover:scale-110 transition-all"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateFinanceRecord({
                    id: editingRecord._id,
                    data: {
                      transactionDate: editingRecord.transactionDate ? new Date(editingRecord.transactionDate).toISOString().split('T')[0] : "",
                      transactionType: editingRecord.transactionType,
                      transactionAmount: editingRecord.transactionAmount,
                      transactionCurrency: editingRecord.transactionCurrency,
                      transactionDescription: editingRecord.transactionDescription,
                      category: editingRecord.category,
                      bankAccount: editingRecord.bankAccount,
                      transactionStatus: editingRecord.transactionStatus,
                      invoiceNumber: editingRecord.invoiceNumber,
                      paymentTerms: editingRecord.paymentTerms,
                      otherDetails: editingRecord.otherDetails,
                    },
                  });
                }}
                className="p-6 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("finance.transaction_date")}
                    </label>
                    <input
                      type="date"
                      value={editingRecord.transactionDate ? new Date(editingRecord.transactionDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEditingRecord({ ...editingRecord, transactionDate: e.target.value })}
                      className="w-full p-3 border rounded-xl"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("finance.transaction_type")}
                    </label>
                    <select
                      value={editingRecord.transactionType}
                      onChange={(e) => setEditingRecord({ ...editingRecord, transactionType: e.target.value })}
                      className="w-full p-3 border rounded-xl"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)'
                      }}
                      required
                    >
                      <option value="Income">{t("finance.income")}</option>
                      <option value="Expense">{t("finance.expense")}</option>
                      <option value="Transfer">{t("finance.transfer")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("finance.amount")}
                    </label>
                    <input
                      type="number"
                      value={editingRecord.transactionAmount}
                      onChange={(e) => setEditingRecord({ ...editingRecord, transactionAmount: Number(e.target.value) })}
                      step="0.01"
                      className="w-full p-3 border rounded-xl"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("finance.Category")}
                    </label>
                    <input
                      type="text"
                      value={editingRecord.category}
                      onChange={(e) => setEditingRecord({ ...editingRecord, category: e.target.value })}
                      className="w-full p-3 border rounded-xl"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("finance.Transaction_Status")}
                    </label>
                    <select
                      value={editingRecord.transactionStatus}
                      onChange={(e) => setEditingRecord({ ...editingRecord, transactionStatus: e.target.value })}
                      className="w-full p-3 border rounded-xl"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)'
                      }}
                      required
                    >
                      <option value="Pending">{t("finance.pending")}</option>
                      <option value="Completed">{t("finance.completed")}</option>
                      <option value="Cancelled">{t("finance.cancelled")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("finance.payment_terms") || "Payment Terms"}
                    </label>
                    <select
                      value={editingRecord.paymentTerms || "Net 30"}
                      onChange={(e) => setEditingRecord({ ...editingRecord, paymentTerms: e.target.value })}
                      className="w-full p-3 border rounded-xl"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)'
                      }}
                    >
                      <option value="Immediate">{t("finance.payment_immediate") || "Immediate Payment"}</option>
                      <option value="Net 30">{t("finance.payment_net_30") || "Net 30 Days"}</option>
                      <option value="Net 45">{t("finance.payment_net_45") || "Net 45 Days"}</option>
                      <option value="Net 60">{t("finance.payment_net_60") || "Net 60 Days"}</option>
                      <option value="Net 90">{t("finance.payment_net_90") || "Net 90 Days"}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("finance.Transaction_Description")}
                  </label>
                  <textarea
                    value={editingRecord.transactionDescription || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, transactionDescription: e.target.value })}
                    rows="3"
                    className="w-full p-3 border rounded-xl"
                    style={{ 
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingRecord(null);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                    style={{ 
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-color)'
                    }}
                  >
                    {t("buttons.cancel") || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--button-text)'
                    }}
                  >
                    {isUpdating ? t("finance.updating") || "Updating..." : t("finance.update") || "Update"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Finance;
