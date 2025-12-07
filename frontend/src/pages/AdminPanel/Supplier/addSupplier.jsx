import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import currencyList from "../finance/currency.json";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Truck, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Home, 
  Building2,
  Globe,
  CreditCard,
  Star,
  FileText,
  Paperclip,
  DollarSign,
  CheckCircle2,
  Loader
} from "lucide-react";

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Truck size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("supplier.add_new_supplier")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("supplier.add_new_supplier")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <motion.div
            className="p-6 rounded-xl border"
            style={{
              background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                <User className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>פרטי ספק בסיסיים</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <Truck size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.name")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="SupplierName"
                  value={supplierData.SupplierName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("supplier.enter_name")}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <User size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.contact")}
                </label>
                <input
                  type="text"
                  name="Contact"
                  value={supplierData.Contact}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("supplier.enter_contact")}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <Phone size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.phone")}
                </label>
                <input
                  type="text"
                  name="Phone"
                  value={supplierData.Phone}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("supplier.enter_phone")}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <Mail size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.email")}
                </label>
                <input
                  type="email"
                  name="Email"
                  value={supplierData.Email}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("supplier.enter_email")}
                />
              </div>
            </div>
          </motion.div>

          {/* Address Section */}
          <motion.div
            className="p-6 rounded-xl border"
            style={{
              background: "linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(20, 184, 166, 0.1))",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#22c55e" }}>
                <MapPin className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>{t("supplier.address")}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "City", icon: Building2, placeholder: t("supplier.enter_city"), label: t("supplier.city") },
                { name: "Street", icon: Home, placeholder: t("supplier.enter_street"), label: t("supplier.street") },
                { name: "Apartment", icon: Home, placeholder: t("supplier.enter_apartment"), label: t("supplier.apartment") },
                { name: "Country", icon: Globe, placeholder: t("supplier.enter_country"), label: t("supplier.country") },
              ].map(({ name, icon: Icon, placeholder, label }) => (
                <div key={name}>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                    <Icon size={16} style={{ color: "var(--color-secondary)" }} />
                    {label}
                  </label>
                  <input
                    type="text"
                    name={name}
                    value={supplierData[name]}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bank Account Section */}
          <motion.div
            className="p-6 rounded-xl border"
            style={{
              background: "linear-gradient(to right, rgba(249, 115, 22, 0.1), rgba(234, 179, 8, 0.1))",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#f97316" }}>
                <CreditCard className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>{t("supplier.bank_account")}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "BankNumber", placeholder: t("supplier.enter_bank_number"), label: t("supplier.bank_number") },
                { name: "BranchNumber", placeholder: t("supplier.enter_branch_number"), label: t("supplier.branch_number") },
                { name: "AccountNumber", placeholder: t("supplier.enter_account_number"), label: t("supplier.account_number") },
              ].map(({ name, placeholder, label }) => (
                <div key={name}>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                    <CreditCard size={16} style={{ color: "var(--color-secondary)" }} />
                    {label}
                  </label>
                  <input
                    type="text"
                    name={name}
                    value={supplierData[name]}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Files & Additional Info Section */}
          <motion.div
            className="p-6 rounded-xl border"
            style={{
              background: "linear-gradient(to right, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))",
              borderColor: "var(--border-color)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#a855f7" }}>
                <FileText className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>קבצים ומידע נוסף</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <FileText size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.confirmation_account")}
                </label>
                <input
                  type="file"
                  name="confirmationAccount"
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <Paperclip size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.attachments")}
                </label>
                <input
                  type="file"
                  name="attachments"
                  onChange={handleInputChange}
                  multiple
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <DollarSign size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.currency")}
                </label>
                <select
                  name="baseCurrency"
                  value={supplierData.baseCurrency}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
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

              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  <Star size={16} style={{ color: "var(--color-secondary)" }} />
                  {t("supplier.rating")} (1-5)
                </label>
                <input
                  type="number"
                  name="Rating"
                  value={supplierData.Rating}
                  min="1"
                  max="5"
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-5 rounded-xl border" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}>
                <span className="text-sm font-bold" style={{ color: "var(--text-color)" }}>סטטוס ספק</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="IsActive"
                    checked={supplierData.IsActive}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                  <span className="mr-3 text-sm font-bold" style={{ color: supplierData.IsActive ? "#16a34a" : "#dc2626" }}>
                    {supplierData.IsActive ? t("supplier.active") : t("supplier.inactive")}
                  </span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={addSupplierMutation.isLoading}
              className="w-full font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
              style={{
                background: "linear-gradient(to right, #6366f1, #a855f7)",
                color: "var(--button-text)",
              }}
            >
              {addSupplierMutation.isLoading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  <span>{t("supplier.adding")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>{t("supplier.add_button")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplier;
