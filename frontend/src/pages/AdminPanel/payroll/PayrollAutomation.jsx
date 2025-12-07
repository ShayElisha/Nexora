import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Settings,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  Calculator,
  TrendingUp,
  FileText,
  Mail,
  Loader2,
  RefreshCw,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  CreditCard,
} from "lucide-react";

const PayrollAutomation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [expandedSalary, setExpandedSalary] = useState(null);

  // Fetch automation settings
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["payroll-automation-settings"],
    queryFn: async () => {
      const res = await axiosInstance.get("/payroll-automation/settings");
      return res.data.data;
    },
  });

  // Fetch tax configs for dropdown
  const { data: taxConfigs = [] } = useQuery({
    queryKey: ["tax-configs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/tax-config");
      return res.data.data.filter((config) => config.isActive) || [];
    },
  });

  // Fetch pending approvals
  const { data: pendingApprovals = [], refetch: refetchApprovals } = useQuery({
    queryKey: ["pending-approvals", selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await axiosInstance.get("/payroll-automation/pending-approvals", {
        params: { year: selectedYear, month: selectedMonth },
      });
      return res.data.data || [];
    },
    enabled: activeTab === "approvals",
  });

  // Fetch pending payments
  const { data: pendingPayments = [], refetch: refetchPayments } = useQuery({
    queryKey: ["pending-payments", selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await axiosInstance.get("/payroll-automation/pending-payments", {
        params: { year: selectedYear, month: selectedMonth },
      });
      return res.data.data || [];
    },
    enabled: activeTab === "payments",
  });

  // Fetch payroll stats
  const { data: stats } = useQuery({
    queryKey: ["payroll-stats", selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await axiosInstance.get("/payroll-automation/stats", {
        params: { year: selectedYear, month: selectedMonth },
      });
      return res.data.data || {};
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      const res = await axiosInstance.post("/payroll-automation/settings", newSettings);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t("finance.payroll.settings_saved") || "Settings saved successfully");
      queryClient.invalidateQueries(["payroll-automation-settings"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("finance.payroll.error_saving_settings") || "Error saving settings");
    },
  });

  // Calculate salaries mutation
  const calculateMutation = useMutation({
    mutationFn: async ({ year, month }) => {
      const res = await axiosInstance.post("/payroll-automation/calculate", { year, month });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || t("finance.payroll.calculation_complete") || "Calculation complete");
      queryClient.invalidateQueries(["pending-approvals"]);
      queryClient.invalidateQueries(["payroll-stats"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("finance.payroll.error_calculating") || "Error calculating salaries");
    },
  });

  // Approve salary mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, approved, notes }) => {
      const res = await axiosInstance.post(`/payroll-automation/approve/${id}`, { approved, notes });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || t("finance.payroll.salary_approved") || "Salary approved");
      refetchApprovals();
      queryClient.invalidateQueries(["payroll-stats"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("finance.payroll.error_approving") || "Error approving salary");
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ salaryIds, paymentDate, paymentMethod, bankAccount }) => {
      const res = await axiosInstance.post("/payroll-automation/mark-as-paid", {
        salaryIds,
        paymentDate,
        paymentMethod,
        bankAccount,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || t("finance.payroll.salaries_marked_paid") || "Salaries marked as paid");
      refetchPayments();
      queryClient.invalidateQueries(["payroll-stats"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("finance.payroll.error_marking_paid") || "Error marking salaries as paid");
    },
  });

  // Recalculate mutation
  const recalculateMutation = useMutation({
    mutationFn: async ({ year, month }) => {
      const res = await axiosInstance.post("/payroll-automation/recalculate", { year, month });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || t("finance.payroll.recalculation_complete") || "Recalculation complete");
      queryClient.invalidateQueries(["pending-approvals"]);
      queryClient.invalidateQueries(["payroll-stats"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("finance.payroll.error_recalculating") || "Error recalculating");
    },
  });

  const [formData, setFormData] = useState({
    enabled: false,
    calculationDate: 25,
    approvalDate: 27,
    paymentDate: 1,
    autoApprove: false,
    autoSendPayslips: true,
    notificationDays: 3,
    defaultTaxConfigId: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        enabled: settings.enabled || false,
        calculationDate: settings.calculationDate || 25,
        approvalDate: settings.approvalDate || 27,
        paymentDate: settings.paymentDate || 1,
        autoApprove: settings.autoApprove || false,
        autoSendPayslips: settings.autoSendPayslips !== undefined ? settings.autoSendPayslips : true,
        notificationDays: settings.notificationDays || 3,
        defaultTaxConfigId: settings.defaultTaxConfigId || "",
      });
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleCalculate = () => {
    if (!formData.defaultTaxConfigId) {
      toast.error(t("finance.payroll.tax_config_required") || "Please select a default tax configuration");
      return;
    }
    calculateMutation.mutate({ year: selectedYear, month: selectedMonth });
  };

  const handleApprove = (id, approved, notes = "") => {
    approveMutation.mutate({ id, approved, notes });
  };

  const handleMarkAsPaid = (salaryIds) => {
    const paymentDate = new Date().toISOString().split("T")[0];
    markAsPaidMutation.mutate({
      salaryIds,
      paymentDate,
      paymentMethod: "Bank Transfer",
      bankAccount: "",
    });
  };

  const handleRecalculate = () => {
    if (!formData.defaultTaxConfigId) {
      toast.error(t("finance.payroll.tax_config_required") || "Please select a default tax configuration");
      return;
    }
    recalculateMutation.mutate({ year: selectedYear, month: selectedMonth });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("he-IL");
  };

  const getMonthName = (month) => {
    const months = [
      t("common.january") || "January",
      t("common.february") || "February",
      t("common.march") || "March",
      t("common.april") || "April",
      t("common.may") || "May",
      t("common.june") || "June",
      t("common.july") || "July",
      t("common.august") || "August",
      t("common.september") || "September",
      t("common.october") || "October",
      t("common.november") || "November",
      t("common.december") || "December",
    ];
    return months[month - 1] || month;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
      <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Settings size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("finance.payroll.automation.title") || "Payroll Automation"}
        </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("finance.payroll.automation.subtitle") || "Automate your payroll process"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: "settings", label: t("finance.payroll.tabs.settings") || "Settings", icon: Settings },
            { id: "approvals", label: t("finance.payroll.tabs.approvals") || "Pending Approvals", icon: CheckCircle },
            { id: "payments", label: t("finance.payroll.tabs.payments") || "Pending Payments", icon: CreditCard },
            { id: "stats", label: t("finance.payroll.tabs.stats") || "Statistics", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "shadow-lg"
                  : "hover:bg-opacity-50"
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? "var(--color-primary)" : "var(--border-color)",
                color: activeTab === tab.id ? "var(--button-text)" : "var(--text-color)",
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl shadow-lg border p-6 sm:p-8"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          >
            {loadingSettings ? (
              <div className="text-center py-16">
                <Loader2 className="animate-spin mx-auto mb-4" size={48} style={{ color: "var(--color-primary)" }} />
                <p style={{ color: "var(--text-color)" }}>{t("common.loading") || "Loading..."}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {t("finance.payroll.automation_settings") || "Automation Settings"}
                  </h2>
                  <button
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--button-text)",
                    }}
                  >
                    {updateSettingsMutation.isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {t("common.saving") || "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        {t("common.save") || "Save"}
                      </>
                    )}
                  </button>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
                  <div>
                    <label className="font-bold" style={{ color: "var(--text-color)" }}>
                      {t("finance.payroll.enable_automation") || "Enable Payroll Automation"}
                    </label>
                    <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
                      {t("finance.payroll.enable_automation_desc") || "Automatically calculate and process payroll"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 bg-gray-300"></div>
                  </label>
                </div>

                {/* Date Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      <Calendar className="inline mr-2" size={16} />
                      {t("finance.payroll.calculation_date") || "Calculation Date"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.calculationDate}
                      onChange={(e) => setFormData({ ...formData, calculationDate: parseInt(e.target.value) || 25 })}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>
                      {t("finance.payroll.day_of_month") || "Day of month"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      <CheckCircle className="inline mr-2" size={16} />
                      {t("finance.payroll.approval_date") || "Approval Date"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.approvalDate}
                      onChange={(e) => setFormData({ ...formData, approvalDate: parseInt(e.target.value) || 27 })}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>
                      {t("finance.payroll.day_of_month") || "Day of month"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      <CreditCard className="inline mr-2" size={16} />
                      {t("finance.payroll.payment_date") || "Payment Date"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: parseInt(e.target.value) || 1 })}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>
                      {t("finance.payroll.day_of_month") || "Day of month"}
                    </p>
                  </div>
                </div>

                {/* Tax Config */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                    <FileText className="inline mr-2" size={16} />
                    {t("finance.payroll.default_tax_config") || "Default Tax Configuration"} *
                  </label>
                  <select
                    value={formData.defaultTaxConfigId}
                    onChange={(e) => setFormData({ ...formData, defaultTaxConfigId: e.target.value })}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    required
                  >
                    <option value="">{t("finance.payroll.select_tax_config") || "Select Tax Configuration"}</option>
                    {taxConfigs.map((config) => (
                      <option key={config._id} value={config._id}>
                        {config.name} ({config.countryCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
                    <div>
                      <label className="font-bold" style={{ color: "var(--text-color)" }}>
                        {t("finance.payroll.auto_approve") || "Auto Approve"}
                      </label>
                      <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
                        {t("finance.payroll.auto_approve_desc") || "Automatically approve calculated salaries"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoApprove}
                        onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 bg-gray-300"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
                    <div>
                      <label className="font-bold" style={{ color: "var(--text-color)" }}>
                        {t("finance.payroll.auto_send_payslips") || "Auto Send Payslips"}
                      </label>
                      <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
                        {t("finance.payroll.auto_send_payslips_desc") || "Automatically send payslips to employees"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoSendPayslips}
                        onChange={(e) => setFormData({ ...formData, autoSendPayslips: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 bg-gray-300"></div>
                    </label>
                  </div>
                </div>

                {/* Notification Days */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                    <Clock className="inline mr-2" size={16} />
                    {t("finance.payroll.notification_days") || "Notification Days Before"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.notificationDays}
                    onChange={(e) => setFormData({ ...formData, notificationDays: parseInt(e.target.value) || 3 })}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>
                    {t("finance.payroll.notification_days_desc") || "Days before payment date to send notifications"}
                  </p>
                </div>

                {/* Calculate Button */}
                <div className="flex gap-4 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {getMonthName(i + 1)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 w-24"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleCalculate}
                    disabled={calculateMutation.isLoading || !formData.defaultTaxConfigId}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--button-text)",
                    }}
                  >
                    {calculateMutation.isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {t("finance.payroll.calculating") || "Calculating..."}
                      </>
                    ) : (
                      <>
                        <Calculator size={20} />
                        {t("finance.payroll.calculate_salaries") || "Calculate Salaries"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRecalculate}
                    disabled={recalculateMutation.isLoading || !formData.defaultTaxConfigId}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    {recalculateMutation.isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {t("finance.payroll.recalculating") || "Recalculating..."}
                      </>
                    ) : (
                      <>
                        <RefreshCw size={20} />
                        {t("finance.payroll.recalculate") || "Recalculate"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === "approvals" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl shadow-lg border p-6 sm:p-8"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("finance.payroll.pending_approvals") || "Pending Approvals"}
              </h2>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 w-24"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
                <p className="text-xl" style={{ color: "var(--color-secondary)" }}>
                  {t("finance.payroll.no_pending_approvals") || "No pending approvals"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((salary) => (
                  <motion.div
                    key={salary._id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users size={20} style={{ color: "var(--color-primary)" }} />
                          <h3 className="font-bold text-lg" style={{ color: "var(--text-color)" }}>
                            {salary.employeeId?.name} {salary.employeeId?.lastName}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span style={{ color: "var(--color-secondary)" }}>
                              {t("finance.payroll.period") || "Period"}:
                            </span>
                            <span className="font-bold ml-2" style={{ color: "var(--text-color)" }}>
                              {formatDate(salary.periodStart)} - {formatDate(salary.periodEnd)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "var(--color-secondary)" }}>
                              {t("finance.payroll.hours") || "Hours"}:
                            </span>
                            <span className="font-bold ml-2" style={{ color: "var(--text-color)" }}>
                              {salary.totalHours}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "var(--color-secondary)" }}>
                              {t("finance.payroll.gross") || "Gross"}:
                            </span>
                            <span className="font-bold ml-2" style={{ color: "var(--text-color)" }}>
                              {formatCurrency(salary.totalPay)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "var(--color-secondary)" }}>
                              {t("finance.payroll.net") || "Net"}:
                            </span>
                            <span className="font-bold ml-2" style={{ color: "#10b981" }}>
                              {formatCurrency(salary.netPay)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(salary._id, true)}
                          disabled={approveMutation.isLoading}
                          className="px-4 py-2 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
                          style={{
                            backgroundColor: "#10b981",
                            color: "white",
                          }}
                        >
                          {t("finance.payroll.approve") || "Approve"}
                        </button>
                        <button
                          onClick={() => handleApprove(salary._id, false)}
                          disabled={approveMutation.isLoading}
                          className="px-4 py-2 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                          }}
                        >
                          {t("finance.payroll.reject") || "Reject"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Pending Payments Tab */}
        {activeTab === "payments" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl shadow-lg border p-6 sm:p-8"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("finance.payroll.pending_payments") || "Pending Payments"}
              </h2>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 w-24"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
                <p className="text-xl" style={{ color: "var(--color-secondary)" }}>
                  {t("finance.payroll.no_pending_payments") || "No pending payments"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((salary) => (
                  <motion.div
                    key={salary._id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users size={20} style={{ color: "var(--color-primary)" }} />
                          <h3 className="font-bold text-lg" style={{ color: "var(--text-color)" }}>
                            {salary.employeeId?.name} {salary.employeeId?.lastName}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span style={{ color: "var(--color-secondary)" }}>
                              {t("finance.payroll.period") || "Period"}:
                            </span>
                            <span className="font-bold ml-2" style={{ color: "var(--text-color)" }}>
                              {formatDate(salary.periodStart)} - {formatDate(salary.periodEnd)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "var(--color-secondary)" }}>
                              {t("finance.payroll.net_pay") || "Net Pay"}:
                            </span>
                            <span className="font-bold ml-2 text-lg" style={{ color: "#10b981" }}>
                              {formatCurrency(salary.netPay)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleMarkAsPaid([salary._id])}
                          disabled={markAsPaidMutation.isLoading}
                          className="px-4 py-2 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--color-primary)",
                            color: "var(--button-text)",
                          }}
                        >
                          {markAsPaidMutation.isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            t("finance.payroll.mark_as_paid") || "Mark as Paid"
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl shadow-lg border p-6 sm:p-8"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("finance.payroll.statistics") || "Payroll Statistics"}
              </h2>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 w-24"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users size={24} style={{ color: "var(--color-primary)" }} />
                  <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                    {t("finance.payroll.total_salaries") || "Total Salaries"}
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                  {stats.totalSalaries || 0}
                </p>
              </motion.div>
              <motion.div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={24} style={{ color: "#f59e0b" }} />
                  <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                    {t("finance.payroll.pending_approvals") || "Pending Approvals"}
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: "#f59e0b" }}>
                  {stats.pendingApprovals || 0}
                </p>
              </motion.div>
              <motion.div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={24} style={{ color: "#10b981" }} />
                  <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                    {t("finance.payroll.approved_for_payment") || "Approved for Payment"}
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: "#10b981" }}>
                  {stats.approvedForPayment || 0}
                </p>
              </motion.div>
              <motion.div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={24} style={{ color: "#10b981" }} />
                  <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                    {t("finance.payroll.total_payout") || "Total Payout"}
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: "#10b981" }}>
                  {formatCurrency(stats.totalPayout || 0)}
        </p>
      </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PayrollAutomation;
