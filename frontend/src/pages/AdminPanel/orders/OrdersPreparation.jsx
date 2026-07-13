import React, { useState, useMemo } from "react";
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
  Filter,
  ArrowUpDown,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const OrdersPreparation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, amount-desc, amount-asc, customer-asc
  const [customerFilter, setCustomerFilter] = useState("all");

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

  // Get unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const customers = new Set();
    orders.forEach((order) => {
      if (order.customer?.name) {
        customers.add(order.customer.name);
      }
    });
    return Array.from(customers).sort();
  }, [orders]);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      // Only show orders that are in progress
      if (order.preparationStatus !== "In Progress") {
        return false;
      }

      // Customer filter
      if (customerFilter !== "all") {
        if (order.customer?.name !== customerFilter) {
          return false;
        }
      }

      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        const combinedText = [
          order.customer?.name || "",
          order._id?.toString() || "",
          order.items?.map((item) => item.product?.productName || "").join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!combinedText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.preparationDate || b.createdAt) - new Date(a.preparationDate || a.createdAt);
        case "date-asc":
          return new Date(a.preparationDate || a.createdAt) - new Date(b.preparationDate || b.createdAt);
        case "amount-desc":
          return (b.orderTotal || 0) - (a.orderTotal || 0);
        case "amount-asc":
          return (a.orderTotal || 0) - (b.orderTotal || 0);
        case "customer-asc":
          return (a.customer?.name || "").localeCompare(b.customer?.name || "", "he");
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, customerFilter, sortBy]);

  const stats = useMemo(() => {
    const inProgressOrders = orders.filter((o) => o.preparationStatus === "In Progress");
    const totalAmount = inProgressOrders.reduce((sum, o) => sum + (o.orderTotal || 0), 0);
    const totalItems = inProgressOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    
    return {
      total: inProgressOrders.length,
      inProgress: inProgressOrders.length,
      totalAmount,
      totalItems,
      averageAmount: inProgressOrders.length > 0 ? totalAmount / inProgressOrders.length : 0,
    };
  }, [orders]);

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <Truck size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                הזמנות להכנה
              </h1>
              <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
                ניהול הזמנות שצריכות הכנה למשלוח
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Package size={24} className="text-blue-600" />
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                  <Clock size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    בתהליך הכנה
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
                  <DollarSign size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    סה"כ סכום
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.totalAmount.toLocaleString()} ₪
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    סה"כ פריטים
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.totalItems}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
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
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">כל הלקוחות</option>
              {uniqueCustomers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
            <div className="relative">
              <Filter
                size={20}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-color-secondary)" }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-4 pr-10 py-2 rounded-lg border appearance-none"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                <option value="date-desc">תאריך (חדש לישן)</option>
                <option value="date-asc">תאריך (ישן לחדש)</option>
                <option value="amount-desc">סכום (גבוה לנמוך)</option>
                <option value="amount-asc">סכום (נמוך לגבוה)</option>
                <option value="customer-asc">לקוח (א-ב)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto mb-4" style={{ color: "var(--text-color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
              {searchTerm || customerFilter !== "all"
                ? "לא נמצאו הזמנות התואמות לחיפוש"
                : "אין הזמנות להכנה כרגע"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAndSortedOrders.map((order) => (
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrder(order._id);
                        }}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          backgroundColor: expandedOrders.includes(order._id)
                            ? "var(--color-primary)"
                            : "transparent",
                          border: expandedOrders.includes(order._id)
                            ? "none"
                            : "1px solid var(--border-color)",
                        }}
                      >
                        {expandedOrders.includes(order._id) ? (
                          <ChevronUp size={20} style={{ color: "var(--button-text)" }} />
                        ) : (
                          <ChevronDown size={20} style={{ color: "var(--text-color)" }} />
                        )}
                      </button>
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
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            בתהליך הכנה
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
                      {expandedOrders.includes(order._id) ? (
                        <ChevronUp size={20} style={{ color: "var(--text-color-secondary)" }} />
                      ) : (
                        <ChevronDown size={20} style={{ color: "var(--text-color-secondary)" }} />
                      )}
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

