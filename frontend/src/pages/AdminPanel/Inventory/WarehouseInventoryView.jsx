import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Warehouse,
  Package,
  ArrowLeft,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  MapPin,
  RefreshCw,
  Edit,
  ArrowRight,
} from "lucide-react";

const WarehouseInventoryView = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const { warehouseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");

  // Fetch warehouse inventory
  const { data: warehouseData, isLoading: loading } = useQuery({
    queryKey: ["warehouse-inventory", warehouseId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/inventory/warehouse/${warehouseId}`);
      return response.data.data;
    },
    enabled: !!warehouseId,
  });

  const warehouse = warehouseData?.warehouse;
  const inventory = warehouseData?.inventory || [];
  const statistics = warehouseData?.statistics || {};

  // Filter inventory
  const filteredInventory = inventory.filter((item) => {
    const product = item.productId;
    if (!product) return false;

    const productName = product.productName || "";
    const sku = product.SKU || "";
    const category = product.category || "";

    // Search filter
    if (
      searchTerm &&
      !productName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !sku.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (filterCategory !== "all" && category !== filterCategory) {
      return false;
    }

    // Stock status filter
    if (filterStockStatus !== "all") {
      const quantity = item.quantity || 0;
      const minStock = item.minStockLevel || 0;
      if (filterStockStatus === "low" && quantity >= minStock) return false;
      if (filterStockStatus === "out" && quantity > 0) return false;
      if (filterStockStatus === "ok" && quantity < minStock) return false;
    }

    return true;
  });

  // Get unique categories
  const categories = Array.from(
    new Set(inventory.map((item) => item.productId?.category).filter(Boolean))
  );

  const getStockStatus = (item) => {
    const quantity = item.quantity || 0;
    const minStock = item.minStockLevel || 0;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Warehouse not found</p>
          <button
            onClick={() => navigate("/dashboard/warehouses")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Warehouses
          </button>
        </div>
      </div>
    );
  }

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
            <button
              onClick={() => navigate("/dashboard/warehouses")}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Warehouse size={28} color="white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {warehouse.name}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {warehouse.code && `Code: ${warehouse.code}`} • Utilization: {warehouse.utilization}%
              </p>
            </div>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["warehouse-inventory", warehouseId] });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("inventory.total_items", { defaultValue: "Total Items" })}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics.totalItems || 0}
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
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("inventory.total_quantity", { defaultValue: "Total Quantity" })}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics.totalQuantity || 0}
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
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("inventory.total_value", { defaultValue: "Total Value" })}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ${(statistics.totalValue || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("inventory.low_stock_items", { defaultValue: "Low Stock" })}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics.lowStockItems || 0}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertTriangle className="text-orange-600" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t("inventory.search_placeholder", { defaultValue: "Search products..." })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800 placeholder-gray-400 shadow-sm"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800 shadow-sm"
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
              className="px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800 shadow-sm"
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
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {filteredInventory.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="size-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {t("inventory.no_products", { defaultValue: "No products found" })}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isRTL ? 'bg-gradient-to-l from-gray-50 to-gray-100' : 'bg-gradient-to-r from-gray-50 to-gray-100'}>
                  <tr>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("inventory.product", { defaultValue: "Product" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("inventory.category", { defaultValue: "Category" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("inventory.quantity", { defaultValue: "Quantity" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("inventory.min_stock", { defaultValue: "Min Stock" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("inventory.status_label", { defaultValue: "Status" })}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("inventory.location", { defaultValue: "Location" })}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      {t("common.actions", { defaultValue: "Actions" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item);
                    const product = item.productId || {};

                    return (
                      <tr key={item._id} className="hover:bg-gray-50 transition">
                        <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {product.productName || t("inventory.unknown_product", { defaultValue: "Unknown" })}
                            </p>
                            <p className="text-sm text-gray-500">{product.SKU || "-"}</p>
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {product.category || "-"}
                        </td>
                        <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <span className="font-semibold text-gray-800">
                            {item.quantity ?? 0}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {item.minStockLevel ?? "-"}
                        </td>
                        <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(status)}`}
                          >
                            {status === "out" && t("inventory.out_of_stock", { defaultValue: "Out of Stock" })}
                            {status === "low" && t("inventory.low_stock", { defaultValue: "Low Stock" })}
                            {status === "ok" && t("inventory.in_stock", { defaultValue: "In Stock" })}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {item.locationId?.name || item.shelfLocation ? (
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <MapPin className="size-4" />
                              {item.locationId?.name || item.shelfLocation}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <button
                              onClick={() => navigate(`/dashboard/inventory/transfer?from=${warehouseId}&inventoryId=${item._id}`)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                              title={t("inventory.transfer", { defaultValue: "Transfer" })}
                            >
                              <ArrowRight className="size-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/inventory?productId=${item.productId?._id}`)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                              title={t("common.edit", { defaultValue: "Edit" })}
                            >
                              <Edit className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseInventoryView;

