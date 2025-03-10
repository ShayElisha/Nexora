import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import currencyList from "../finance/currency.json";
import { useTranslation } from "react-i18next";

const AddSupplier = ({ authUser }) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [supplierData, setSupplierData] = useState({
    companyId: authUser?.user?.companyId || "",
    SupplierName: "",
    Contact: "",
    Phone: "",
    Email: "",
    baseCurrency: "USD",
    City: "",
    Street: "",
    Apartment: "",
    Country: "",
    BankNumber: "",
    BranchNumber: "",
    AccountNumber: "",
    Rating: 1,
    IsActive: true,
    confirmationAccount: null,
    attachments: [],
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (files) {
      if (name === "attachments") {
        setSupplierData((prev) => ({ ...prev, [name]: Array.from(files) }));
      } else {
        setSupplierData((prev) => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setSupplierData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const addSupplierMutation = useMutation({
    mutationFn: async (newSupplier) => {
      const response = await axiosInstance.post("/suppliers", newSupplier, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("supplier.added_success"));
      queryClient.invalidateQueries(["suppliers"]);
      setSupplierData({
        companyId: authUser?.user?.companyId || "",
        SupplierName: "",
        Contact: "",
        Phone: "",
        Email: "",
        baseCurrency: "USD",
        City: "",
        Street: "",
        Apartment: "",
        Country: "",
        BankNumber: "",
        BranchNumber: "",
        AccountNumber: "",
        Rating: 1,
        IsActive: true,
        confirmationAccount: null,
        attachments: [],
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("supplier.add_failed"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    const {
      BankNumber,
      BranchNumber,
      AccountNumber,
      City,
      Street,
      Apartment,
      Country,
      confirmationAccount,
      attachments,
      ...rest
    } = supplierData;

    Object.entries(rest).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const bankAccountStr = `${BankNumber}-${BranchNumber}-${AccountNumber}`;
    formData.append("BankAccount", bankAccountStr);

    const addressStr = `${City}-${Street} ${Apartment}-${Country}`;
    formData.append("Address", addressStr);

    if (confirmationAccount) {
      formData.append("confirmationAccount", confirmationAccount);
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    addSupplierMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-3xl w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-text mb-8 tracking-tight drop-shadow-md">
            {t("supplier.add_new_supplier")}
          </h2>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-accent p-8 rounded-2xl shadow-2xl border border-border-color transform transition-all duration-500 hover:shadow-3xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* פרטי ספק */}
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.name")}
              </label>
              <input
                type="text"
                name="SupplierName"
                value={supplierData.SupplierName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_name")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.contact")}
              </label>
              <input
                type="text"
                name="Contact"
                value={supplierData.Contact}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_contact")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.phone")}
              </label>
              <input
                type="text"
                name="Phone"
                value={supplierData.Phone}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_phone")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.email")}
              </label>
              <input
                type="email"
                name="Email"
                value={supplierData.Email}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_email")}
              />
            </div>

            {/* שדות כתובת */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-text mb-2 tracking-tight drop-shadow-sm">
                {t("supplier.address")}
              </h3>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.city")}
              </label>
              <input
                type="text"
                name="City"
                value={supplierData.City}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_city")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.street")}
              </label>
              <input
                type="text"
                name="Street"
                value={supplierData.Street}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_street")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.apartment")}
              </label>
              <input
                type="text"
                name="Apartment"
                value={supplierData.Apartment}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_apartment")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.country")}
              </label>
              <input
                type="text"
                name="Country"
                value={supplierData.Country}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_country")}
              />
            </div>

            {/* שדות חשבון בנק */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-text mb-2 tracking-tight drop-shadow-sm">
                {t("supplier.bank_account")}
              </h3>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.bank_number")}
              </label>
              <input
                type="text"
                name="BankNumber"
                value={supplierData.BankNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_bank_number")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.branch_number")}
              </label>
              <input
                type="text"
                name="BranchNumber"
                value={supplierData.BranchNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_branch_number")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.account_number")}
              </label>
              <input
                type="text"
                name="AccountNumber"
                value={supplierData.AccountNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 placeholder-opacity-50"
                placeholder={t("supplier.enter_account_number")}
              />
            </div>

            {/* שדה אישור חשבון */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.confirmation_account")}
              </label>
              <input
                type="file"
                name="confirmationAccount"
                onChange={handleInputChange}
                className="mt-1 block w-full p-2 border border-border-color rounded-lg text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-button-text hover:file:bg-secondary transition-all duration-200"
              />
            </div>

            {/* שדה מסמכים נלווים */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.attachments")}
              </label>
              <input
                type="file"
                name="attachments"
                onChange={handleInputChange}
                multiple
                className="mt-1 block w-full p-2 border border-border-color rounded-lg text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-button-text hover:file:bg-secondary transition-all duration-200"
              />
            </div>

            {/* בחירת מטבע בסיס */}
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.currency")}
              </label>
              <select
                name="baseCurrency"
                value={supplierData.baseCurrency}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
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

            {/* דירוג */}
            <div>
              <label className="block text-sm font-semibold text-text tracking-wide">
                {t("supplier.rating")}
              </label>
              <input
                type="number"
                name="Rating"
                value={supplierData.Rating}
                min="1"
                max="5"
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
              />
            </div>

            {/* סטטוס פעילות */}
            <div className="flex items-center md:col-span-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="IsActive"
                  checked={supplierData.IsActive}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full shadow-inner transition-all duration-300 ease-in-out ${
                    supplierData.IsActive
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                ></div>
                <div
                  className={`absolute top-0.5 left-6 right-8 w-5 h-5 bg-button-text rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                    supplierData.IsActive ? "translate-x-7" : "translate-x-2"
                  }`}
                ></div>
                <span
                  className={`ml-3 text-base font-bold ${
                    supplierData.IsActive
                      ? "text-green-500 hover:text-green-600"
                      : "text-red-500 hover:text-red-600"
                  } tracking-wide transition-colors duration-200`}
                >
                  {supplierData.IsActive
                    ? t("supplier.active")
                    : t("supplier.inactive")}
                </span>
              </label>
            </div>
          </div>

          {/* כפתור שליחה */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={addSupplierMutation.isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md text-base font-semibold text-button-text bg-button-bg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform transition-all duration-300 hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {addSupplierMutation.isLoading
                ? t("supplier.adding")
                : t("supplier.add_button")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplier;
