import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Clock,
  CheckCircle,
  Calendar,
  DollarSign,
  User,
  Settings,
  Loader2,
  ArrowLeft,
  Truck,
} from "lucide-react";

const OrdersPreparation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders-preparation"],
    queryFn: async () => {
      const response = await axiosInstance.get("/CustomerOrder/preparation");
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || "שגיאה בטעינת הזמנות");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      return axiosInstance.put(`/CustomerOrder/${orderId}/status`, { status });
    },
    onSuccess: () => {
      toast.success("סטטוס ההזמנה עודכן");
      queryClient.invalidateQueries(["orders-preparation"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה בעדכון סטטוס");
    },
  });

  const markReadyToShipMutation = useMutation({
    mutationFn: async (orderId) => {
      return axiosInstance.post(`/CustomerOrder/${orderId}/ready-to-ship`);
    },
    onSuccess: () => {
      toast.success("ההזמנה מוכנה למשלוח והוסרה מרשימת ההכנה");
      queryClient.invalidateQueries(["orders-preparation"]);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "שגיאה בעדכון";
      const inventoryIssues = error.response?.data?.inventoryIssues;
      
      if (inventoryIssues && inventoryIssues.length > 0) {
        // Show detailed inventory issues
        const issuesText = inventoryIssues.map(issue =>
          `${issue.productName}: נדרש ${issue.required}, זמין ${issue.available}, חסר ${issue.missing}`
        ).join("\n");
        toast.error(`${errorMessage}\n\n${issuesText}`, {
          duration: 6000,
        });
      } else {
        toast.error(errorMessage);
      }
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
    // Only show orders that are in progress (ready to ship orders are removed from list)
    if (order.preparationStatus !== "In Progress") {
      return false;
    }
    
    // Status filter (not needed anymore but keeping for future use)
    if (statusFilter !== "all") {
      if (statusFilter === "in-progress" && order.preparationStatus !== "In Progress") {
        return false;
      }
    }

    // Search filter
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const combinedText = [
      order.customer?.name || "",
      order._id?.toString() || "",
      order.items?.map((item) => item.product?.productName || "").join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return combinedText.includes(searchLower);
  });

  const stats = {
    total: orders.filter((o) => o.preparationStatus === "In Progress").length,
    inProgress: orders.filter((o) => o.preparationStatus === "In Progress").length,
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
          <p style={{ color: "var(--text-color)" }}>טוען הזמנות להכנה...</p>
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
          <p className="text-red-500 font-medium text-lg">
            {error?.message || "שגיאה בטעינת הזמנות"}
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ backgroundColor: "var(--border-color)" }}
            >
              <ArrowLeft size={20} style={{ color: "var(--text-color)" }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                הזמנות להכנה
              </h1>
              <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                ניהול הזמנות שצריכות הכנה למשלוח
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                  סה"כ הזמנות
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                  {stats.total}
                </p>
              </div>
              <Package size={32} style={{ color: "var(--color-primary)" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                  בתהליך הכנה
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                  {stats.inProgress}
                </p>
              </div>
              <Clock size={32} style={{ color: "var(--color-primary)" }} />
            </div>
          </motion.div>

        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              style={{ color: "var(--text-color-secondary)" }}
            />
            <input
              type="text"
              placeholder="חפש לפי לקוח, מספר הזמנה או מוצר..."
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
            <option value="all">כל ההזמנות</option>
            <option value="in-progress">בתהליך הכנה</option>
          </select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto mb-4" style={{ color: "var(--text-color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
              {searchTerm || statusFilter !== "all"
                ? "לא נמצאו הזמנות התואמות לחיפוש"
                : "אין הזמנות להכנה כרגע"}
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
                        <Package size={24} style={{ color: "var(--button-text)" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg" style={{ color: "var(--text-color)" }}>
                            הזמנה #{order._id?.toString().slice(-6)}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.preparationStatus === "Ready to Ship"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.preparationStatus === "Ready to Ship"
                              ? "מוכנה למשלוח"
                              : "בתהליך הכנה"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User size={16} style={{ color: "var(--text-color-secondary)" }} />
                            <span style={{ color: "var(--text-color-secondary)" }}>
                              {order.customer?.name || "לקוח לא ידוע"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} style={{ color: "var(--text-color-secondary)" }} />
                            <span style={{ color: "var(--text-color-secondary)" }}>
                              {order.preparationDate
                                ? new Date(order.preparationDate).toLocaleDateString("he-IL")
                                : "לא צוין"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} style={{ color: "var(--text-color-secondary)" }} />
                            <span style={{ color: "var(--text-color)" }}>
                              {order.orderTotal} {order.currency || "USD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package size={16} style={{ color: "var(--text-color-secondary)" }} />
                            <span style={{ color: "var(--text-color-secondary)" }}>
                              {order.items?.length || 0} מוצרים
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/orders/management/${order._id}`);
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
                          {/* Products List */}
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                              מוצרים להכנה:
                            </h4>
                            <div className="space-y-2">
                              {order.items?.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 rounded-lg"
                                  style={{ backgroundColor: "var(--border-color)" }}
                                >
                                  <div>
                                    <p className="font-medium" style={{ color: "var(--text-color)" }}>
                                      {item.product?.productName || item.productName || "מוצר"}
                                    </p>
                                    <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                                      כמות: {item.quantity} | מחיר יחידה: {item.unitPrice || (item.totalPrice / item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                  <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                                    {item.totalPrice}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                            {order.preparationStatus === "In Progress" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markReadyToShipMutation.mutate(order._id);
                                }}
                                disabled={markReadyToShipMutation.isPending}
                                className="flex-1 py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                                style={{
                                  backgroundColor: "var(--color-primary)",
                                  color: "var(--button-text)",
                                }}
                              >
                                {markReadyToShipMutation.isPending ? (
                                  <Loader2 className="animate-spin" size={18} />
                                ) : (
                                  <>
                                    <Truck size={18} />
                                    סמן כמוכן למשלוח
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/orders/management/${order._id}`);
                              }}
                              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                              style={{
                                backgroundColor: "var(--color-secondary)",
                                color: "var(--button-text)",
                              }}
                            >
                              <Settings size={18} />
                              נהל הזמנה
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

export default OrdersPreparation;

