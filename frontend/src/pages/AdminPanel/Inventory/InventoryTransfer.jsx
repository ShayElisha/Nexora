import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Warehouse,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const InventoryTransfer = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fromWarehouseId = searchParams.get("from");
  const inventoryId = searchParams.get("inventoryId");

  const [formData, setFormData] = useState({
    inventoryId: inventoryId || "",
    fromWarehouseId: fromWarehouseId || "",
    toWarehouseId: "",
    quantity: "",
    toLocationId: "",
    notes: "",
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await axiosInstance.get("/warehouses");
      return response.data?.data || [];
    },
  });

  // Fetch source inventory if inventoryId provided
  const { data: sourceInventory } = useQuery({
    queryKey: ["inventory-item", inventoryId],
    queryFn: async () => {
      if (!inventoryId) return null;
      const response = await axiosInstance.get(`/inventory/item/${inventoryId}`);
      return response.data.data;
    },
    enabled: !!inventoryId,
  });

  useEffect(() => {
    if (sourceInventory) {
      setFormData((prev) => ({
        ...prev,
        inventoryId: sourceInventory._id,
        fromWarehouseId: sourceInventory.warehouseId || fromWarehouseId || "",
        quantity: "",
      }));
    }
  }, [sourceInventory, fromWarehouseId]);

  // Fetch locations for destination warehouse
  const { data: locations = [] } = useQuery({
    queryKey: ["warehouse-locations", formData.toWarehouseId],
    queryFn: async () => {
      if (!formData.toWarehouseId) return [];
      const response = await axiosInstance.get(
        `/warehouses/${formData.toWarehouseId}/locations`
      );
      return response.data?.data || [];
    },
    enabled: !!formData.toWarehouseId,
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post("/inventory/transfer", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("inventory.transfer_success", { defaultValue: "Transfer completed successfully" }));
      queryClient.invalidateQueries({ queryKey: ["warehouse-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      navigate(`/dashboard/inventory/warehouse/${formData.toWarehouseId}`);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          t("inventory.transfer_error", { defaultValue: "Failed to transfer inventory" })
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.inventoryId || !formData.fromWarehouseId || !formData.toWarehouseId || !formData.quantity) {
      toast.error(t("inventory.fill_all_fields", { defaultValue: "Please fill all required fields" }));
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast.error(t("inventory.same_warehouse", { defaultValue: "Source and destination warehouses must be different" }));
      return;
    }

    if (Number(formData.quantity) <= 0) {
      toast.error(t("inventory.invalid_quantity", { defaultValue: "Quantity must be greater than 0" }));
      return;
    }

    transferMutation.mutate({
      inventoryId: formData.inventoryId,
      fromWarehouseId: formData.fromWarehouseId,
      toWarehouseId: formData.toWarehouseId,
      quantity: Number(formData.quantity),
      toLocationId: formData.toLocationId || undefined,
      notes: formData.notes || undefined,
    });
  };

  const fromWarehouse = warehouses.find((w) => w._id === formData.fromWarehouseId);
  const toWarehouse = warehouses.find((w) => w._id === formData.toWarehouseId);
  const maxQuantity = sourceInventory?.quantity || 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <ArrowRight size={28} color="white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("inventory.transfer_inventory", { defaultValue: "Transfer Inventory" })}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("inventory.transfer_subtitle", {
                  defaultValue: "Move inventory between warehouses",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("inventory.from_warehouse", { defaultValue: "From Warehouse" })}
              </label>
              <select
                value={formData.fromWarehouseId}
                onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
                required
              >
                <option value="">
                  {t("inventory.select_warehouse", { defaultValue: "Select warehouse" })}
                </option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} {warehouse.code && `(${warehouse.code})`}
                  </option>
                ))}
              </select>
              {fromWarehouse && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Utilization: {fromWarehouse.utilization}% • Capacity: {fromWarehouse.capacity || "N/A"}
                  </span>
                </div>
              )}
            </div>

            {/* Destination Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("inventory.to_warehouse", { defaultValue: "To Warehouse" })}
              </label>
              <select
                value={formData.toWarehouseId}
                onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value, toLocationId: "" })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
                required
              >
                <option value="">
                  {t("inventory.select_warehouse", { defaultValue: "Select warehouse" })}
                </option>
                {warehouses
                  .filter((w) => w._id !== formData.fromWarehouseId)
                  .map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} {warehouse.code && `(${warehouse.code})`}
                    </option>
                  ))}
              </select>
              {toWarehouse && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Utilization: {toWarehouse.utilization}% • Capacity: {toWarehouse.capacity || "N/A"}
                  </span>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("inventory.quantity", { defaultValue: "Quantity" })}
                {maxQuantity > 0 && (
                  <span className="text-gray-500 ml-2">
                    ({t("inventory.max_available", { defaultValue: "Max available" })}: {maxQuantity})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="1"
                max={maxQuantity}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
                required
              />
              {maxQuantity > 0 && Number(formData.quantity) > maxQuantity && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    {t("inventory.insufficient_quantity", {
                      defaultValue: "Insufficient quantity. Maximum available:",
                    })}{" "}
                    {maxQuantity}
                  </span>
                </div>
              )}
            </div>

            {/* Location (optional) */}
            {formData.toWarehouseId && locations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("inventory.location", { defaultValue: "Location" })} ({t("common.optional", { defaultValue: "Optional" })})
                </label>
                <select
                  value={formData.toLocationId}
                  onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
                >
                  <option value="">
                    {t("inventory.no_location", { defaultValue: "No specific location" })}
                  </option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name} {location.zone && `(${location.zone})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("inventory.notes", { defaultValue: "Notes" })} ({t("common.optional", { defaultValue: "Optional" })})
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
                placeholder={t("inventory.transfer_notes_placeholder", {
                  defaultValue: "Add any notes about this transfer...",
                })}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button
                type="submit"
                disabled={transferMutation.isPending}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {transferMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t("inventory.transferring", { defaultValue: "Transferring..." })}
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    {t("inventory.transfer", { defaultValue: "Transfer" })}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryTransfer;

