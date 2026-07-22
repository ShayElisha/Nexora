import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Plus,
  AlertCircle,
  Loader2,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Send,
  DollarSign,
} from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "Draft":
      return "bg-[var(--bg-secondary)] text-[var(--text-color)] border-[var(--border-color)]";
    case "Sent":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Paid":
      return "bg-green-100 text-green-700 border-green-300";
    case "Overdue":
      return "bg-red-100 text-red-700 border-red-300";
    case "Cancelled":
      return "bg-[var(--bg-secondary)] text-[var(--text-color)] border-[var(--border-color)]";
    default:
      return "bg-[var(--bg-secondary)] text-[var(--text-color)] border-[var(--border-color)]";
  }
};

const InvoicesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 12;

  // Fetch invoices
  const {
    data: invoicesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["invoices", filterStatus, currentPage],
    queryFn: async () => {
      const res = await axiosInstance.get("/invoices", {
        params: {
          status: filterStatus !== "all" ? filterStatus : undefined,
          page: currentPage,
          limit: invoicesPerPage,
        },
      });
      return res.data;
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || t("invoices.failedToFetchInvoices")
      );
    },
  });

  // Fetch invoice statistics
  const { data: stats } = useQuery({
    queryKey: ["invoiceStats"],
    queryFn: async () => {
      const res = await axiosInstance.get("/invoices/stats");
      return res.data.data;
    },
  });

  // Mark as sent mutation
  const markAsSentMutation = useMutation({
    mutationFn: async (invoiceId) => {
      await axiosInstance.put(`/invoices/${invoiceId}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      queryClient.invalidateQueries(["invoiceStats"]);
      toast.success(t("invoices.markedAsSent"));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("invoices.failedToUpdate"));
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      await axiosInstance.delete(`/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      queryClient.invalidateQueries(["invoiceStats"]);
      toast.success(t("invoices.deleted"));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("invoices.failedToDelete"));
    },
  });

  const invoices = invoicesData?.data || [];
  const pagination = invoicesData?.pagination || {};

  // Filtering by search term
  const filteredInvoices = invoices.filter((invoice) => {
    const term = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber?.toLowerCase().includes(term) ||
      invoice.customerId?.name?.toLowerCase().includes(term) ||
      invoice.customerId?.email?.toLowerCase().includes(term)
    );
  });

  const handleDelete = (invoiceId) => {
    if (window.confirm(t("invoices.confirmDelete"))) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  };

  const handleDownloadPDF = (invoiceId) => {
    window.open(`${axiosInstance.defaults.baseURL}/invoices/${invoiceId}/pdf`, "_blank");
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2
            className="animate-spin"
            size={48}
            style={{ color: "var(--color-primary)" }}
          />
          <p style={{ color: "var(--text-color)" }}>
            {t("invoices.loading")}
          </p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {error?.message || t("invoices.failedToLoadInvoices")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1
                className="text-4xl font-bold"
                style={{ color: "var(--text-color)" }}
              >
                {t("invoices.title")}
              </h1>
              <p
                className="text-lg mt-1"
                style={{ color: "var(--color-secondary)" }}
              >
                {t("invoices.subtitle")}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard/invoices/create")}
            className="flex items-center gap-2 px-6 h-11 rounded-lg font-medium"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--button-text)",
            }}
          >
            <Plus size={20} />
            {t("invoices.createInvoice")}
          </motion.button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 shadow-lg border"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <p
                className="text-sm"
                style={{ color: "var(--color-secondary)" }}
              >
                {t("invoices.total")}
              </p>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6 shadow-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]"
            >
              <p className="text-sm text-[var(--text-color)]">{t("invoices.draft")}</p>
              <p className="text-2xl font-bold text-[var(--text-color)]">
                {stats.draft || 0}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 shadow-lg border border-blue-300 bg-blue-50"
            >
              <p className="text-sm text-blue-700">{t("invoices.sent")}</p>
              <p className="text-2xl font-bold text-blue-700">
                {stats.sent || 0}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6 shadow-lg border border-green-300 bg-green-50"
            >
              <p className="text-sm text-green-700">{t("invoices.paid")}</p>
              <p className="text-2xl font-bold text-green-700">
                {stats.paid || 0}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6 shadow-lg border border-red-300 bg-red-50"
            >
              <p className="text-sm text-red-700">{t("invoices.overdue")}</p>
              <p className="text-2xl font-bold text-red-700">
                {stats.overdue || 0}
              </p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div
          className="mb-6 rounded-2xl p-6 shadow-lg border"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} />
            <span className="font-semibold">{t("invoices.filters")}:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute start-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-secondary)" }}
                size={20}
              />
              <input
                type="text"
                placeholder={t("invoices.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 ps-10 pe-4 rounded-xl border"
                style={{
                  backgroundColor: "var(--bg-color)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 px-4 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("invoices.allStatus")}</option>
              <option value="Draft">{t("invoices.draft")}</option>
              <option value="Sent">{t("invoices.sent")}</option>
              <option value="Paid">{t("invoices.paid")}</option>
              <option value="Overdue">{t("invoices.overdue")}</option>
              <option value="Cancelled">{t("invoices.cancelled")}</option>
            </select>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText
              size={64}
              className="mx-auto mb-4"
              style={{ color: "var(--color-secondary)" }}
            />
            <p
              className="text-lg"
              style={{ color: "var(--color-secondary)" }}
            >
              {t("invoices.noInvoicesFound")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredInvoices.map((invoice) => (
              <motion.div
                key={invoice._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl p-6 shadow-lg border cursor-pointer transition-all"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText
                        size={24}
                        style={{ color: "var(--color-primary)" }}
                      />
                      <h3 className="text-lg font-semibold">
                        {invoice.invoiceNumber}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {t(`invoices.status.${invoice.status.toLowerCase()}`)}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-4 text-sm mb-2"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      <span>
                        {t("invoices.customer")}:{" "}
                        {invoice.customerId?.name || t("invoices.noCustomer")}
                      </span>
                      <span>
                        {t("invoices.issueDate")}:{" "}
                        {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                      </span>
                      <span>
                        {t("invoices.dueDate")}:{" "}
                        {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 font-semibold">
                        <DollarSign size={16} />
                        {invoice.totalAmount.toFixed(2)} {invoice.currency}
                      </span>
                      {invoice.paidAmount > 0 && (
                        <span className="text-green-600">
                          {t("invoices.paid")}: {invoice.paidAmount.toFixed(2)}{" "}
                          {invoice.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ms-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/invoices/${invoice._id}`);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title={t("invoices.view")}
                    >
                      <Eye size={20} />
                    </motion.button>
                    {invoice.status === "Draft" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/invoices/${invoice._id}/edit`);
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                        title={t("invoices.edit")}
                      >
                        <Edit size={20} />
                      </motion.button>
                    )}
                    {invoice.status === "Draft" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsSentMutation.mutate(invoice._id);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title={t("invoices.send")}
                      >
                        <Send size={20} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(invoice._id);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      title={t("invoices.downloadPDF")}
                    >
                      <Download size={20} />
                    </motion.button>
                    {invoice.status === "Draft" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(invoice._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t("invoices.delete")}
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border disabled:opacity-50"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              {t("invoices.previous")}
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page ? "" : "border"
                  }`}
                  style={
                    currentPage !== page
                      ? {
                          backgroundColor: "var(--surface-color)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-color)",
                        }
                      : {
                          backgroundColor: "var(--color-primary)",
                          color: "var(--button-text)",
                        }
                  }
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 rounded-lg border disabled:opacity-50"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              {t("invoices.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesList;

