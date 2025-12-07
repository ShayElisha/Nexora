import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Factory,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const ProductionOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState("");

  // Fetch production order
  const { data: order, isLoading } = useQuery({
    queryKey: ["production-order", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/production-orders/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      return axiosInstance.put(`/production-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success("סטטוס ההזמנה עודכן");
      queryClient.invalidateQueries(["production-order", id]);
      queryClient.invalidateQueries(["production-orders"]);
      setSelectedStatus("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה בעדכון סטטוס");
    },
  });

  const handleStatusChange = (newStatus) => {
    if (window.confirm(`האם אתה בטוח שברצונך לשנות את הסטטוס ל-${newStatus}?`)) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "On Hold":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">הזמנת ייצור לא נמצאה</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ backgroundColor: "var(--border-color)" }}
            >
              <ArrowLeft size={20} style={{ color: "var(--text-color)" }} />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Factory size={28} color="white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {order.orderNumber}
                </h1>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getPriorityColor(order.priority)}`}>
                  {order.priority}
                </span>
              </div>
              <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
                {order.productName} x {order.quantity}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <motion.div
              className="p-6 rounded-xl border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                פרטי הזמנה
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    מוצר
                  </p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>
                    {order.productName}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    כמות
                  </p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>
                    {order.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    תאריך יעד
                  </p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>
                    {new Date(order.dueDate).toLocaleDateString("he-IL")}
                  </p>
                </div>
                {order.startDate && (
                  <div>
                    <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                      תאריך התחלה
                    </p>
                    <p className="font-medium" style={{ color: "var(--text-color)" }}>
                      {new Date(order.startDate).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                )}
                {order.completedDate && (
                  <div>
                    <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                      תאריך השלמה
                    </p>
                    <p className="font-medium" style={{ color: "var(--text-color)" }}>
                      {new Date(order.completedDate).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                )}
                {order.customerOrderId && (
                  <div className="col-span-2">
                    <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                      הזמנת לקוח קשורה
                    </p>
                    <button
                      onClick={() => navigate(`/dashboard/Customers/Orders/${order.customerOrderId._id || order.customerOrderId}`)}
                      className="text-blue-600 hover:underline"
                    >
                      #{order.customerOrderId._id?.toString().slice(-6) || order.customerOrderId.toString().slice(-6)}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Components */}
            {order.components && order.components.length > 0 && (
              <motion.div
                className="p-6 rounded-xl border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                  רכיבים נדרשים
                </h2>
                <div className="space-y-3">
                  {order.components.map((component, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: "var(--border-color)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium" style={{ color: "var(--text-color)" }}>
                            {component.componentName || component.componentId?.productName || "רכיב"}
                          </p>
                          <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                            נדרש: {component.requiredQuantity} | זמין: {component.availableQuantity} | 
                            שמור: {component.reservedQuantity || 0}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            component.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : component.status === "Partial"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {component.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Missing Components */}
            {order.missingComponents && order.missingComponents.length > 0 && (
              <motion.div
                className="p-6 rounded-xl border border-red-200 bg-red-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                  <h2 className="text-xl font-semibold text-red-800">רכיבים חסרים</h2>
                </div>
                <div className="space-y-3">
                  {order.missingComponents.map((component, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-white border border-red-200"
                    >
                      <p className="font-medium text-red-800">{component.componentName}</p>
                      <p className="text-sm text-red-600">
                        נדרש: {component.required} | זמין: {component.available} | חסר: {component.missing}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {order.notes && (
              <motion.div
                className="p-6 rounded-xl border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                  הערות
                </h2>
                <p style={{ color: "var(--text-color)" }}>{order.notes}</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <motion.div
              className="p-6 rounded-xl border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                פעולות
              </h2>
              <div className="space-y-2">
                {order.status !== "In Progress" && order.status !== "Completed" && (
                  <button
                    onClick={() => handleStatusChange("In Progress")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--button-text)",
                    }}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <TrendingUp size={18} />
                        התחל ייצור
                      </>
                    )}
                  </button>
                )}
                {order.status === "In Progress" && (
                  <button
                    onClick={() => handleStatusChange("Completed")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2 bg-green-600 text-white"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        סמן כהושלם
                      </>
                    )}
                  </button>
                )}
                {order.status !== "Cancelled" && (
                  <button
                    onClick={() => handleStatusChange("Cancelled")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2 bg-red-600 text-white"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <XCircle size={18} />
                        בטל הזמנה
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Cost Info */}
            <motion.div
              className="p-6 rounded-xl border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                עלויות
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-color-secondary)" }}>עלות משוערת:</span>
                  <span className="font-medium" style={{ color: "var(--text-color)" }}>
                    ₪{order.estimatedCost?.toFixed(2) || "0.00"}
                  </span>
                </div>
                {order.actualCost > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-color-secondary)" }}>עלות בפועל:</span>
                    <span className="font-medium" style={{ color: "var(--text-color)" }}>
                      ₪{order.actualCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionOrderDetails;

