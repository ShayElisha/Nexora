import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import currencyList from "./currency.json";
import { useTranslation } from "react-i18next";
import Select from "react-select";

// Custom styles for react-select – עיצוב מינימליסטי ונקי
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#4F46E5" : "#D1D5DB",
    borderRadius: "0.375rem",
    boxShadow: state.isFocused ? "0 0 0 1px #4F46E5" : "none",
    "&:hover": { borderColor: "#4F46E5" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#EEF2FF" : "white",
    color: "#1F2937",
  }),
};

const AddFinance = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // שליפת נתוני המשתמש המאומת
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  // שליפת נתוני ספקים
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/suppliers");
      return response.data.data;
    },
    onError: (error) => {
      toast.error(`Failed to fetch suppliers: ${error.message}`);
    },
  });

  // שליפת נתוני עובדים
  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees");
      return response.data.data;
    },
    onError: (error) => {
      toast.error(`Failed to fetch employees: ${error.message}`);
    },
  });

  // שליפת נתוני לקוחות
  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/customers");
      return response.data.data;
    },
    onError: (error) => {
      toast.error(`Failed to fetch customers: ${error.message}`);
    },
  });

  // הכנת אפשרויות ל־react-select
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

  // אתחול מצב הטופס כולל שדות דינמיים לפי סוג הרשומה
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
    recordType: "supplier", // supplier, employee, customer, other
    employeeId: "",
    customerId: "",
    otherDetails: "",
  });

  // Mutation ליצירת רשומת חשבונאות (שולח את הנתונים כ־FormData)
  const { mutate: createFinanceMutation } = useMutation({
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
      toast.success("Finance record created successfully");
    },
    onError: (error) => {
      toast.error("Error creating finance record");
    },
  });

  // Handler לשדות קלט רגילים
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handler לשדות של react-select
  const handleSelectChange = (name, selectedOption) => {
    setFormData({
      ...formData,
      [name]: selectedOption ? selectedOption.value : "",
    });
  };

  // Handler לשליחת הטופס
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    createFinanceMutation(data);
    console.log("Form data:", formData);
  };

  if (!isLoggedIn) {
    return <div>...Loading</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
        <h1 className="text-2xl font-semibold text-center mb-6 border-b pb-4">
          {t("finance.add_record")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* בחירת סוג הרשומה */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-gray-700">
              {t("finance.record_type")}
            </label>
            <select
              name="recordType"
              value={formData.recordType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="supplier">{t("finance.supplier")}</option>
              <option value="employee">{t("finance.employee")}</option>
              <option value="customer">{t("finance.customer")}</option>
              <option value="other">{t("finance.other")}</option>
            </select>
          </div>

          {/* שדות דינמיים בהתאם לסוג הרשומה */}
          {formData.recordType === "supplier" && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-700">
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
              <label className="mb-1 text-sm text-gray-700">
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
              <label className="mb-1 text-sm text-gray-700">
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
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.other_details")}
              </label>
              <textarea
                name="otherDetails"
                value={formData.otherDetails}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                required
              />
            </div>
          )}

          {/* שדות סטטיים */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.transaction_date")}
              </label>
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.transaction_type")}
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.amount")}
              </label>
              <input
                type="number"
                name="transactionAmount"
                value={formData.transactionAmount}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-700">
                {t("budget.currency")}
              </label>
              <select
                name="transactionCurrency"
                value={formData.transactionCurrency}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.Category")}
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.Bank_Account")}
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.Transaction_Status")}
              </label>
              <select
                name="transactionStatus"
                value={formData.transactionStatus}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-700">
                {t("finance.Invoice_Number")}
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm text-gray-700">
              {t("finance.Transaction_Description")}
            </label>
            <textarea
              name="transactionDescription"
              value={formData.transactionDescription}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm text-gray-700">
              {t("finance.attachment")}
            </label>
            <input
              type="file"
              name="attachment"
              onChange={handleChange}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={createFinanceMutation.isLoading}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors duration-200"
            >
              {createFinanceMutation.isLoading
                ? t("finance.submitting")
                : t("finance.add_record")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFinance;
