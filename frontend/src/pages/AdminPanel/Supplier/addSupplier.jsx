// src/components/procurement/AddSupplier.jsx
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
    // שדות כתובת נפרדים:
    City: "",
    Street: "",
    Apartment: "",
    Country: "",
    // שדות חשבון בנק
    BankNumber: "",
    BranchNumber: "",
    AccountNumber: "",
    Rating: 1,
    IsActive: true,
    // שדות קבצים
    confirmationAccount: null, // שימו לב: שם השדה כאן הוא "confirmationAccount"
    attachments: [],
  });

  // Handler לשינוי שדות הטופס (תומך גם בקבצים)
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

  // Mutation להוספת ספק – שולח נתונים כ־FormData
  const addSupplierMutation = useMutation({
    mutationFn: async (newSupplier) => {
      const response = await axiosInstance.post("/suppliers", newSupplier, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Supplier added successfully!");
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
      toast.error(
        error.response?.data?.message ||
          "Failed to add supplier. Please try again."
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // ניצור FormData ונאחד את השדות הנלווים
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

    // הוספת שדות טקסטיים
    Object.entries(rest).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // מחברים את שדות חשבון הבנק
    const bankAccountStr = `${BankNumber}-${BranchNumber}-${AccountNumber}`;
    formData.append("BankAccount", bankAccountStr);

    // מאחדים את כתובת – בין עיר לרחוב יש מקף, בין רחוב לדירה יש רווח, ובין דירה למדינה יש מקף
    const addressStr = `${City}-${Street} ${Apartment}-${Country}`;
    formData.append("Address", addressStr);

    // הוספת קובץ אישור חשבון אם קיים
    if (confirmationAccount) {
      formData.append("confirmationAccount", confirmationAccount);
    }

    // הוספת קבצים נלווים (מספר קבצים)
    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    addSupplierMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-3xl w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
            {t("supplier.add_new_supplier")}
          </h2>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-lg transform transition-all duration-500 hover:shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* פרטי ספק */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.name")}
              </label>
              <input
                type="text"
                name="SupplierName"
                value={supplierData.SupplierName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Supplier Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.contact")}
              </label>
              <input
                type="text"
                name="Contact"
                value={supplierData.Contact}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Contact Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.phone")}
              </label>
              <input
                type="text"
                name="Phone"
                value={supplierData.Phone}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Phone Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.email")}
              </label>
              <input
                type="email"
                name="Email"
                value={supplierData.Email}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Email"
              />
            </div>

            {/* שדות כתובת */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {t("supplier.address")}
              </h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.city")}
              </label>
              <input
                type="text"
                name="City"
                value={supplierData.City}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.street")}
              </label>
              <input
                type="text"
                name="Street"
                value={supplierData.Street}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.apartment")}
              </label>
              <input
                type="text"
                name="Apartment"
                value={supplierData.Apartment}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Apartment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.country")}
              </label>
              <input
                type="text"
                name="Country"
                value={supplierData.Country}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Country"
              />
            </div>

            {/* שדות חשבון בנק */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Bank Account
              </h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.bank_number")}
              </label>
              <input
                type="text"
                name="BankNumber"
                value={supplierData.BankNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Bank Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.branch_number")}
              </label>
              <input
                type="text"
                name="BranchNumber"
                value={supplierData.BranchNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Branch Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.account_number")}
              </label>
              <input
                type="text"
                name="AccountNumber"
                value={supplierData.AccountNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
                placeholder="Enter Account Number"
              />
            </div>

            {/* שדה אישור חשבון */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.confirmation_account")}
              </label>
              {/* שם השדה נמוך, כך שיתפוס ב־req.files.confirmationAccount */}
              <input
                type="file"
                name="confirmationAccount"
                onChange={handleInputChange}
                className="mt-1 block w-full text-gray-700"
              />
            </div>

            {/* שדה מסמכים נלווים */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.attachments")}
              </label>
              <input
                type="file"
                name="attachments"
                onChange={handleInputChange}
                multiple
                className="mt-1 block w-full text-gray-700"
              />
            </div>

            {/* בחירת מטבע בסיס */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.currency")}
              </label>
              <select
                name="baseCurrency"
                value={supplierData.baseCurrency}
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
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
              <label className="block text-sm font-medium text-gray-700">
                {t("supplier.rating")}
              </label>
              <input
                type="number"
                name="Rating"
                value={supplierData.Rating}
                min="1"
                max="5"
                onChange={handleInputChange}
                className="mt-1 block w-full border-b border-gray-300 focus:ring-0 focus:border-gray-500 transition-all duration-300"
              />
            </div>

            {/* סטטוס פעילות */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="IsActive"
                checked={supplierData.IsActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-transform duration-300"
              />
              <label className="ml-2 text-sm text-gray-700">
                {t("supplier.active")}
              </label>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={addSupplierMutation.isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-300 hover:scale-105"
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
