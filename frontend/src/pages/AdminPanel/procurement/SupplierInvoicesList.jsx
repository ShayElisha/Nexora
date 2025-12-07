import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Truck,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
} from "lucide-react";

const SupplierInvoicesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: invoices = [], isLoading, isError } = useQuery({
    queryKey: ["supplier-invoices"],
    queryFn: async () => {
      const res = await axiosInstance.get("/procurement-advanced/supplier-invoices");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/procurement-advanced/supplier-invoices/${id}`);
    },
    onSuccess: () => {
      toast.success(t("procurement.invoice_deleted") || "Invoice deleted successfully");
      queryClient.invalidateQueries(["supplier-invoices"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete invoice");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.post(`/procurement-advanced/supplier-invoices/${id}/send-email`);
    },
    onSuccess: () => {
      toast.success(t("procurement.invoice_sent") || "Invoice sent successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send invoice");
    },
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierInvoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      "Partially Paid": "bg-blue-100 text-blue-800",
      Paid: "bg-green-100 text-green-800",
      Overdue: "bg-red-100 text-red-800",
      Disputed: "bg-orange-100 text-orange-800",
      Cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("procurement.loading") || "Loading..."}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("procurement.error_loading_invoices") || "Error loading invoices"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.supplier_invoices") || "Supplier Invoices"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("procurement.supplier_invoices_description") || "Manage and track supplier invoices"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/procurement/supplier-invoices/add")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("procurement.add_invoice") || "Add Invoice"}
          </button>
        </div>

        <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("procurement.search_invoices") || "Search invoices..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_statuses") || "All Statuses"}</option>
              <option value="Pending">{t("procurement.pending") || "Pending"}</option>
              <option value="Partially Paid">{t("procurement.partially_paid") || "Partially Paid"}</option>
              <option value="Paid">{t("procurement.paid") || "Paid"}</option>
              <option value="Overdue">{t("procurement.overdue") || "Overdue"}</option>
              <option value="Disputed">{t("procurement.disputed") || "Disputed"}</option>
            </select>
            </div>
          </div>
          {filteredInvoices.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <FileText size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t("procurement.no_invoices") || "No invoices found"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.invoice_number") || "Invoice #"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.supplier") || "Supplier"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.invoice_date") || "Invoice Date"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.due_date") || "Due Date"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.total_amount") || "Total Amount"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.paid") || "Paid"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.remaining") || "Remaining"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.status") || "Status"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <motion.tr
                      key={invoice._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3 font-mono" style={{ color: 'var(--text-color)' }}>
                        {invoice.invoiceNumber}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        <div className="flex items-center gap-2">
                          <Truck size={16} />
                          {invoice.supplierName}
                        </div>
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            invoice.dueDate && new Date(invoice.dueDate) < new Date()
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                          style={{ color: invoice.dueDate && new Date(invoice.dueDate) < new Date() ? undefined : 'var(--text-color)' }}
                        >
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      <td className="p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                        {invoice.totalAmount?.toLocaleString()} {invoice.currency || "USD"}
                      </td>
                      <td className="p-3 text-green-600">
                        {invoice.totalPaid?.toLocaleString()} {invoice.currency || "USD"}
                      </td>
                      <td className="p-3 text-red-600">
                        {invoice.remainingAmount?.toLocaleString()} {invoice.currency || "USD"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/procurement/supplier-invoices/add`, { state: { invoiceData: invoice } })}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                            title={t("procurement.edit") || "Edit"}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t("procurement.confirm_send_email") || "Send invoice to supplier?")) {
                                sendEmailMutation.mutate(invoice._id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                            title={t("procurement.send_email") || "Send Email"}
                            disabled={sendEmailMutation.isLoading}
                          >
                            <Mail size={18} />
                          </button>
                          <button
                            onClick={() => {
                              const confirmMessage = t("procurement.confirm_delete") || "Are you sure you want to delete this invoice?";
                              if (window.confirm(confirmMessage)) {
                                deleteMutation.mutate(invoice._id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title={t("procurement.delete") || "Delete"}
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SupplierInvoicesList;

