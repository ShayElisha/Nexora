import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import currencyList from "./currency.json";
import { useTranslation } from "react-i18next";
import Select from "react-select";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused
      ? "var(--color-primary)"
      : "var(--border-color)",
    borderRadius: "0.5rem",
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
    borderRadius: "0.5rem",
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
    onError: (error) => {
      toast.error(`${t("finance.fetch_suppliers_failed")}: ${error.message}`);
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees");
      return response.data.data;
    },
    onError: (error) => {
      toast.error(`${t("finance.fetch_employees_failed")}: ${error.message}`);
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/customers");
      return response.data.data;
    },
    onError: (error) => {
      toast.error(`${t("finance.fetch_customers_failed")}: ${error.message}`);
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
    transactionCurrency: "USD",
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
        transactionCurrency: "USD",
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
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="bg-accent p-8 rounded-2xl shadow-2xl w-full max-w-2xl border bg-bg transform transition-all duration-500 hover:shadow-3xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 text-text tracking-tight drop-shadow-md">
          {t("finance.add_record")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* בחירת סוג הרשומה */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-text tracking-wide">
              {t("finance.record_type")}
            </label>
            <select
              name="recordType"
              value={formData.recordType}
              onChange={handleChange}
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              required
            >
              <option value="supplier">{t("finance.supplier")}</option>
              <option value="employee">{t("finance.employee")}</option>
              <option value="customer">{t("finance.customer")}</option>
              <option value="other">{t("finance.other")}</option>
            </select>
          </div>

          {/* שדות דינמיים */}
          {formData.recordType === "supplier" && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.supplier")}
              </label>
              <Select
                options={suppliersOptions}
                onChange={(option) => handleSelectChange("supplierId", option)}
                value={
                  suppliersOptions.find(
                    (option) => option.value === formData.supplierId
                  ) || null
                }
                isSearchable
                placeholder={t("finance.select_supplier")}
                styles={customSelectStyles}
              />
            </div>
          )}

          {formData.recordType === "employee" && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.employee")}
              </label>
              <Select
                options={employeesOptions}
                onChange={(option) => handleSelectChange("employeeId", option)}
                value={
                  employeesOptions.find(
                    (option) => option.value === formData.employeeId
                  ) || null
                }
                isSearchable
                placeholder={t("finance.select_employee")}
                styles={customSelectStyles}
              />
            </div>
          )}

          {formData.recordType === "customer" && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.customer")}
              </label>
              <Select
                options={customersOptions}
                onChange={(option) => handleSelectChange("customerId", option)}
                value={
                  customersOptions.find(
                    (option) => option.value === formData.customerId
                  ) || null
                }
                isSearchable
                placeholder={t("finance.select_customer")}
                styles={customSelectStyles}
              />
            </div>
          )}

          {formData.recordType === "other" && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.other_details")}
              </label>
              <textarea
                name="otherDetails"
                value={formData.otherDetails}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                rows="3"
                required
              />
            </div>
          )}

          {/* שדות סטטיים */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.transaction_date")}
              </label>
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.transaction_type")}
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              >
                <option value="Income">{t("finance.income")}</option>
                <option value="Expense">{t("finance.expense")}</option>
                <option value="Transfer">{t("finance.transfer")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.amount")}
              </label>
              <input
                type="number"
                name="transactionAmount"
                value={formData.transactionAmount}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("budget.currency")}
              </label>
              <select
                name="transactionCurrency"
                value={formData.transactionCurrency}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.Category")}
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50"
                placeholder={t("finance.enter_category")}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.Bank_Account")}
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50"
                placeholder={t("finance.enter_bank_account")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.Transaction_Status")}
              </label>
              <select
                name="transactionStatus"
                value={formData.transactionStatus}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              >
                <option value="Pending">{t("finance.pending")}</option>
                <option value="Completed">{t("finance.completed")}</option>
                <option value="Cancelled">{t("finance.cancelled")}</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-text tracking-wide">
                {t("finance.Invoice_Number")}
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50"
                placeholder={t("finance.enter_invoice_number")}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-text tracking-wide">
              {t("finance.Transaction_Description")}
            </label>
            <textarea
              name="transactionDescription"
              value={formData.transactionDescription}
              onChange={handleChange}
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50"
              rows="3"
              placeholder={t("finance.enter_description")}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-text tracking-wide">
              {t("finance.attachment")}
            </label>
            <input
              type="file"
              name="attachment"
              onChange={handleChange}
              className="w-full p-2 border border-border-color rounded-lg text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-button-text hover:file:bg-secondary transition-all duration-200"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform transition-all duration-300 hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? t("finance.submitting") : t("finance.add_record")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFinance;
