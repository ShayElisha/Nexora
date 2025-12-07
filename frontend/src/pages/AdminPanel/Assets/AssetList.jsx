import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Calendar,
  MapPin,
  Building2,
  Car,
  Monitor,
  Settings,
  FileText,
  DollarSign,
  BarChart3,
} from "lucide-react";

const AssetList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch assets
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["assets", page, filterType, filterStatus, searchTerm, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });
      if (filterType !== "all") params.append("assetType", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await axiosInstance.get(`/assets?${params}`);
      return response.data;
    },
  });

  // Delete mutation
  const { mutate: deleteAsset } = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(t("assets.delete_success"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("assets.delete_error"));
    },
  });

  const assets = assetsData?.data || [];
  const pagination = assetsData?.pagination || {};

  const getAssetTypeIcon = (type) => {
    const icons = {
      Equipment: Settings,
      Machinery: Wrench,
      Vehicle: Car,
      Furniture: Package,
      IT: Monitor,
      "Office Equipment": FileText,
      Building: Building2,
      Land: MapPin,
      Other: Package,
    };
    return icons[type] || Package;
  };

  const getStatusStyle = (status) => {
    const styles = {
      Active: { backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#16a34a" },
      "In Maintenance": { backgroundColor: "rgba(234, 179, 8, 0.1)", color: "#ca8a04" },
      "Out of Service": { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#dc2626" },
      Retired: { backgroundColor: "rgba(107, 114, 128, 0.1)", color: "#6b7280" },
      Sold: { backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb" },
      Stolen: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#dc2626" },
      Disposed: { backgroundColor: "rgba(107, 114, 128, 0.1)", color: "#6b7280" },
    };
    return styles[status] || { backgroundColor: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Package size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("assets.title")}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("assets.title")}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard/assets/add")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              <Plus size={20} />
              {t("assets.add_asset")}
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 mb-6"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                size={20}
                style={{ color: "var(--color-secondary)" }}
              />
              <input
                type="text"
                placeholder={t("assets.search_placeholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("assets.all_types")}</option>
              <option value="Equipment">{t("assets.types.equipment")}</option>
              <option value="Machinery">{t("assets.types.machinery")}</option>
              <option value="Vehicle">{t("assets.types.vehicle")}</option>
              <option value="Furniture">{t("assets.types.furniture")}</option>
              <option value="IT">{t("assets.types.it")}</option>
              <option value="Office Equipment">{t("assets.types.office_equipment")}</option>
              <option value="Building">{t("assets.types.building")}</option>
              <option value="Land">{t("assets.types.land")}</option>
              <option value="Other">{t("assets.types.other")}</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("assets.all_statuses")}</option>
              <option value="Active">{t("assets.statuses.active")}</option>
              <option value="In Maintenance">{t("assets.statuses.in_maintenance")}</option>
              <option value="Out of Service">{t("assets.statuses.out_of_service")}</option>
              <option value="Retired">{t("assets.statuses.retired")}</option>
              <option value="Sold">{t("assets.statuses.sold")}</option>
              <option value="Stolen">{t("assets.statuses.stolen")}</option>
              <option value="Disposed">{t("assets.statuses.disposed")}</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split("-");
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="createdAt-desc">{t("assets.sort_options.newest")}</option>
              <option value="createdAt-asc">{t("assets.sort_options.oldest")}</option>
              <option value="name-asc">{t("assets.sort_options.name_asc")}</option>
              <option value="name-desc">{t("assets.sort_options.name_desc")}</option>
              <option value="purchasePrice-desc">{t("assets.sort_options.price_high")}</option>
              <option value="purchasePrice-asc">{t("assets.sort_options.price_low")}</option>
            </select>
          </div>
        </motion.div>

        {/* Assets Grid */}
        {isLoading ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: "var(--border-color)", borderTopColor: "var(--color-primary)" }}
            />
            <p className="mt-4" style={{ color: "var(--text-color)" }}>{t("assets.loading")}</p>
          </motion.div>
        ) : assets.length === 0 ? (
          <motion.div
            className="text-center py-16 rounded-2xl shadow-lg border"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Package size={48} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--color-secondary)" }}>{t("assets.no_assets")}</p>
          </motion.div>
        ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => {
              const Icon = getAssetTypeIcon(asset.assetType);
              return (
                <motion.div
                  key={asset._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl shadow-lg border p-6 transition-all hover:scale-105"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: "var(--color-primary-light)" }}
                      >
                        <Icon size={24} style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" style={{ color: "var(--text-color)" }}>
                          {asset.name}
                        </h3>
                        <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{asset.assetType}</p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={getStatusStyle(asset.status)}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {asset.serialNumber && (
                      <p className="text-sm" style={{ color: "var(--text-color)" }}>
                        <span className="font-medium">{t("assets.fields.serial_number")}:</span> {asset.serialNumber}
                      </p>
                    )}
                    {asset.departmentId?.name && (
                      <p className="text-sm" style={{ color: "var(--text-color)" }}>
                        <span className="font-medium">{t("assets.fields.department")}:</span> {asset.departmentId.name}
                      </p>
                    )}
                    {asset.purchasePrice > 0 && (
                      <p className="text-sm" style={{ color: "var(--text-color)" }}>
                        <span className="font-medium">{t("assets.fields.purchase_price")}:</span>{" "}
                        {asset.purchasePrice.toLocaleString()} {asset.purchaseCurrency || "ILS"}
                      </p>
                    )}
                    {asset.depreciation?.currentValue && (
                      <p className="text-sm" style={{ color: "var(--text-color)" }}>
                        <span className="font-medium">{t("assets.overview.current_value")}:</span>{" "}
                        {asset.depreciation.currentValue.toLocaleString()} {asset.purchaseCurrency || "ILS"}
                      </p>
                    )}
                  </div>

                  {asset.maintenanceSchedule?.nextMaintenanceDate && (
                    <div
                      className="mb-4 p-3 rounded-xl border"
                      style={{
                        backgroundColor: "rgba(234, 179, 8, 0.1)",
                        borderColor: "rgba(234, 179, 8, 0.3)",
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} style={{ color: "#d97706" }} />
                        <span style={{ color: "#92400e" }}>
                          {t("assets.maintenance.next_maintenance")}:{" "}
                          {new Date(asset.maintenanceSchedule.nextMaintenanceDate).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                    <button
                      onClick={() => navigate(`/dashboard/assets/${asset._id}`)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border transition-all hover:scale-105"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <Eye size={16} className="inline mr-1" />
                      {t("assets.view")}
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/assets/${asset._id}/edit`)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border transition-all hover:scale-105"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <Edit size={16} className="inline mr-1" />
                      {t("assets.edit")}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t("assets.delete_confirm"))) {
                          deleteAsset(asset._id);
                        }
                      }}
                      className="px-3 py-2 text-sm rounded-xl border transition-all hover:scale-105"
                      style={{
                        borderColor: "rgba(239, 68, 68, 0.3)",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <motion.div
              className="flex justify-center items-center gap-2 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  borderColor: page === 1 ? "var(--border-color)" : "var(--color-primary)",
                  backgroundColor: page === 1 ? "var(--border-color)" : "var(--color-primary)",
                  color: page === 1 ? "var(--text-color)" : "var(--button-text)",
                }}
              >
                {t("assets.previous")}
              </button>
              <span className="px-4 py-2" style={{ color: "var(--text-color)" }}>
                {t("assets.page")} {pagination.page} {t("assets.of")} {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  borderColor: page === pagination.pages ? "var(--border-color)" : "var(--color-primary)",
                  backgroundColor: page === pagination.pages ? "var(--border-color)" : "var(--color-primary)",
                  color: page === pagination.pages ? "var(--text-color)" : "var(--button-text)",
                }}
              >
                {t("assets.next")}
              </button>
            </motion.div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default AssetList;

