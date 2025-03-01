// src/pages/procurement/AddFinance.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import currencyList from "./currency.json";
import { useTranslation } from "react-i18next";

const AddFinance = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Fetch authenticated user data
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;
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
    attachmentURL: "",
    invoiceNumber: "",
  });

  // Fetch suppliers
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/suppliers");
      return response.data.data;
    },
    onError: (error) => {
      toast.error(`Failed to fetch suppliers: ${error.message}`);
    },
  });

  // Mutation for creating finance record
  const { mutate: createFinanceMutation, isLoading: createLoading } =
    useMutation({
      mutationFn: async (data) => {
        const response = await axiosInstance.post(
          "/finance/create-finance",
          data
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    createFinanceMutation(formData);
    console.log("Form data:", formData);
  };

  if (!isLoggedIn) {
    return <div>...Loading</div>;
  }
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="container mx-auto max-w-4xl p-8 bg-bg rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          {t("finance.add_record")}
        </h1>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Transaction Date */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.transaction_date")}:
            </label>
            <input
              type="date"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
              required
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.transaction_type")}:
            </label>
            <select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
              required
            >
              <option value="Income">{t("finance.income")}</option>
              <option value="Expense">{t("finance.expense")}</option>
              <option value="Transfer">{t("finance.transfer")}</option>
            </select>
          </div>

          {/* Transaction Amount */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.amount")}:
            </label>
            <input
              type="number"
              name="transactionAmount"
              value={formData.transactionAmount}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
              required
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("budget.currency")}:
            </label>
            <select
              name="transactionCurrency"
              value={formData.transactionCurrency}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
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
            <label className="block text-secondary font-medium mb-1">
              {t("finance.Category")}:
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
              required
            />
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.Bank_Account")}:
            </label>
            <input
              type="text"
              name="bankAccount"
              value={formData.bankAccount}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
              required
            />
          </div>

          {/* Transaction Status */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.Transaction_Status")}:
            </label>
            <select
              name="transactionStatus"
              value={formData.transactionStatus}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
              required
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.supplier")}:
            </label>
            <select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
            >
              <option value="">{t("finance.select_supplier")}</option>
              {suppliersData?.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.SupplierName}
                </option>
              ))}
            </select>
          </div>

          {/* Attachment URL */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.Attachment_URL")}:
            </label>
            <input
              type="text"
              name="attachmentURL"
              value={formData.attachmentURL}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-secondary font-medium mb-1">
              {t("finance.Invoice_Number")}:
            </label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
            />
          </div>

          {/* Transaction Description */}
          <div className="col-span-full">
            <label className="block text-secondary font-medium mb-1">
              {t("finance.Transaction_Description")}:
            </label>
            <textarea
              name="transactionDescription"
              value={formData.transactionDescription}
              onChange={handleChange}
              className="w-full px-2 py-1 border border-border-color bg-secondary rounded-md text-text"
              rows="3"
            />
          </div>

          <div className="col-span-full">
            <button
              type="submit"
              className="w-full bg-primary text-button-text font-bold py-2 px-4 rounded-md hover:bg-primary/90"
              disabled={createFinanceMutation.isLoading}
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
