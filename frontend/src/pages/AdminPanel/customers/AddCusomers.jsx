import React, { useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const AddCustomers = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // מצב הטופס לפי המודל (למעט createdBy/updatedBy, אותם נטפל בצד השרת)
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    website: "",
    industry: "",
    status: "Prospect", // Active, Inactive, or Prospect
    customerType: "Corporate", // "Individual" or "Corporate"
    dateOfBirth: "",
    gender: "",
    preferredContactMethod: "",
    lastContacted: "",
    // customerSince - נותר ריק כדי שהשרת יגדיר כברירת מחדל
    contacts: [], // מערך של אנשי קשר
    notes: "",
  });

  // Handler לשינוי בשדות הטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  // Handler לניהול אנשי קשר (contacts)
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

  // Handler לשליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    // בדיקה בסיסית - שם ואימייל הם שדות חובה
    if (!customer.name || !customer.email) {
      toast.error(
        t("customer.name_email_required", "Name and email are required")
      );
      return;
    }
    setLoading(true);
    try {
      // שליחת הנתונים לשרת; שדה customerSince יוגדר בשרת כברירת מחדל
      const response = await axiosInstance.post("/customers", customer);
      if (response.data.success) {
        toast.success(
          t("customer.success_create", "Customer added successfully")
        );
        // איפוס הטופס
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {t("customer.add_title", "Add Customer")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.name", "Name")}
              </label>
              <input
                type="text"
                name="name"
                value={customer.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.email", "Email")}
              </label>
              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.phone", "Phone")}
              </label>
              <input
                type="text"
                name="phone"
                value={customer.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.address", "Address")}
              </label>
              <input
                type="text"
                name="address"
                value={customer.address}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.company", "Company")}
              </label>
              <input
                type="text"
                name="company"
                value={customer.company}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.website", "Website")}
              </label>
              <input
                type="text"
                name="website"
                value={customer.website}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.industry", "Industry")}
              </label>
              <input
                type="text"
                name="industry"
                value={customer.industry}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.status", "Status")}
              </label>
              <select
                name="status"
                value={customer.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
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
              <label className="block text-sm font-medium text-gray-700">
                {t("customer.customerType", "Customer Type")}
              </label>
              <select
                name="customerType"
                value={customer.customerType}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
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

          {/* Fields for Individual customers */}
          {customer.customerType === "Individual" && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("customer.dateOfBirth", "Date of Birth")}
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={customer.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("customer.gender", "Gender")}
                </label>
                <select
                  name="gender"
                  value={customer.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
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

          {/* Preferred Contact Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("customer.preferredContactMethod", "Preferred Contact Method")}
            </label>
            <select
              name="preferredContactMethod"
              value={customer.preferredContactMethod}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            >
              <option value="">
                {t("customer.selectContactMethod", "Select Method")}
              </option>
              <option value="Email">{t("customer.email", "Email")}</option>
              <option value="Phone">{t("customer.phone", "Phone")}</option>
              <option value="Mail">{t("customer.mail", "Mail")}</option>
            </select>
          </div>

          {/* Last Contacted */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("customer.lastContacted", "Last Contacted")}
            </label>
            <input
              type="date"
              name="lastContacted"
              value={customer.lastContacted}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Contacts */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("customer.contacts", "Contacts")}
            </label>
            {customer.contacts.map((contact, index) => (
              <div key={index} className="border p-2 rounded mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">
                    {t("customer.contact", "Contact")} {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="text-red-600 text-sm"
                  >
                    {t("customer.remove", "Remove")}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    name="name"
                    placeholder={t("customer.contactName", "Name")}
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, e)}
                    className="border p-1 rounded w-full"
                  />
                  <input
                    type="text"
                    name="position"
                    placeholder={t("customer.contactPosition", "Position")}
                    value={contact.position}
                    onChange={(e) => handleContactChange(index, e)}
                    className="border p-1 rounded w-full"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder={t("customer.contactEmail", "Email")}
                    value={contact.email}
                    onChange={(e) => handleContactChange(index, e)}
                    className="border p-1 rounded w-full"
                  />
                  <input
                    type="text"
                    name="phone"
                    placeholder={t("customer.contactPhone", "Phone")}
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, e)}
                    className="border p-1 rounded w-full"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addContact}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              {t("customer.addContact", "Add Contact")}
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("customer.notes", "Notes")}
            </label>
            <textarea
              name="notes"
              value={customer.notes}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded mt-4"
          >
            {loading
              ? t("customer.creating", "Creating...")
              : t("customer.submit", "Add Customer")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCustomers;
