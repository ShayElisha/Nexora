import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  Plus,
  Search,
  Edit2,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  Save,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

// Update Budget Modal
const UpdateBudgetModal = ({ budget, onClose }) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    departmentOrProjectName: budget.departmentOrProjectName || "",
    amount: budget.amount || 0,
    currency: budget.currency || "",
    startDate: budget.startDate ? new Date(budget.startDate).toISOString().slice(0, 10) : "",
    endDate: budget.endDate ? new Date(budget.endDate).toISOString().slice(0, 10) : "",
    notes: budget.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.put(`/budget/${budget._id}`, { ...formData, resetSigners: true });
      toast.success(t("finance.budget.updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      onClose();
    } catch (error) {
      toast.error(t("finance.budget.error_updating"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
        onClick={onClose}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      <motion.div
        className="relative rounded-2xl p-6 w-full max-w-lg z-10 shadow-2xl border"
        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("finance.budget.update_budget")}
        </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:scale-110 transition-all"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("finance.budget.department_project_name")}
            </label>
            <input
              type="text"
              name="departmentOrProjectName"
              value={formData.departmentOrProjectName}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("finance.budget.budget_amount")}
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
          </div>
          <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("finance.budget.currency")}
            </label>
            <input
              type="text"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("finance.budget.start_date")}
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("finance.budget.end_date")}
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("finance.budget.notes")}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
          </div>
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
            >
              {t("finance.budget.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? <><motion.div className="w-5 h-5 border-2 border-t-2 border-white rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} /> {t("finance.budget.updating")}</> : <><Save size={20} /> {t("finance.budget.update_budget")}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Main Budgets Component
const Budgets = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBudgetForUpdate, setSelectedBudgetForUpdate] = useState(null);

  const { data: budgets, isLoading, error } = useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const response = await axiosInstance.get(`/budget`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          className="w-16 h-16 border-4 border-t-4 rounded-full"
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-xl font-semibold text-red-500">{t("finance.budget.error")}: {error.message}</p>
        </div>
      </div>
    );
  }

  const filteredBudgets = (budgets || []).filter((budget) => {
    const term = searchTerm.toLowerCase();
    return (
      budget.departmentOrProjectName?.toLowerCase().includes(term) ||
      budget.amount?.toString().includes(term) ||
      budget.currency?.toLowerCase().includes(term) ||
      budget.status?.toLowerCase().includes(term)
    );
  });

  // Calculate statistics
  const stats = {
    totalBudgets: filteredBudgets.length,
    totalAllocated: filteredBudgets.reduce((sum, b) => sum + (b.amount || 0), 0),
    totalSpent: filteredBudgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0),
    pending: filteredBudgets.filter(b => b.status === "draft").length,
  };
  stats.remaining = stats.totalAllocated - stats.totalSpent;

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Wallet size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("finance.budget.budgets_list")}
        </h1>
                <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                  {t("finance.budget.manageBudgets")}
                </p>
              </div>
            </div>
            <Link to="/dashboard/finance/add-budget">
              <button
                className="px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
              >
                <Plus size={20} />
                {t("finance.budget.create_budget")}
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: t("finance.budget.totalBudgets"), value: stats.totalBudgets, icon: Wallet, color: "#3b82f6" },
            { label: t("finance.budget.totalAllocated"), value: `${stats.totalAllocated.toLocaleString()} ₪`, icon: DollarSign, color: "#10b981" },
            { label: t("finance.budget.totalSpent"), value: `${stats.totalSpent.toLocaleString()} ₪`, icon: TrendingDown, color: "#ef4444" },
            { label: t("finance.budget.remaining"), value: `${stats.remaining.toLocaleString()} ₪`, icon: TrendingUp, color: "#f59e0b" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <stat.icon size={24} color={stat.color} />
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

        {/* Search */}
        <motion.div
          className="mb-8 rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--color-secondary)' }} />
          <input
            type="text"
              placeholder={t("finance.budget.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
          />
        </div>
        </motion.div>

        {/* Budgets List */}
        <div className="grid grid-cols-1 gap-4">
              {filteredBudgets.length === 0 ? (
            <motion.div
              className="text-center py-16 rounded-2xl shadow-lg"
              style={{ backgroundColor: 'var(--bg-color)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
              <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                {t("finance.budget.no_budgets_found")}
              </p>
            </motion.div>
          ) : (
            filteredBudgets.map((budget, index) => {
              const spentPercentage = budget.amount > 0 ? ((budget.spentAmount / budget.amount) * 100).toFixed(1) : 0;
              const remaining = budget.amount - budget.spentAmount;

                  return (
                <motion.div
                  key={budget._id}
                  variants={cardVariant}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl shadow-lg overflow-hidden border hover:shadow-xl transition-all"
                  style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Budget Info */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500">
                            <Wallet size={24} color="white" />
                          </div>
                          <div>
                            <p className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                              {budget.departmentOrProjectName}
                            </p>
                            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                              <Calendar size={14} />
                              {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Budget Amount */}
                      <div className="lg:col-span-2 text-center">
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                          {t("finance.budget.allocated")}
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {budget.amount.toLocaleString()} {budget.currency}
                        </p>
                      </div>

                      {/* Spent Amount */}
                      <div className="lg:col-span-2 text-center">
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                          {t("finance.budget.spent")}
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {budget.spentAmount.toLocaleString()} {budget.currency}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="lg:col-span-3">
                        <div className="mb-2 flex justify-between items-center">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{t("finance.budget.usage")}</span>
                          <span className="text-sm font-bold" style={{ color: spentPercentage > 90 ? '#ef4444' : spentPercentage > 70 ? '#f59e0b' : '#10b981' }}>
                            {spentPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(spentPercentage, 100)}%`,
                              backgroundColor: spentPercentage > 90 ? '#ef4444' : spentPercentage > 70 ? '#f59e0b' : '#10b981'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
                            transition={{ duration: 1, delay: index * 0.05 }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                          {t("finance.budget.remaining")}: {remaining.toLocaleString()} {budget.currency}
                        </p>
                      </div>

                      {/* Status & Actions */}
                      <div className="lg:col-span-2 flex items-center justify-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          budget.status === "approved" ? 'bg-green-100 text-green-700' :
                          budget.status === "draft" ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {budget.status === "approved" ? <><CheckCircle size={14} className="inline mr-1" /> {t("finance.budget.approved")}</> :
                           budget.status === "draft" ? <><Clock size={14} className="inline mr-1" /> {t("finance.budget.draft")}</> :
                           <><XCircle size={14} className="inline mr-1" /> {t("finance.budget.rejected")}</>}
                        </span>
                        <button
                          onClick={() => setSelectedBudgetForUpdate(budget)}
                          className="p-2 rounded-lg hover:scale-110 transition-all"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          title={t("finance.budget.edit")}
                        >
                          <Edit2 size={20} />
                        </button>
                        <Link to={`/dashboard/finance/budget-details/${budget._id}`}>
                          <button
                            className="p-2 rounded-lg hover:scale-110 transition-all"
                            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                            title={t("finance.budget.view_details")}
                          >
                            <Eye size={20} />
                          </button>
                        </Link>
                              </div>
                                  </div>
                                </div>
                </motion.div>
              );
            })
          )}
      </div>

        {/* Update Modal */}
      {selectedBudgetForUpdate && (
        <UpdateBudgetModal
          budget={selectedBudgetForUpdate}
            onClose={() => setSelectedBudgetForUpdate(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Budgets;
