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
    Address: "",
    BankAccount: "",
    Rating: 1,
    IsActive: true,
  });

  // Handler לשינוי שדות הטופס
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSupplierData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Mutation להוספת ספק
  const addSupplierMutation = useMutation({
    mutationFn: async (newSupplier) => {
      const response = await axiosInstance.post("/suppliers", newSupplier);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Supplier added successfully!");
      queryClient.invalidateQueries(["suppliers"]); // רענון רשימת הספקים
      // איפוס הטופס
      setSupplierData({
        companyId: authUser?.user?.companyId || "",
        SupplierName: "",
        Contact: "",
        Phone: "",
        Email: "",
        Address: "",
        baseCurrency: "USD",
        BankAccount: "",
        Rating: 1,
        IsActive: true,
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
    addSupplierMutation.mutate(supplierData);
  };

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <div className="flex-1 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold text-center text-primary mb-6">
            {t("supplier.add_new_supplier")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* שם הספק */}
            <div>
              <label className="block text-text font-medium">
                {t("supplier.name")}
              </label>
              <input
                type="text"
                name="SupplierName"
                value={supplierData.SupplierName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter Supplier Name"
              />
            </div>

            {/* איש קשר */}
            <div>
              <label className="block text-text font-medium">
                {t("supplier.contact")}
              </label>
              <input
                type="text"
                name="Contact"
                value={supplierData.Contact}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter Contact Name"
              />
            </div>

            {/* טלפון */}
            <div>
              <label className="block text-text font-medium">
                {t("supplier.phone")}
              </label>
              <input
                type="text"
                name="Phone"
                value={supplierData.Phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter Phone Number"
              />
            </div>

            {/* אימייל */}
            <div>
              <label className="block text-text font-medium">
                {t("supplier.email")}
              </label>
              <input
                type="email"
                name="Email"
                value={supplierData.Email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter Email"
              />
            </div>

            {/* כתובת */}
            <div>
              <label className="block text-text font-medium">
                {t("supplier.address")}
              </label>
              <input
                type="text"
                name="Address"
                value={supplierData.Address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter Address"
              />
            </div>

            {/* חשבון בנק */}
            <div>
              <label className="block text-text font-medium">
                {t("supplier.bank_account")}
              </label>
              <input
                type="text"
                name="BankAccount"
                value={supplierData.BankAccount}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter Bank Account"
              />
            </div>

            {/* דירוג */}
            <div>
              <label className="block text-text font-medium">
                {t("supplier.rating")}
              </label>
              <input
                type="number"
                name="Rating"
                value={supplierData.Rating}
                min="1"
                max="5"
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-color rounded-lg bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* בחירת מטבע בסיס */}
            <div>
              <label className="block text-text font-medium mb-1">
                {t("supplier.currency")}
              </label>
              <select
                name="baseCurrency"
                value={supplierData.baseCurrency}
                onChange={handleInputChange}
                className="w-full px-2 py-1 border border-border-color bg-white rounded-md text-text"
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

            {/* סטטוס פעילות */}
            <div>
              <label className="flex items-center text-text font-medium">
                <input
                  type="checkbox"
                  name="IsActive"
                  checked={supplierData.IsActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                {t("supplier.active")}
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-button-bg text-button-text py-2 px-4 rounded-lg hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              disabled={addSupplierMutation.isLoading}
            >
              {addSupplierMutation.isLoading
                ? t("supplier.adding")
                : t("supplier.add_button")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSupplier;
