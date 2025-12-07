import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Save,
  X,
  Loader2,
  Building2,
  Hash,
  Type,
  FolderTree,
  DollarSign,
  FileText,
  Receipt,
  AlertCircle,
} from "lucide-react";

const AddAccount = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    accountNumber: "",
    accountName: "",
    accountType: "Asset",
    parentAccount: "",
    currency: "ILS",
    description: "",
    taxCategory: "Taxable",
    notes: "",
  });

  const { data: account, isLoading: isLoadingAccount, error: accountError } = useQuery({
    queryKey: ["account", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/accounting/accounts/${id}`);
      return res.data.data;
    },
    enabled: isEdit && !!id,
    retry: 1,
  });

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/accounting/accounts");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (account && isEdit) {
      setFormData({
        accountNumber: account.accountNumber || "",
        accountName: account.accountName || "",
        accountType: account.accountType || "Asset",
        parentAccount: account.parentAccount?._id || account.parentAccount || "",
        currency: account.currency || "ILS",
        description: account.description || "",
        taxCategory: account.taxCategory || "Taxable",
        notes: account.notes || "",
      });
    }
  }, [account, isEdit]);

  // Show error if account fetch failed
  useEffect(() => {
    if (accountError && isEdit) {
      toast.error(accountError.response?.data?.message || "Failed to load account");
      navigate("/dashboard/accounting/accounts");
    }
  }, [accountError, isEdit, navigate]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/accounting/accounts/${id}`, data);
      }
      return axiosInstance.post("/accounting/accounts", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("accounting.account_updated") || "Account updated successfully"
          : t("accounting.account_created") || "Account created successfully"
      );
      queryClient.invalidateQueries(["accounts"]);
      navigate("/dashboard/accounting/accounts");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

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

  const taxCategories = [
    { value: "Taxable", label: t("accounting.tax_categories.taxable") },
    { value: "Non-Taxable", label: t("accounting.tax_categories.non_taxable") },
    { value: "Exempt", label: t("accounting.tax_categories.exempt") },
    { value: "Reverse Charge", label: t("accounting.tax_categories.reverse_charge") },
  ];

  const currencies = [
    { value: "ILS", label: t("accounting.currencies.ils") },
    { value: "USD", label: t("accounting.currencies.usd") },
    { value: "EUR", label: t("accounting.currencies.eur") },
  ];

  // Show loading state while fetching account data
  if (isEdit && isLoadingAccount) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: "var(--color-primary)" }} />
          <p className="text-xl" style={{ color: "var(--text-color)" }}>
            {t("accounting.loading")}
          </p>
        </div>
      </div>
    );
  }

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
              <Building2 size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {isEdit ? t("accounting.edit_account") : t("accounting.add_account")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {isEdit ? t("accounting.edit_account") : t("accounting.add_account")}
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
                <Building2 className="inline mr-2" size={16} />
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
                <Type className="inline mr-2" size={16} />
                {t("accounting.account_type")} *
              </label>
              <select
                required
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
                <FolderTree className="inline mr-2" size={16} />
                {t("accounting.parent_account")}
              </label>
              <select
                value={formData.parentAccount}
                onChange={(e) => setFormData({ ...formData, parentAccount: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                <option value="">{t("accounting.none")}</option>
                {accounts
                  .filter((acc) => acc._id !== id)
                  .map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountNumber} - {acc.accountName}
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
                <Receipt className="inline mr-2" size={16} />
                {t("accounting.tax_category")}
              </label>
              <select
                value={formData.taxCategory}
                onChange={(e) => setFormData({ ...formData, taxCategory: e.target.value })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                {taxCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
              <FileText className="inline mr-2" size={16} />
              {t("accounting.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              rows={3}
              placeholder={t("accounting.description")}
            />
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
              onClick={() => navigate("/dashboard/accounting/accounts")}
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

export default AddAccount;

