import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import currencyList from "./currency.json";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import {
  Plus,
  DollarSign,
  Calendar,
  FileText,
  Tag,
  Building,
  User,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Upload,
} from "lucide-react";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused
      ? "var(--color-primary)"
      : "var(--border-color)",
    borderRadius: "0.75rem",
    boxShadow: state.isFocused ? "0 0 0 2px var(--color-primary)" : "none",
    backgroundColor: "var(--bg-color)",
    "&:hover": { borderColor: "var(--color-primary)" },
    padding: "0.5rem",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "var(--color-accent)"
      : "var(--bg-color)",
    color: "var(--text-color)",
    "&:hover": { backgroundColor: "var(--color-accent)" },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    border: "1px solid var(--border-color)",
    boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--text-color)",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "var(--text-color)",
    opacity: 0.5,
  }),
};

const AddFinance = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/suppliers");
      return response.data.data;
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees");
      return response.data.data;
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/customers");
      return response.data.data;
    },
  });

  const suppliersOptions = suppliersData
    ? suppliersData.map((supplier) => ({
        value: supplier._id,
        label: supplier.SupplierName,
      }))
    : [];

  const employeesOptions = employeesData
    ? employeesData.map((employee) => ({
        value: employee._id,
        label: `${employee.name} ${employee.lastName}`,
      }))
    : [];

  const customersOptions = customersData
    ? customersData.map((customer) => ({
        value: customer._id,
        label: customer.name,
      }))
    : [];

  const [formData, setFormData] = useState({
    companyId: authUser?.companyId || "",
    transactionDate: "",
    transactionType: "Income",
    transactionAmount: 0,
    transactionCurrency: "ILS",
    transactionDescription: "",
    category: "",
    bankAccount: "",
    transactionStatus: "Pending",
    supplierId: "",
    invoiceNumber: "",
    attachment: null,
    recordType: "supplier",
    employeeId: "",
    customerId: "",
    otherDetails: "",
    paymentTerms: "Net 30",
  });

  const { mutate: createFinanceMutation, isLoading } = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post(
        "/finance/create-finance",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["finance"]);
      toast.success(t("finance.record_created"));
      setFormData({
        companyId: authUser?.companyId || "",
        transactionDate: "",
        transactionType: "Income",
        transactionAmount: 0,
        transactionCurrency: "ILS",
        transactionDescription: "",
        category: "",
        bankAccount: "",
        transactionStatus: "Pending",
        supplierId: "",
        invoiceNumber: "",
        attachment: null,
        recordType: "supplier",
        employeeId: "",
        customerId: "",
        otherDetails: "",
        paymentTerms: "Net 30",
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("finance.create_failed"));
    },
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData({
      ...formData,
      [name]: selectedOption ? selectedOption.value : "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    createFinanceMutation(data);
  };

  if (!isLoggedIn) {
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

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600"
            >
              <Plus size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("finance.add_record")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("finance.createNewTransaction")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg p-6 lg:p-8 border"
          style={{ 
            backgroundColor: 'var(--bg-color)',
            borderColor: 'var(--border-color)'
          }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Record Type Selection */}
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-color)' }}>
                <Building className="inline mr-2" size={18} />
                {t("finance.record_type")}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "supplier", icon: Building, label: t("finance.supplier") },
                  { value: "employee", icon: User, label: t("finance.employee") },
                  { value: "customer", icon: Users, label: t("finance.customer") },
                  { value: "other", icon: FileText, label: t("finance.other") },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, recordType: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.recordType === type.value ? 'scale-105 shadow-lg' : 'hover:scale-105'
                    }`}
                    style={{
                      borderColor: formData.recordType === type.value ? 'var(--color-primary)' : 'var(--border-color)',
                      backgroundColor: formData.recordType === type.value ? 'var(--color-primary)' : 'var(--bg-color)',
                      color: formData.recordType === type.value ? 'var(--button-text)' : 'var(--text-color)'
                    }}
                  >
                    <type.icon size={24} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields Based on Record Type */}
            {formData.recordType === "supplier" && suppliersOptions.length > 0 && (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.supplier")}
                </label>
                <Select
                  options={suppliersOptions}
                  onChange={(option) => handleSelectChange("supplierId", option)}
                  value={suppliersOptions.find(option => option.value === formData.supplierId) || null}
                  isSearchable
                  placeholder={t("finance.select_supplier")}
                  styles={customSelectStyles}
                />
              </div>
            )}

            {formData.recordType === "employee" && employeesOptions.length > 0 && (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.employee")}
                </label>
                <Select
                  options={employeesOptions}
                  onChange={(option) => handleSelectChange("employeeId", option)}
                  value={employeesOptions.find(option => option.value === formData.employeeId) || null}
                  isSearchable
                  placeholder={t("finance.select_employee")}
                  styles={customSelectStyles}
                />
              </div>
            )}

            {formData.recordType === "customer" && customersOptions.length > 0 && (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.customer")}
                </label>
                <Select
                  options={customersOptions}
                  onChange={(option) => handleSelectChange("customerId", option)}
                  value={customersOptions.find(option => option.value === formData.customerId) || null}
                  isSearchable
                  placeholder={t("finance.select_customer")}
                  styles={customSelectStyles}
                />
              </div>
            )}

            {formData.recordType === "other" && (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.other_details")}
                </label>
                <textarea
                  name="otherDetails"
                  value={formData.otherDetails}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  rows="3"
                  required
                />
              </div>
            )}

            {/* Transaction Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={16} />
                  {t("finance.transaction_date")}
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  required
                />
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.transaction_type")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "Income", icon: TrendingUp, color: "#10b981" },
                    { value: "Expense", icon: TrendingDown, color: "#ef4444" },
                    { value: "Transfer", icon: CreditCard, color: "#3b82f6" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, transactionType: type.value })}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        formData.transactionType === type.value ? 'scale-105 shadow-lg' : 'hover:scale-105'
                      }`}
                      style={{
                        borderColor: formData.transactionType === type.value ? type.color : 'var(--border-color)',
                        backgroundColor: formData.transactionType === type.value ? type.color : 'var(--bg-color)',
                        color: formData.transactionType === type.value ? 'white' : 'var(--text-color)'
                      }}
                    >
                      <type.icon size={20} />
                      <span className="text-xs font-medium">{t(`finance.${type.value.toLowerCase()}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <DollarSign className="inline mr-2" size={16} />
                  {t("finance.amount")}
                </label>
                <input
                  type="number"
                  name="transactionAmount"
                  value={formData.transactionAmount}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  required
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.budget.currency")}
                </label>
                <select
                  name="transactionCurrency"
                  value={formData.transactionCurrency}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  required
                >
                  {currencyList.map((currency) => (
                    <option
                      key={currency.currencyCode}
                      value={currency.currencyCode}
                    >
                      {currency.currencyName} ({currency.currencyCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Tag className="inline mr-2" size={16} />
                  {t("finance.Category")}
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  placeholder={t("finance.enter_category")}
                  required
                />
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <CreditCard className="inline mr-2" size={16} />
                  {t("finance.Bank_Account")}
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  placeholder={t("finance.enter_bank_account")}
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.Transaction_Status")}
                </label>
                <select
                  name="transactionStatus"
                  value={formData.transactionStatus}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  required
                >
                  <option value="Pending">{t("finance.pending")}</option>
                  <option value="Completed">{t("finance.completed")}</option>
                  <option value="Cancelled">{t("finance.cancelled")}</option>
                </select>
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <FileText className="inline mr-2" size={16} />
                  {t("finance.Invoice_Number")}
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  placeholder={t("finance.enter_invoice_number")}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <DollarSign className="inline mr-2" size={16} />
                  {t("finance.payment_terms") || "Payment Terms"}
                </label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                >
                  <option value="Immediate">{t("finance.payment_immediate") || "Immediate Payment"}</option>
                  <option value="Net 30">{t("finance.payment_net_30") || "Net 30 Days"}</option>
                  <option value="Net 45">{t("finance.payment_net_45") || "Net 45 Days"}</option>
                  <option value="Net 60">{t("finance.payment_net_60") || "Net 60 Days"}</option>
                  <option value="Net 90">{t("finance.payment_net_90") || "Net 90 Days"}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("finance.Transaction_Description")}
              </label>
              <textarea
                name="transactionDescription"
                value={formData.transactionDescription}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
                rows="4"
                placeholder={t("finance.enter_description")}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Upload className="inline mr-2" size={16} />
                {t("finance.attachment")}
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="attachment"
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl text-sm transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:transition-all file:cursor-pointer"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--button-text)'
                }}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-t-2 border-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    {t("finance.submitting")}
                  </>
                ) : (
                  <>
                    <Plus size={24} />
                    {t("finance.add_record")}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddFinance;
