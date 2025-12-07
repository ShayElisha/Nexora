import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Edit,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const InventoryManagement = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [sortOption, setSortOption] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch inventory data
  const { data: inventoryData, isLoading: loading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await axiosInstance.get("/inventory");
      return response.data.data || [];
    },
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["inventory-statistics"],
    queryFn: async () => {
      const response = await axiosInstance.get("/inventory/statistics");
      return response.data.data || {};
    },
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: async () => {
      const response = await axiosInstance.get("/inventory/alerts");
      return response.data.data || { lowStock: [], expiring: [] };
    },
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await axiosInstance.get("/warehouses");
      return response.data?.data || [];
    },
  });

  // Update inventory mutation
  const { mutate: updateInventory } = useMutation({
    mutationFn: async ({ productId, data }) => {
      const response = await axiosInstance.put(`/inventory/${productId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
      toast.success(t("inventory.update_success", { defaultValue: "Inventory updated successfully" }));
      setEditModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          t("inventory.update_error", { defaultValue: "Failed to update inventory" })
      );
    },
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!inventoryData) return [];

    let filtered = inventoryData.filter((item) => {
      const product = item.productName || "";
      const sku = item.SKU || "";
      const category = item.category || "";

      // Search filter
      if (
        searchTerm &&
        !product.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !sku.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (filterCategory !== "all" && category !== filterCategory) {
        return false;
      }

      // Stock status filter
      if (filterStockStatus !== "all" && item.inventory) {
        const quantity = item.inventory.quantity || 0;
        const minStock = item.inventory.minStockLevel || 0;
        if (filterStockStatus === "low" && quantity >= minStock) return false;
        if (filterStockStatus === "out" && quantity > 0) return false;
        if (filterStockStatus === "ok" && quantity < minStock) return false;
      }

      // Warehouse filter
      if (filterWarehouse !== "all" && item.inventory) {
        const warehouseId = item.inventory.warehouseId?.toString() || item.inventory.warehouseId;
        if (warehouseId !== filterWarehouse) return false;
      }

      return true;
    });

    // Sort
    if (sortOption) {
      const [field, direction] = sortOption.split("_");
      filtered.sort((a, b) => {
        let aVal, bVal;
        if (field === "quantity") {
          aVal = a.inventory?.quantity || 0;
          bVal = b.inventory?.quantity || 0;
        } else if (field === "productName") {
          aVal = (a.productName || "").toLowerCase();
          bVal = (b.productName || "").toLowerCase();
        } else if (field === "category") {
          aVal = (a.category || "").toLowerCase();
          bVal = (b.category || "").toLowerCase();
        } else {
          return 0;
        }

        if (direction === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [inventoryData, searchTerm, filterCategory, filterStockStatus, filterWarehouse, sortOption]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!inventoryData) return [];
    return Array.from(new Set(inventoryData.map((item) => item.category).filter(Boolean)));
  }, [inventoryData]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleSave = (formData) => {
    // בדיקה אם יש inventoryId (מה-inventory._id) או inventoryId מה-selectedItem
    const inventoryId = selectedItem?.inventoryId || selectedItem?.inventory?._id;
    if (!inventoryId) {
      toast.error(t("inventory.no_inventory_record", { defaultValue: "No inventory record found" }));
      return;
    }
    updateInventory({
      productId: inventoryId, // זה בעצם inventoryId, לא productId
      data: formData,
    });
  };

  const getStockStatus = (item) => {
    if (!item.inventory) return "unknown";
    const quantity = item.inventory.quantity || 0;
    const minStock = item.inventory.minStockLevel || 0;
    if (quantity === 0) return "out";
    if (quantity < minStock) return "low";
    return "ok";
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case "out":
        return "text-red-600 bg-red-50";
      case "low":
        return "text-orange-600 bg-orange-50";
      case "ok":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStockStatusText = (status) => {
    switch (status) {
      case "out":
        return t("inventory.out_of_stock", { defaultValue: "Out of Stock" });
      case "low":
        return t("inventory.low_stock", { defaultValue: "Low Stock" });
      case "ok":
        return t("inventory.in_stock", { defaultValue: "In Stock" });
      default:
        return t("inventory.unknown", { defaultValue: "Unknown" });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Package size={28} color="white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("inventory.management", { defaultValue: "Inventory Management" })}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("inventory.subtitle", {
                  defaultValue: "Monitor stock levels, track movements, and manage inventory efficiently",
                })}
              </p>
            </div>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["inventory"] });
                queryClient.invalidateQueries({ queryKey: ["inventory-statistics"] });
                queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
              }}
              className="px-4 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)"
              }}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4" />
                {t("common.refresh", { defaultValue: "Refresh" })}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-blue-500 transform hover:-translate-y-1"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {t("inventory.total_products", { defaultValue: "Total Products" })}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {statistics.totalProducts || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="text-blue-600" size={24} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-green-500 transform hover:-translate-y-1"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {t("inventory.total_value", { defaultValue: "Total Value" })}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                    ${(statistics.totalValue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-orange-500 transform hover:-translate-y-1"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {t("inventory.low_stock_items", { defaultValue: "Low Stock Items" })}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {statistics.lowStockCount || 0}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <AlertTriangle className="text-orange-600" size={24} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-red-500 transform hover:-translate-y-1"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {t("inventory.out_of_stock", { defaultValue: "Out of Stock" })}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {statistics.outOfStockCount || 0}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <XCircle className="text-red-600" size={24} />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Alerts Section */}
        {alertsData && (alertsData.lowStock?.length > 0 || alertsData.expiring?.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {alertsData.lowStock?.length > 0 && (
              <div className="rounded-2xl border-l-4 border-orange-500 shadow-lg p-6" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <AlertTriangle className="size-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
                    {t("inventory.low_stock_alerts", { defaultValue: "Low Stock Alerts" })} (
                    {alertsData.lowStock.length})
                  </h3>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {alertsData.lowStock.slice(0, 5).map((alert) => (
                    <div key={alert.inventoryId} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                        <span className="font-semibold">{alert.productName}</span>
                        <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                          {t("inventory.current_quantity", { defaultValue: "Current" })}: {alert.currentQuantity} /{" "}
                          {t("inventory.minimum", { defaultValue: "Min" })}: {alert.minStockLevel}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alertsData.expiring?.length > 0 && (
              <div className="rounded-2xl border-l-4 border-yellow-500 shadow-lg p-6" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Clock className="size-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
                    {t("inventory.expiring_items", { defaultValue: "Expiring Items" })} (
                    {alertsData.expiring.length})
                  </h3>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {alertsData.expiring.slice(0, 5).map((alert) => (
                    <div key={alert.inventoryId} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                        <span className="font-semibold">{alert.productName}</span>
                        <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                          {alert.daysUntilExpiration}{" "}
                          {t("inventory.days_left", { defaultValue: "days left" })}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters and Search */}
        <div className="rounded-2xl p-6 shadow-lg mb-6" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("inventory.search_placeholder", { defaultValue: "Search products..." })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">
                {t("inventory.all_categories", { defaultValue: "All Categories" })}
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value)}
              className="px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">
                {t("inventory.all_status", { defaultValue: "All Status" })}
              </option>
              <option value="ok">
                {t("inventory.in_stock", { defaultValue: "In Stock" })}
              </option>
              <option value="low">
                {t("inventory.low_stock", { defaultValue: "Low Stock" })}
              </option>
              <option value="out">
                {t("inventory.out_of_stock", { defaultValue: "Out of Stock" })}
              </option>
            </select>

            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">
                {t("inventory.all_warehouses", { defaultValue: "All Warehouses" })}
              </option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="">{t("inventory.sort_by", { defaultValue: "Sort By" })}</option>
              <option value="productName_asc">
                {t("inventory.name_asc", { defaultValue: "Name (A-Z)" })}
              </option>
              <option value="productName_desc">
                {t("inventory.name_desc", { defaultValue: "Name (Z-A)" })}
              </option>
              <option value="quantity_asc">
                {t("inventory.quantity_asc", { defaultValue: "Quantity (Low to High)" })}
              </option>
              <option value="quantity_desc">
                {t("inventory.quantity_desc", { defaultValue: "Quantity (High to Low)" })}
              </option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="size-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p style={{ color: 'var(--text-secondary)' }}>
                {t("inventory.loading", { defaultValue: "Loading inventory..." })}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="size-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                {t("inventory.no_products", { defaultValue: "No products found" })}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isRTL ? 'bg-gradient-to-l from-gray-50 to-gray-100' : 'bg-gradient-to-r from-gray-50 to-gray-100'}>
                  <tr>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("inventory.product", { defaultValue: "Product" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("inventory.category", { defaultValue: "Category" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("inventory.quantity", { defaultValue: "Quantity" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("inventory.min_stock", { defaultValue: "Min Stock" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("inventory.status_label", { defaultValue: "Status" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("inventory.warehouse", { defaultValue: "Warehouse" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("inventory.location", { defaultValue: "Location" })}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("common.actions", { defaultValue: "Actions" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((item) => {
                    const status = getStockStatus(item);
                    const inventory = item.inventory || {};
                    const isExpanded = expandedRows.includes(item._id);

                    return (
                      <React.Fragment key={item._id}>
                        <tr
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                          style={{ borderColor: 'var(--border-color)' }}
                          onClick={() => toggleRow(item._id)}
                        >
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <div>
                              <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                                {item.productName || t("inventory.unknown_product", { defaultValue: "Unknown" })}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.SKU || "-"}</p>
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>{item.category || "-"}</td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                              {inventory.quantity ?? 0}
                            </span>
                          </td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>{inventory.minStockLevel ?? "-"}</td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(
                                status
                              )}`}
                            >
                              {getStockStatusText(status)}
                            </span>
                          </td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                            {inventory.warehouseId ? (
                              (() => {
                                const warehouse = warehouses.find(w => w._id === inventory.warehouseId);
                                return warehouse ? warehouse.name : "-";
                              })()
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                            {inventory.shelfLocation ? (
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <MapPin className="size-4" />
                                {inventory.shelfLocation}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(item);
                                }}
                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                                title={t("common.edit", { defaultValue: "Edit" })}
                              >
                                <Edit className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                                <div>
                                  <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    {t("inventory.reorder_quantity", { defaultValue: "Reorder Quantity" })}
                                  </p>
                                  <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                                    {inventory.reorderQuantity ?? "-"}
                                  </p>
                                </div>
                                {inventory.batchNumber && (
                                  <div>
                                    <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                                      {t("inventory.batch_number", { defaultValue: "Batch Number" })}
                                    </p>
                                    <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                                      {inventory.batchNumber}
                                    </p>
                                  </div>
                                )}
                                {inventory.expirationDate && (
                                  <div>
                                    <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                                      {t("inventory.expiration_date", { defaultValue: "Expiration Date" })}
                                    </p>
                                    <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                                      {new Date(inventory.expirationDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {inventory.lastOrderDate && (
                                  <div>
                                    <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                                      {t("inventory.last_order", { defaultValue: "Last Order" })}
                                    </p>
                                    <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                                      {new Date(inventory.lastOrderDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedItem && (
        <EditInventoryModal
          item={selectedItem}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedItem(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// Edit Inventory Modal Component
const EditInventoryModal = ({ item, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    quantity: item.inventory?.quantity || 0,
    minStockLevel: item.inventory?.minStockLevel || 10,
    reorderQuantity: item.inventory?.reorderQuantity || 20,
    batchNumber: item.inventory?.batchNumber || "",
    expirationDate: item.inventory?.expirationDate
      ? new Date(item.inventory.expirationDate).toISOString().split("T")[0]
      : "",
    shelfLocation: item.inventory?.shelfLocation || "",
    lastOrderDate: item.inventory?.lastOrderDate
      ? new Date(item.inventory.lastOrderDate).toISOString().split("T")[0]
      : "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-slide-in relative"
        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-color)' }}>
              {t("inventory.edit_inventory", { defaultValue: "Edit Inventory" })}
            </h2>
            <button
              onClick={onClose}
              className="text-xl transition-all duration-200 transform hover:scale-110"
              style={{ color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {item.productName || t("inventory.product", { defaultValue: "Product" })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("inventory.quantity", { defaultValue: "Quantity" })}
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("inventory.min_stock_level", { defaultValue: "Min Stock Level" })}
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) =>
                  setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("inventory.reorder_quantity", { defaultValue: "Reorder Quantity" })}
              </label>
              <input
                type="number"
                min="0"
                value={formData.reorderQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, reorderQuantity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("inventory.shelf_location", { defaultValue: "Shelf Location" })}
              </label>
              <input
                type="text"
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("inventory.location_placeholder", { defaultValue: "e.g., A-12-B" })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("inventory.batch_number", { defaultValue: "Batch Number" })}
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("inventory.expiration_date", { defaultValue: "Expiration Date" })}
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("inventory.last_order_date", { defaultValue: "Last Order Date" })}
              </label>
              <input
                type="date"
                value={formData.lastOrderDate}
                onChange={(e) => setFormData({ ...formData, lastOrderDate: e.target.value })}
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
            >
              {t("common.save", { defaultValue: "Save" })}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InventoryManagement;
