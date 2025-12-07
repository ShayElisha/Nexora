import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Upload,
  RefreshCw,
  Loader2,
  AlertCircle,
  CreditCard,
  Hash,
  ArrowRight,
} from "lucide-react";

const BankAccountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/banks/accounts");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/banks/accounts/${id}`);
    },
    onSuccess: () => {
      toast.success(t("accounting.account_deleted"));
      queryClient.invalidateQueries(["bank-accounts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("accounting.operation_failed"));
    },
  });

  const filteredAccounts = bankAccounts.filter((account) =>
    account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <CreditCard size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("accounting.bank_accounts")}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("accounting.bank_accounts")}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/banks/accounts/add")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              <Plus size={20} />
              {t("accounting.add_bank_account")}
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
          <div className="mb-6">
            <div className="flex-1 relative">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredAccounts.map((account, index) => (
                  <motion.div
                    key={account._id}
                    className="rounded-2xl shadow-lg border overflow-hidden flex flex-col cursor-pointer transition-all hover:scale-105"
                    style={{
                      backgroundColor: "var(--bg-color)",
                      borderColor: "var(--border-color)",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/dashboard/banks/accounts/${account._id}`)}
                  >
                    <div className="p-5 border-b" style={{ borderColor: "var(--border-color)" }}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                          >
                            <Building2 size={24} style={{ color: "var(--color-primary)" }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg" style={{ color: "var(--text-color)" }}>
                              {account.accountName}
                            </h3>
                            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                              {account.bankName}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/banks/accounts/${account._id}/edit`);
                            }}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{
                              backgroundColor: "rgba(59, 130, 246, 0.1)",
                              color: "var(--color-primary)",
                            }}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                      </div>
                    </div>
                    <div className="p-5 flex-grow space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: "var(--color-secondary)" }}>
                          {t("accounting.account_number")}:
                        </span>
                        <span className="font-mono font-bold" style={{ color: "var(--text-color)" }}>
                          {account.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: "var(--color-secondary)" }}>
                          {t("accounting.current_balance")}:
                        </span>
                        <span
                          className="font-bold text-lg"
                          style={{
                            color: account.currentBalance >= 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {account.currentBalance?.toLocaleString()} {account.currency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: "var(--color-secondary)" }}>
                          {t("accounting.reconciled_balance")}:
                        </span>
                        <span className="font-medium" style={{ color: "var(--text-color)" }}>
                          {account.reconciledBalance?.toLocaleString()} {account.currency}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/banks/accounts/${account._id}/transactions`);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105"
                        style={{
                          backgroundColor: "var(--border-color)",
                          color: "var(--text-color)",
                        }}
                      >
                        {t("accounting.view_transactions")}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BankAccountList;

