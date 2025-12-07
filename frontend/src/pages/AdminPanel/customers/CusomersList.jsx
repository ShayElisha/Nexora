import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Mail,
  Phone,
  Building,
  Globe,
  Calendar,
  User,
  Briefcase,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";

const CustomersList = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: customers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data;
    },
  });

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchLower) ||
      customer.company?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.status === "Active").length,
    inactive: customers.filter((c) => c.status === "Inactive").length,
    prospects: customers.filter((c) => c.status === "Prospect").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("customersList.loading")}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("customersList.error_loading_customers")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-teal-600">
              <Users size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("customersList.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("customersList.manage_customers")}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("customersList.total_customers")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <User size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("customersList.active")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.active}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                  <User size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("customersList.inactive")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.inactive}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <Briefcase size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("customersList.prospects")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.prospects}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-secondary)' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("customersList.search_placeholder")}
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            />
          </div>
        </motion.div>

        {/* Customers Grid */}
        {filteredCustomers.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl" style={{ color: 'var(--color-secondary)' }}>
              {t("customersList.no_customers_found")}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer._id}
                className="rounded-2xl shadow-lg border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
              >
                {/* Card Header */}
                <div className="p-5 border-b" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: customer.status === 'Active' ? '#10b981' : customer.status === 'Prospect' ? '#f59e0b' : '#ef4444' }}>
                      {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold truncate" style={{ color: 'var(--button-text)' }}>
                        {customer.name || t("customersList.unnamed_customer")}
                      </h2>
                      <p className="text-sm opacity-90" style={{ color: 'var(--button-text)' }}>
                        {customer.email || t("customersList.no_email")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-color)' }}>
                    <Phone size={16} style={{ color: 'var(--color-secondary)' }} />
                    <span>{customer.phone || t("customersList.not_available")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-color)' }}>
                    <Building size={16} style={{ color: 'var(--color-secondary)' }} />
                    <span>{customer.company || t("customersList.not_available")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-color)' }}>
                    <Globe size={16} style={{ color: 'var(--color-secondary)' }} />
                    <span className="truncate">{customer.website || t("customersList.not_available")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-color)' }}>
                    <Briefcase size={16} style={{ color: 'var(--color-secondary)' }} />
                    <span>{customer.industry || t("customersList.not_available")}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                      {t("customersList.type")}:
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {customer.customerType || t("customersList.not_available")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-color)' }}>
                    <Calendar size={16} style={{ color: 'var(--color-secondary)' }} />
                    <span className="text-xs">
                      {t("customersList.customer_since")}: {customer.customerSince
                        ? new Date(customer.customerSince).toLocaleDateString()
                        : t("customersList.not_available")}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        customer.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : customer.status === "Prospect"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {customer.status || t("customersList.not_available")}
                    </span>
                  </div>

                  {customer.notes && (
                    <p className="text-xs mt-3 p-2 rounded-lg" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}>
                      {customer.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
                  <button className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}>
                    <Eye size={16} />
                    {t("customersList.view_details")}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersList;
