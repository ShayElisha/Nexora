import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Building2,
  Loader2,
  AlertCircle,
  Hash,
  Type,
} from "lucide-react";

const AccountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/accounting/accounts");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/accounting/accounts/${id}`);
    },
    onSuccess: () => {
      toast.success(t("accounting.account_deleted") || "Account deleted successfully");
      queryClient.invalidateQueries(["accounts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete account");
    },
  });

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || account.accountType === filterType;
    return matchesSearch && matchesFilter;
  });

  const accountTypes = [
    { value: "Asset", label: t("accounting.account_types.asset") },
    { value: "Liability", label: t("accounting.account_types.liability") },
    { value: "Equity", label: t("accounting.account_types.equity") },
    { value: "Revenue", label: t("accounting.account_types.revenue") },
    { value: "Expense", label: t("accounting.account_types.expense") },
    { value: "Cost of Goods Sold", label: t("accounting.account_types.cost_of_goods_sold") },
    { value: "Other Income", label: t("accounting.account_types.other_income") },
    { value: "Other Expense", label: t("accounting.account_types.other_expense") },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Building2 size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("accounting.accounts")}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("accounting.accounts")}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/accounting/accounts/add")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              <Plus size={20} />
              {t("accounting.add_account")}
            </button>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl shadow-lg border p-6 mb-6"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                size={20}
                style={{ color: "var(--color-secondary)" }}
              />
              <input
                type="text"
                placeholder={t("accounting.search_accounts")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("accounting.all_types")}</option>
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="animate-spin mx-auto mb-4" size={48} style={{ color: "var(--color-primary)" }} />
              <p style={{ color: "var(--text-color)" }}>{t("accounting.loading")}</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
              <p className="text-xl" style={{ color: "var(--color-secondary)" }}>
                {t("accounting.no_accounts")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                    <th className="text-left p-4 font-bold" style={{ color: "var(--text-color)" }}>
                      {t("accounting.account_number")}
                    </th>
                    <th className="text-left p-4 font-bold" style={{ color: "var(--text-color)" }}>
                      {t("accounting.account_name")}
                    </th>
                    <th className="text-left p-4 font-bold" style={{ color: "var(--text-color)" }}>
                      {t("accounting.type")}
                    </th>
                    <th className="text-left p-4 font-bold" style={{ color: "var(--text-color)" }}>
                      {t("accounting.balance")}
                    </th>
                    <th className="text-left p-4 font-bold" style={{ color: "var(--text-color)" }}>
                      {t("accounting.currency")}
                    </th>
                    <th className="text-left p-4 font-bold" style={{ color: "var(--text-color)" }}>
                      {t("accounting.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredAccounts.map((account, index) => (
                      <motion.tr
                        key={account._id}
                        className="border-b hover:bg-opacity-50 transition-colors"
                        style={{ borderColor: "var(--border-color)" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4" style={{ color: "var(--text-color)" }}>
                          {account.accountNumber}
                        </td>
                        <td className="p-4 font-medium" style={{ color: "var(--text-color)" }}>
                          {account.accountName}
                        </td>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-sm font-bold"
                            style={{
                              backgroundColor: "rgba(59, 130, 246, 0.1)",
                              color: "var(--color-primary)",
                            }}
                          >
                            {accountTypes.find((t) => t.value === account.accountType)?.label || account.accountType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className="font-bold"
                            style={{
                              color: account.balance >= 0 ? "#10b981" : "#ef4444",
                            }}
                          >
                            {account.balance?.toLocaleString() || 0} {account.currency}
                          </span>
                        </td>
                        <td className="p-4" style={{ color: "var(--text-color)" }}>
                          {account.currency}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/dashboard/accounting/accounts/${account._id}/edit`)}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                color: "var(--color-primary)",
                              }}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(t("accounting.confirm_delete"))) {
                                  deleteMutation.mutate(account._id);
                                }
                              }}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                color: "#ef4444",
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AccountList;

