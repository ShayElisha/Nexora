import React, { useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const AddCustomers = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    website: "",
    industry: "",
    status: "Prospect",
    customerType: "Corporate",
    dateOfBirth: "",
    gender: "",
    preferredContactMethod: "",
    lastContacted: "",
    contacts: [],
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updatedContacts = [...customer.contacts];
    updatedContacts[index][name] = value;
    setCustomer((prev) => ({ ...prev, contacts: updatedContacts }));
  };

  const addContact = () => {
    setCustomer((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { name: "", position: "", email: "", phone: "" },
      ],
    }));
  };

  const removeContact = (index) => {
    const updatedContacts = [...customer.contacts];
    updatedContacts.splice(index, 1);
    setCustomer((prev) => ({ ...prev, contacts: updatedContacts }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email) {
      toast.error(
        t("customer.name_email_required", "Name and email are required")
      );
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post("/customers", customer);
      if (response.data.success) {
        toast.success(
          t("customer.success_create", "Customer added successfully")
        );
        setCustomer({
          name: "",
          email: "",
          phone: "",
          address: "",
          company: "",
          website: "",
          industry: "",
          status: "Prospect",
          customerType: "Corporate",
          dateOfBirth: "",
          gender: "",
          preferredContactMethod: "",
          lastContacted: "",
          contacts: [],
          notes: "",
        });
      } else {
        toast.error(
          response.data.message ||
            t("customer.error_create", "Error adding customer")
        );
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error(
        error.response?.data?.message ||
          t("customer.error_create", "Error adding customer")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 animate-fade-in">
      <div className="bg-bg rounded-xl p-6 w-full max-w-2xl min-h-[80vh] overflow-y-auto shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-text mb-6 tracking-tight drop-shadow-sm text-center">
          {t("customer.add_title", "Add Customer")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.name", "Name")}
              </label>
              <input
                type="text"
                name="name"
                value={customer.name}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.email", "Email")}
              </label>
              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.phone", "Phone")}
              </label>
              <input
                type="text"
                name="phone"
                value={customer.phone}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.address", "Address")}
              </label>
              <input
                type="text"
                name="address"
                value={customer.address}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.company", "Company")}
              </label>
              <input
                type="text"
                name="company"
                value={customer.company}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.website", "Website")}
              </label>
              <input
                type="text"
                name="website"
                value={customer.website}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.industry", "Industry")}
              </label>
              <input
                type="text"
                name="industry"
                value={customer.industry}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.status", "Status")}
              </label>
              <select
                name="status"
                value={customer.status}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              >
                <option value="Active">
                  {t("customer.status_active", "Active")}
                </option>
                <option value="Inactive">
                  {t("customer.status_inactive", "Inactive")}
                </option>
                <option value="Prospect">
                  {t("customer.status_prospect", "Prospect")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("customer.customerType", "Customer Type")}
              </label>
              <select
                name="customerType"
                value={customer.customerType}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
              >
                <option value="Individual">
                  {t("customer.individual", "Individual")}
                </option>
                <option value="Corporate">
                  {t("customer.corporate", "Corporate")}
                </option>
              </select>
            </div>
          </div>

          {customer.customerType === "Individual" && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("customer.dateOfBirth", "Date of Birth")}
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={customer.dateOfBirth}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("customer.gender", "Gender")}
                </label>
                <select
                  name="gender"
                  value={customer.gender}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                >
                  <option value="">
                    {t("customer.selectGender", "Select Gender")}
                  </option>
                  <option value="Male">{t("customer.male", "Male")}</option>
                  <option value="Female">
                    {t("customer.female", "Female")}
                  </option>
                  <option value="Other">{t("customer.other", "Other")}</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text">
              {t("customer.preferredContactMethod", "Preferred Contact Method")}
            </label>
            <select
              name="preferredContactMethod"
              value={customer.preferredContactMethod}
              onChange={handleChange}
              className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
            >
              <option value="">
                {t("customer.selectContactMethod", "Select Method")}
              </option>
              <option value="Email">{t("customer.email", "Email")}</option>
              <option value="Phone">{t("customer.phone", "Phone")}</option>
              <option value="Mail">{t("customer.mail", "Mail")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text">
              {t("customer.lastContacted", "Last Contacted")}
            </label>
            <input
              type="date"
              name="lastContacted"
              value={customer.lastContacted}
              onChange={handleChange}
              className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text">
              {t("customer.contacts", "Contacts")}
            </label>
            {customer.contacts.map((contact, index) => (
              <div
                key={index}
                className="border border-border-color p-3 rounded-md mb-3 bg-bg shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-text">
                    {t("customer.contact", "Contact")} {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 text-sm"
                  >
                    {t("customer.remove", "Remove")}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    name="name"
                    placeholder={t("customer.contactName", "Name")}
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, e)}
                    className="w-full p-2 rounded-md bg-accent text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                  <input
                    type="text"
                    name="position"
                    placeholder={t("customer.contactPosition", "Position")}
                    value={contact.position}
                    onChange={(e) => handleContactChange(index, e)}
                    className="w-full p-2 rounded-md bg-accent text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder={t("customer.contactEmail", "Email")}
                    value={contact.email}
                    onChange={(e) => handleContactChange(index, e)}
                    className="w-full p-2 rounded-md bg-accent text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                  <input
                    type="text"
                    name="phone"
                    placeholder={t("customer.contactPhone", "Phone")}
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, e)}
                    className="w-full p-2 rounded-md bg-accent text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addContact}
              className="px-4 py-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-200"
            >
              {t("customer.addContact", "Add Contact")}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text">
              {t("customer.notes", "Notes")}
            </label>
            <textarea
              name="notes"
              value={customer.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 disabled:opacity-50"
            >
              {loading
                ? t("customer.creating", "Creating...")
                : t("customer.submit", "Add Customer")}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AddCustomers;
