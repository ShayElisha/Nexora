import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Factory,
  Search,
  Plus,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Package,
  ChevronDown,
  ChevronUp,
  Settings,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const ProductionOrdersList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState([]);

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["production-orders", statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      const response = await axiosInstance.get(`/production-orders?${params.toString()}`);
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || "שגיאה בטעינת הזמנות ייצור");
    },
  });

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const combinedText = [
      order.orderNumber || "",
      order.productName || "",
      order.productId?.productName || "",
      order.customerOrderId?._id?.toString() || "",
    ]
      .join(" ")
      .toLowerCase();
    return combinedText.includes(searchLower);
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Pending").length,
    inProgress: orders.filter((o) => o.status === "In Progress").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    onHold: orders.filter((o) => o.status === "On Hold").length,
    withMissingComponents: orders.filter((o) => o.missingComponents?.length > 0).length,
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
          <p style={{ color: "var(--text-color)" }}>טוען הזמנות ייצור...</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {error?.message || "שגיאה בטעינת הזמנות ייצור"}
          </p>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Factory size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  הזמנות ייצור
                </h1>
                <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
                  ניהול הזמנות ייצור מוצרים
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/production/create")}
              className="px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90 flex items-center gap-2"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              <Plus size={20} />
              יצירת הזמנת ייצור
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Factory size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    סה"כ הזמנות
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    ממתינות
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.pending}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <TrendingUp size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    בתהליך
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.inProgress}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    הושלמו
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.completed}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                  <AlertTriangle size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    מלאי חסר
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.withMissingComponents}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                style={{ color: "var(--text-color-secondary)" }}
              />
              <input
                type="text"
                placeholder="חפש לפי מספר הזמנה, מוצר או הזמנת לקוח..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-lg border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">כל הסטטוסים</option>
              <option value="Pending">ממתין</option>
              <option value="In Progress">בתהליך</option>
              <option value="Completed">הושלם</option>
              <option value="Cancelled">בוטל</option>
              <option value="On Hold">מושהה</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">כל העדיפויות</option>
              <option value="urgent">דחוף</option>
              <option value="high">גבוהה</option>
              <option value="medium">בינונית</option>
              <option value="low">נמוכה</option>
            </select>
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Factory size={64} className="mx-auto mb-4" style={{ color: "var(--text-color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "לא נמצאו הזמנות ייצור התואמות לחיפוש"
                : "אין הזמנות ייצור כרגע"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                  onClick={() => toggleOrder(order._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        <Factory size={24} style={{ color: "var(--button-text)" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg" style={{ color: "var(--text-color)" }}>
                            {order.orderNumber}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </span>
                          {order.missingComponents?.length > 0 && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertTriangle size={14} />
                              מלאי חסר
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package size={16} style={{ color: "var(--text-color-secondary)" }} />
                            <span style={{ color: "var(--text-color)" }}>
                              {order.productName} x{order.quantity}
                            </span>
                          </div>
                          {order.customerOrderId && (
                            <div className="flex items-center gap-2">
                              <Calendar size={16} style={{ color: "var(--text-color-secondary)" }} />
                              <span style={{ color: "var(--text-color-secondary)" }}>
                                הזמנת לקוח: #{order.customerOrderId._id?.toString().slice(-6)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock size={16} style={{ color: "var(--text-color-secondary)" }} />
                            <span style={{ color: "var(--text-color-secondary)" }}>
                              תאריך יעד: {new Date(order.dueDate).toLocaleDateString("he-IL")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/production/${order._id}`);
                        }}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: "var(--color-secondary)", color: "var(--button-text)" }}
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedOrders.includes(order._id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t overflow-hidden"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <div className="space-y-4">
                          {/* Components List */}
                          {order.components && order.components.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                                רכיבים נדרשים:
                              </h4>
                              <div className="space-y-2">
                                {order.components.map((component, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{ backgroundColor: "var(--border-color)" }}
                                  >
                                    <div>
                                      <p className="font-medium" style={{ color: "var(--text-color)" }}>
                                        {component.componentName || component.componentId?.productName || "רכיב"}
                                      </p>
                                      <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                                        נדרש: {component.requiredQuantity} | זמין: {component.availableQuantity} | 
                                        סטטוס: <span className={component.status === "Available" ? "text-green-600" : component.status === "Partial" ? "text-yellow-600" : "text-red-600"}>
                                          {component.status}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Components */}
                          {order.missingComponents && order.missingComponents.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-red-600">
                                רכיבים חסרים:
                              </h4>
                              <div className="space-y-2">
                                {order.missingComponents.map((component, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200"
                                  >
                                    <div>
                                      <p className="font-medium text-red-800">
                                        {component.componentName}
                                      </p>
                                      <p className="text-sm text-red-600">
                                        נדרש: {component.required} | זמין: {component.available} | חסר: {component.missing}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/production/${order._id}`);
                              }}
                              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                              style={{
                                backgroundColor: "var(--color-secondary)",
                                color: "var(--button-text)",
                              }}
                            >
                              <Settings size={18} />
                              נהל הזמנת ייצור
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionOrdersList;

