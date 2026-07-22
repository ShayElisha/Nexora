import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowLeft,
  Download,
  Edit,
  Send,
  Trash2,
  Loader2,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
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

const InvoiceDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch invoice
  const {
    data: invoice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/invoices/${id}`);
      return res.data.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("invoices.failedToFetch"));
    },
  });

  // Mark as sent mutation
  const markAsSentMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.put(`/invoices/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["invoice", id]);
      queryClient.invalidateQueries(["invoices"]);
      toast.success(t("invoices.markedAsSent"));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("invoices.failedToUpdate"));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      toast.success(t("invoices.deleted"));
      navigate("/dashboard/invoices");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("invoices.failedToDelete"));
    },
  });

  const handleDelete = () => {
    if (window.confirm(t("invoices.confirmDelete"))) {
      deleteMutation.mutate();
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${axiosInstance.defaults.baseURL}/invoices/${id}/pdf`, "_blank");
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <Loader2
          className="animate-spin"
          size={48}
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="text-center">
          <p className="text-red-500 font-medium text-lg">
            {t("invoices.invoiceNotFound")}
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/dashboard/invoices")}
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <ArrowLeft size={20} />
            </motion.button>
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
                {invoice.invoiceNumber}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {t(`invoices.status.${invoice.status.toLowerCase()}`)}
                </span>
                {invoice.paymentStatus && (
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {t("invoices.paymentStatusLabel", { defaultValue: "סטטוס תשלום" })}:{" "}
                    {t(`invoices.paymentStatus.${invoice.paymentStatus.toLowerCase().replace(' ', '')}`)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status === "Draft" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/dashboard/invoices/${id}/edit`)}
                className="flex items-center gap-2 px-4 h-11 rounded-lg border font-medium"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-color)",
                }}
              >
                <Edit size={20} />
                {t("invoices.edit")}
              </motion.button>
            )}
            {invoice.status === "Draft" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => markAsSentMutation.mutate()}
                disabled={markAsSentMutation.isLoading}
                className="flex items-center gap-2 px-4 h-11 rounded-lg font-medium"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--button-text)",
                }}
              >
                {markAsSentMutation.isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
                {t("invoices.send")}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 h-11 rounded-lg border font-medium"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <Download size={20} />
              {t("invoices.downloadPDF")}
            </motion.button>
            {invoice.status === "Draft" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="flex items-center gap-2 px-4 h-11 rounded-lg font-medium text-white bg-red-600"
              >
                {deleteMutation.isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Trash2 size={20} />
                )}
                {t("invoices.delete")}
              </motion.button>
            )}
          </div>
        </div>

        {/* Invoice Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Company Info */}
          <div
            className="rounded-2xl p-6 shadow-lg border"
            style={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">
              {t("invoices.from")}
            </h2>
            <div className="space-y-2">
              <p className="font-semibold">
                {invoice.companyId?.name || "Company Name"}
              </p>
              {invoice.companyId?.email && <p>{invoice.companyId.email}</p>}
              {invoice.companyId?.phone && <p>{invoice.companyId.phone}</p>}
              {invoice.companyId?.address && (
                <div>
                  {invoice.companyId.address.street && (
                    <p>{invoice.companyId.address.street}</p>
                  )}
                  <p>
                    {invoice.companyId.address.city}
                    {invoice.companyId.address.state &&
                      `, ${invoice.companyId.address.state}`}
                    {invoice.companyId.address.postalCode &&
                      ` ${invoice.companyId.address.postalCode}`}
                  </p>
                  {invoice.companyId.address.country && (
                    <p>{invoice.companyId.address.country}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div
            className="rounded-2xl p-6 shadow-lg border"
            style={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">{t("invoices.to")}</h2>
            {invoice.customerId ? (
              <div className="space-y-2">
                <p className="font-semibold">{invoice.customerId.name}</p>
                {invoice.customerId.email && <p>{invoice.customerId.email}</p>}
                {invoice.customerId.phone && <p>{invoice.customerId.phone}</p>}
                {invoice.customerId.address && (
                  <p>{invoice.customerId.address}</p>
                )}
              </div>
            ) : (
              <p style={{ color: "var(--color-secondary)" }}>
                {t("invoices.noCustomer")}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Dates */}
        <div
          className="rounded-2xl p-6 shadow-lg border mb-6"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={20} style={{ color: "var(--color-secondary)" }} />
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {t("invoices.issueDate")}
                </p>
                <p className="font-semibold">
                  {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={20} style={{ color: "var(--color-secondary)" }} />
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {t("invoices.dueDate")}
                </p>
                <p className="font-semibold">
                  {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            {invoice.paymentTerms && (
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={20}
                  style={{ color: "var(--color-secondary)" }}
                />
                <div>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {t("invoices.paymentTerms")}
                  </p>
                  <p className="font-semibold">{invoice.paymentTerms}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div
          className="rounded-2xl p-6 shadow-lg border mb-6"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
        >
          <h2 className="text-lg font-semibold mb-4">{t("invoices.items")}</h2>
          <div
            className="overflow-x-auto rounded-2xl border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--bg-secondary)" }}>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <th className="text-left py-3 px-4">{t("invoices.description")}</th>
                  <th className="text-right py-3 px-4">{t("invoices.quantity")}</th>
                  <th className="text-right py-3 px-4">{t("invoices.unitPrice")}</th>
                  <th className="text-right py-3 px-4">{t("invoices.discount")}</th>
                  <th className="text-right py-3 px-4">{t("invoices.total")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="text-right py-3 px-4">{item.quantity}</td>
                    <td className="text-right py-3 px-4">
                      {invoice.currency} {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {item.discount > 0 ? `${item.discount}%` : "-"}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {invoice.currency} {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div
            className="rounded-2xl p-6 shadow-lg border w-full md:w-96"
            style={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>{t("invoices.subtotal")}:</span>
                <span className="font-semibold">
                  {invoice.currency} {invoice.subtotal.toFixed(2)}
                </span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t("invoices.discount")}:</span>
                  <span className="font-semibold">
                    -{invoice.currency} {invoice.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>
                    {t("invoices.tax")} ({invoice.taxRate}%):
                  </span>
                  <span className="font-semibold">
                    {invoice.currency} {invoice.taxAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between text-lg font-bold pt-3 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <span>{t("invoices.total")}:</span>
                <span>
                  {invoice.currency} {invoice.totalAmount.toFixed(2)}
                </span>
              </div>
              {invoice.paidAmount > 0 && (
                <>
                  <div
                    className="flex justify-between text-green-600 pt-3 border-t"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <span>{t("invoices.paid")}:</span>
                    <span className="font-semibold">
                      {invoice.currency} {invoice.paidAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t("invoices.balance")}:</span>
                    <span>
                      {invoice.currency}{" "}
                      {(invoice.totalAmount - invoice.paidAmount).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div
            className="rounded-2xl p-6 shadow-lg border mb-6"
            style={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2 className="text-lg font-semibold mb-2">{t("invoices.notes")}</h2>
            <p
              className="whitespace-pre-wrap"
              style={{ color: "var(--color-secondary)" }}
            >
              {invoice.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;

