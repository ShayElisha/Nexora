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
  ArrowRightLeft,
  Package,
  Calendar,
  Filter,
  Warehouse,
} from "lucide-react";

const InventoryMovementsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["inventory-movements"],
    queryFn: async () => {
      const res = await axiosInstance.get("/inventory-advanced/movements");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/inventory-advanced/movements/${id}`);
    },
    onSuccess: () => {
      toast.success(t("inventory.movement_deleted") || "Movement deleted successfully");
      queryClient.invalidateQueries(["inventory-movements"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete movement");
    },
  });

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.movementNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || movement.movementType === filterType;
    const matchesStatus = filterStatus === "all" || movement.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type) => {
    const colors = {
      Internal: "bg-blue-100 text-blue-800",
      External: "bg-green-100 text-green-800",
      Production: "bg-purple-100 text-purple-800",
      Service: "bg-orange-100 text-orange-800",
      Adjustment: "bg-yellow-100 text-yellow-800",
      Return: "bg-red-100 text-red-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("inventory.movements") || "Inventory Movements"}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {t("inventory.movements_description") || "Track and manage inventory movements"}
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/inventory/movements/add")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus size={20} />
              {t("inventory.add_movement") || "Add Movement"}
            </button>
          </div>

          <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: "var(--text-secondary)" }} />
                  <input
                    type="text"
                    placeholder={t("inventory.search_movements") || "Search movements..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  <option value="all">{t("inventory.all_types") || "All Types"}</option>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                  <option value="Production">Production</option>
                  <option value="Service">Service</option>
                  <option value="Adjustment">Adjustment</option>
                  <option value="Return">Return</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  <option value="all">{t("inventory.all_statuses") || "All Statuses"}</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--color-primary)" }}></div>
                  <p className="mt-4" style={{ color: "var(--text-secondary)" }}>Loading...</p>
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                  <Package size={64} className="mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
                  <p style={{ color: "var(--text-secondary)" }}>
                    {t("inventory.no_movements") || "No movements found"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border-t" style={{ borderColor: "var(--border-color)" }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.movement_number") || "Movement #"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.product") || "Product"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.type") || "Type"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.quantity") || "Quantity"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.from_warehouse") || "From"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.to_warehouse") || "To"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.date") || "Date"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.status") || "Status"}</th>
                        <th className="text-left p-3 font-semibold" style={{ color: "var(--text-color)" }}>{t("inventory.actions") || "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.map((movement) => (
                        <motion.tr
                          key={movement._id}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          style={{ borderColor: "var(--border-color)" }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="p-3 font-mono" style={{ color: "var(--text-color)" }}>{movement.movementNumber}</td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>{movement.productName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-sm ${getTypeColor(movement.movementType)}`}>
                              {movement.movementType}
                            </span>
                          </td>
                          <td className="p-3 font-semibold" style={{ color: "var(--text-color)" }}>{movement.quantity}</td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>{movement.fromWarehouseId?.name || "-"}</td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>{movement.toWarehouseId?.name || "-"}</td>
                          <td className="p-3" style={{ color: "var(--text-color)" }}>
                            {movement.movementDate
                              ? new Date(movement.movementDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                movement.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : movement.status === "Approved"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {movement.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/dashboard/inventory/movements/${movement._id}`)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                style={{ color: "var(--color-primary)" }}
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  const confirmMessage = t("inventory.confirm_delete_movement") || "Are you sure you want to delete this movement?";
                                  if (window.confirm(confirmMessage)) {
                                    deleteMutation.mutate(movement._id);
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              >
                                <Trash2 size={18} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryMovementsList;

