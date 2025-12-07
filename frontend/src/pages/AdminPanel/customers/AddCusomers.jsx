import React, { useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Briefcase,
  Calendar,
  User,
  Users,
  Plus,
  X,
  Loader2,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

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
      toast.error(t("customer.name_email_required"));
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post("/customers", customer);
      if (response.data.success) {
        toast.success(t("customer.success_create"));
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
        toast.error(response.data.message || t("customer.error_create"));
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error(
        error.response?.data?.message || t("customer.error_create")
      );
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-teal-600">
              <UserPlus size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("customer.add_title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("customer.add_description")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 lg:p-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <User size={20} />
                {t("customer.basic_info")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <User className="inline mr-2" size={16} />
                    {t("customer.name")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={customer.name}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                    placeholder={t("customer.enter_name")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Mail className="inline mr-2" size={16} />
                    {t("customer.email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customer.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                    placeholder={t("customer.enter_email")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Phone className="inline mr-2" size={16} />
                    {t("customer.phone")}
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={customer.phone}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                    placeholder={t("customer.enter_phone")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <MapPin className="inline mr-2" size={16} />
                    {t("customer.address")}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={customer.address}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                    placeholder={t("customer.enter_address")}
                  />
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <Building size={20} />
                {t("customer.business_info")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Building className="inline mr-2" size={16} />
                    {t("customer.company")}
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={customer.company}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                    placeholder={t("customer.enter_company")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Globe className="inline mr-2" size={16} />
                    {t("customer.website")}
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={customer.website}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                    placeholder={t("customer.enter_website")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Briefcase className="inline mr-2" size={16} />
                    {t("customer.industry")}
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={customer.industry}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                    placeholder={t("customer.enter_industry")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("customer.status")}
                  </label>
                  <select
                    name="status"
                    value={customer.status}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                  >
                    <option value="Active">{t("customer.status_active")}</option>
                    <option value="Inactive">{t("customer.status_inactive")}</option>
                    <option value="Prospect">{t("customer.status_prospect")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("customer.customerType")}
                  </label>
                  <select
                    name="customerType"
                    value={customer.customerType}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                  >
                    <option value="Individual">{t("customer.individual")}</option>
                    <option value="Corporate">{t("customer.corporate")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Calendar className="inline mr-2" size={16} />
                    {t("customer.lastContacted")}
                  </label>
                  <input
                    type="date"
                    name="lastContacted"
                    value={customer.lastContacted}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Individual Info (if applicable) */}
            {customer.customerType === "Individual" && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <User size={20} />
                  {t("customer.individual_info")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("customer.dateOfBirth")}
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={customer.dateOfBirth}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("customer.gender")}
                    </label>
                    <select
                      name="gender"
                      value={customer.gender}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                    >
                      <option value="">{t("customer.selectGender")}</option>
                      <option value="Male">{t("customer.male")}</option>
                      <option value="Female">{t("customer.female")}</option>
                      <option value="Other">{t("customer.other")}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Contacts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <Users size={20} />
                  {t("customer.contacts")}
                </h3>
                <button
                  type="button"
                  onClick={addContact}
                  className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                >
                  <Plus size={16} />
                  {t("customer.addContact")}
                </button>
              </div>

              <div className="space-y-4">
                {customer.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-xl relative"
                    style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>
                        {t("customer.contact")} #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="p-2 rounded-lg hover:scale-110 transition-all text-red-500"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="name"
                        placeholder={t("customer.contactName")}
                        value={contact.name}
                        onChange={(e) => handleContactChange(index, e)}
                        className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: 'var(--border-color)',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                        }}
                      />
                      <input
                        type="text"
                        name="position"
                        placeholder={t("customer.contactPosition")}
                        value={contact.position}
                        onChange={(e) => handleContactChange(index, e)}
                        className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: 'var(--border-color)',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                        }}
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder={t("customer.contactEmail")}
                        value={contact.email}
                        onChange={(e) => handleContactChange(index, e)}
                        className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: 'var(--border-color)',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                        }}
                      />
                      <input
                        type="text"
                        name="phone"
                        placeholder={t("customer.contactPhone")}
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, e)}
                        className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: 'var(--border-color)',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <MessageSquare className="inline mr-2" size={16} />
                {t("customer.notes")}
              </label>
              <textarea
                name="notes"
                value={customer.notes}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("customer.enter_notes")}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  {t("customer.creating")}
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  {t("customer.submit")}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddCustomers;
