import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Trash2,
  Edit,
  UserPlus,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  User,
  Package,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";

const OrdersList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrders, setExpandedOrders] = useState([]);

  const {
    data: fetchedOrders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await axiosInstance.get("/CustomerOrder");
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || t("order.error_fetching_orders"));
    },
  });

  const toggleOrder = (orderId) => {
    setExpandedOrders((prevExpanded) =>
      prevExpanded.includes(orderId)
        ? prevExpanded.filter((id) => id !== orderId)
        : [...prevExpanded, orderId]
    );
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm(t("order.confirm_delete_order"));
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/CustomerOrder/${orderId}`);
      refetch();
      toast.success(t("order.order_deleted_successfully"));
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error(t("order.error_deleting_order"));
    }
  };

  const filteredOrders = fetchedOrders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const combinedText = [
      order.customer?.name || "",
      order.notes || "",
      order.status || "",
      order.items?.map((item) => item.product?.productName || "").join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return combinedText.includes(searchLower);
  });

  const stats = {
    total: fetchedOrders.length,
    pending: fetchedOrders.filter((o) => o.status === "pending").length,
    confirmed: fetchedOrders.filter((o) => o.status === "confirmed").length,
    cancelled: fetchedOrders.filter((o) => o.status === "cancelled").length,
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
          <p style={{ color: 'var(--text-color)' }}>{t("order.loading_orders")}</p>
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
            {error?.message || t("order.error_loading_orders")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-orange-500 to-red-600">
              <ShoppingCart size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("order.all_order_details")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("order.manage_orders")}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <ShoppingCart size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("order.total_orders")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("order.status_pending")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.pending}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("order.status_confirmed")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.confirmed}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                  <XCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("order.status_cancelled")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.cancelled}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-secondary)' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("order.search_placeholder")}
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            />
          </div>
        </motion.div>

        {/* Orders List */}
              {filteredOrders.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl" style={{ color: 'var(--color-secondary)' }}>
              {searchTerm ? t("order.no_orders_found") : t("order.no_orders_to_display")}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order._id}
                className="rounded-2xl shadow-lg border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer hover:opacity-90 transition-all"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                        onClick={() => toggleOrder(order._id)}
                      >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                        style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}>
                        {order.customer?.name?.charAt(0)?.toUpperCase() || 'O'}
                          </div>
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: 'var(--button-text)' }}>
                            {order.customer?.name || t("order.not_available")}
                        </h3>
                        <p className="text-sm opacity-90" style={{ color: 'var(--button-text)' }}>
                          {order.status || t("order.not_specified")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm opacity-90" style={{ color: 'var(--button-text)' }}>
                          {t("order.order_total")}
                        </p>
                        <p className="font-bold text-lg" style={{ color: 'var(--button-text)' }}>
                          {order.orderTotal || "-"}
                        </p>
                      </div>
                      
                      {expandedOrders.includes(order._id) ? (
                        <ChevronUp size={24} style={{ color: 'var(--button-text)' }} />
                      ) : (
                        <ChevronDown size={24} style={{ color: 'var(--button-text)' }} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details (Expanded) */}
                <AnimatePresence>
                  {expandedOrders.includes(order._id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="p-6 space-y-4">
                        {/* Order Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={18} style={{ color: 'var(--color-secondary)' }} />
                            <div>
                              <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                                {t("order.delivery_date")}
                              </p>
                              <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                                {order.deliveryDate
                                  ? new Date(order.deliveryDate).toLocaleDateString()
                                  : "-"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <DollarSign size={18} style={{ color: 'var(--color-secondary)' }} />
                            <div>
                              <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                                {t("order.total")}
                              </p>
                              <p className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                                {order.orderTotal || "-"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Package size={18} style={{ color: 'var(--color-secondary)' }} />
                            <div>
                              <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                                {t("order.items_count")}
                              </p>
                              <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                                {order.items?.length || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                              <Package size={18} />
                              {t("order.order_items_details")}
                            </h4>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg flex items-center justify-between"
                                  style={{ backgroundColor: 'var(--border-color)' }}
                                >
                                  <div>
                                    <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                                      {item.product?.productName || t("order.not_available")}
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                                      {t("order.quantity")}: {item.quantity}
                                      {item.discount > 0 && ` | ${t("order.discount")}: ${item.discount}%`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {order.notes && (
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                            <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-secondary)' }}>
                              {t("order.notes")}
                            </p>
                            <p style={{ color: 'var(--text-color)' }}>{order.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/Customers/Orders/${order._id}`);
                            }}
                            className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                            style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--button-text)' }}
                          >
                            <Settings size={16} />
                            נהל הזמנה
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(t("order.feature_coming_soon"));
                            }}
                            className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          >
                            <Edit size={16} />
                            {t("order.update_order")}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order._id);
                            }}
                            className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2 bg-red-500 text-white"
                          >
                            <Trash2 size={16} />
                            {t("order.delete_order")}
                          </button>
                              </div>
                            </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </div>
      )}
        </div>
    </div>
  );
};

export default OrdersList;
