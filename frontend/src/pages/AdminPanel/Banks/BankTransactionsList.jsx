import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Plus,
  Upload,
  RefreshCw,
  DollarSign,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

const BankTransactionsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["bank-transactions", id, startDate, endDate],
    queryFn: async () => {
      const params = { bankAccountId: id };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axiosInstance.get("/banks/transactions", { params });
      return res.data.data || [];
    },
    enabled: !!id,
  });

  const reconcileMutation = useMutation({
    mutationFn: async (transactionIds) => {
      await axiosInstance.post("/banks/transactions/reconcile", {
        bankAccountId: id,
        transactionIds,
      });
    },
    onSuccess: () => {
      toast.success(t("banks.transactions_reconciled") || "Transactions reconciled successfully");
      queryClient.invalidateQueries(["bank-transactions"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to reconcile transactions");
    },
  });

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || transaction.reconciliationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      Unreconciled: "bg-yellow-100 text-yellow-800",
      Reconciled: "bg-green-100 text-green-800",
      Cleared: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
            {t("banks.transactions") || "Bank Transactions"}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/dashboard/banks/accounts/${id}/transactions/add`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              {t("banks.add_transaction") || "Add Transaction"}
            </button>
            <button
              onClick={() => navigate(`/dashboard/banks/accounts/${id}/transactions/import`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Upload size={20} />
              {t("banks.import") || "Import"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t("banks.search_transactions") || "Search transactions..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border rounded-lg"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border rounded-lg"
              placeholder="End Date"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">{t("banks.all_statuses") || "All Statuses"}</option>
              <option value="Unreconciled">Unreconciled</option>
              <option value="Reconciled">Reconciled</option>
              <option value="Cleared">Cleared</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">{t("banks.date") || "Date"}</th>
                    <th className="text-left p-3">{t("banks.description") || "Description"}</th>
                    <th className="text-left p-3">{t("banks.reference") || "Reference"}</th>
                    <th className="text-left p-3">{t("banks.type") || "Type"}</th>
                    <th className="text-left p-3">{t("banks.amount") || "Amount"}</th>
                    <th className="text-left p-3">{t("banks.status") || "Status"}</th>
                    <th className="text-left p-3">{t("banks.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <motion.tr
                      key={transaction._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3">
                        {transaction.transactionDate
                          ? new Date(transaction.transactionDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3">{transaction.description}</td>
                      <td className="p-3 font-mono text-sm">{transaction.reference || "-"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            transaction.transactionType === "Credit"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            transaction.amount >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
                          }
                        >
                          {transaction.amount >= 0 ? "+" : ""}
                          {transaction.amount?.toLocaleString()} {transaction.currency}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(transaction.reconciliationStatus)}`}>
                          {transaction.reconciliationStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            if (transaction.reconciliationStatus === "Unreconciled") {
                              reconcileMutation.mutate([transaction._id]);
                            }
                          }}
                          disabled={transaction.reconciliationStatus !== "Unreconciled"}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankTransactionsList;

