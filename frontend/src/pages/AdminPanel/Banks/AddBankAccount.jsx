import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Save,
  X,
  Loader2,
  CreditCard,
  Building2,
  Hash,
  MapPin,
  Type,
  DollarSign,
  Link as LinkIcon,
  FileText,
  AlertCircle,
} from "lucide-react";

const AddBankAccount = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    branchNumber: "",
    accountType: "Checking",
    currency: "ILS",
    openingBalance: 0,
    accountId: "",
    notes: "",
  });

  const { data: bankAccount } = useQuery({
    queryKey: ["bank-account", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/banks/accounts/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/accounting/accounts");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (bankAccount && isEdit) {
      setFormData({
        accountName: bankAccount.accountName || "",
        bankName: bankAccount.bankName || "",
        accountNumber: bankAccount.accountNumber || "",
        branchNumber: bankAccount.branchNumber || "",
        accountType: bankAccount.accountType || "Checking",
        currency: bankAccount.currency || "ILS",
        openingBalance: bankAccount.openingBalance || 0,
        accountId: bankAccount.accountId?._id || "",
        notes: bankAccount.notes || "",
      });
    }
  }, [bankAccount, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/banks/accounts/${id}`, data);
      }
      return axiosInstance.post("/banks/accounts", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit ? t("accounting.account_updated") : t("accounting.account_created")
      );
      queryClient.invalidateQueries(["bank-accounts"]);
      navigate("/dashboard/banks/accounts");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("accounting.operation_failed"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const accountTypes = [
    { value: "Checking", label: t("accounting.account_types.checking") },
    { value: "Savings", label: t("accounting.account_types.savings") },
    { value: "Credit", label: t("accounting.account_types.credit") },
    { value: "Investment", label: t("accounting.account_types.investment") },
    { value: "Other", label: t("accounting.account_types.other") },
  ];

  const currencies = [
    { value: "ILS", label: t("accounting.currencies.ils") },
    { value: "USD", label: t("accounting.currencies.usd") },
    { value: "EUR", label: t("accounting.currencies.eur") },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <CreditCard size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {isEdit ? t("accounting.edit_bank_account") : t("accounting.add_bank_account")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {isEdit ? t("accounting.edit_bank_account") : t("accounting.add_bank_account")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="rounded-2xl shadow-lg border p-6 sm:p-8"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <CreditCard className="inline mr-2" size={16} />
                {t("accounting.account_name")} *
              </label>
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                placeholder={t("accounting.account_name")}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <Building2 className="inline mr-2" size={16} />
                {t("accounting.bank_name")} *
              </label>
              <input
                type="text"
                required
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                placeholder={t("accounting.bank_name")}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <Hash className="inline mr-2" size={16} />
                {t("accounting.account_number")} *
              </label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                placeholder={t("accounting.account_number")}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <MapPin className="inline mr-2" size={16} />
                {t("accounting.branch_number")}
              </label>
              <input
                type="text"
                value={formData.branchNumber}
                onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                placeholder={t("accounting.branch_number")}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <Type className="inline mr-2" size={16} />
                {t("accounting.account_type")}
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <DollarSign className="inline mr-2" size={16} />
                {t("accounting.currency")}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                {currencies.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <DollarSign className="inline mr-2" size={16} />
                {t("accounting.opening_balance")}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
                placeholder={t("accounting.opening_balance")}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                <LinkIcon className="inline mr-2" size={16} />
                {t("accounting.link_account")}
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                <option value="">{t("accounting.none")}</option>
                {accounts
                  .filter((acc) => acc.accountType === "Asset")
                  .map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountNumber} - {acc.accountName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
              <FileText className="inline mr-2" size={16} />
              {t("accounting.notes")}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              rows={3}
              placeholder={t("accounting.notes")}
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/dashboard/banks/accounts")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <X size={20} />
              {t("accounting.cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {mutation.isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t("accounting.saving")}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {t("accounting.save")}
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AddBankAccount;

