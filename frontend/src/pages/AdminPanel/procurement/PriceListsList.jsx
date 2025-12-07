import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Tag,
  Filter,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";

const PriceListsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: priceLists = [], isLoading, isError } = useQuery({
    queryKey: ["price-lists"],
    queryFn: async () => {
      const res = await axiosInstance.get("/procurement-advanced/price-lists");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/procurement-advanced/price-lists/${id}`);
    },
    onSuccess: () => {
      toast.success(t("procurement.price_list_deleted") || "Price list deleted successfully");
      queryClient.invalidateQueries(["price-lists"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete price list");
    },
  });

  const filteredLists = priceLists.filter((list) => {
    const matchesSearch =
      list.priceListName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.priceListNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || list.priceListType === filterType;
    const matchesStatus = filterStatus === "all" || list.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type) => {
    const colors = {
      Customer: "bg-blue-100 text-blue-800",
      Supplier: "bg-green-100 text-green-800",
      Internal: "bg-gray-100 text-gray-800",
      Promotional: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
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
          <p style={{ color: 'var(--text-color)' }}>{t("procurement.loading") || "Loading..."}</p>
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
            {t("procurement.error_loading_price_lists") || "Error loading price lists"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.price_lists") || "Price Lists"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("procurement.price_lists_description") || "Manage and track price lists"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/procurement/price-lists/add")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("procurement.add_price_list") || "Add Price List"}
          </button>
        </div>

        <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("procurement.search_price_lists") || "Search price lists..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_types") || "All Types"}</option>
              <option value="Customer">{t("procurement.customer") || "Customer"}</option>
              <option value="Supplier">{t("procurement.supplier") || "Supplier"}</option>
              <option value="Internal">{t("procurement.internal") || "Internal"}</option>
              <option value="Promotional">{t("procurement.promotional") || "Promotional"}</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_statuses") || "All Statuses"}</option>
              <option value="Draft">{t("procurement.draft") || "Draft"}</option>
              <option value="Active">{t("procurement.active") || "Active"}</option>
              <option value="Expired">{t("procurement.expired") || "Expired"}</option>
            </select>
            </div>
          </div>
          {filteredLists.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <Tag size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t("procurement.no_price_lists") || "No price lists found"}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLists.map((list) => (
                <motion.div
                  key={list._id}
                  className="border rounded-lg p-4 hover:shadow-lg transition"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                        {list.priceListName}
                      </h3>
                      <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {list.priceListNumber}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/dashboard/procurement/price-lists/${list._id}/edit`)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const confirmMessage = t("procurement.confirm_delete") || "Are you sure you want to delete this price list?";
                          if (window.confirm(confirmMessage)) {
                            deleteMutation.mutate(list._id);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{t("procurement.type") || "Type"}:</span>
                      <span className={`px-2 py-1 rounded text-sm ${getTypeColor(list.priceListType)}`}>
                        {list.priceListType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{t("procurement.items") || "Items"}:</span>
                      <span style={{ color: 'var(--text-color)' }}>{list.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{t("procurement.currency") || "Currency"}:</span>
                      <span style={{ color: 'var(--text-color)' }}>{list.currency || "USD"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{t("procurement.valid_from") || "Valid From"}:</span>
                      <span style={{ color: 'var(--text-color)' }}>
                        {list.startDate ? new Date(list.startDate).toLocaleDateString() : "-"}
                      </span>
                    </div>
                    {list.endDate && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>{t("procurement.valid_to") || "Valid To"}:</span>
                        <span style={{ color: 'var(--text-color)' }}>
                          {new Date(list.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{t("procurement.status") || "Status"}:</span>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          list.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : list.status === "Expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {list.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PriceListsList;

