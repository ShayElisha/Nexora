import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Star,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  MessageSquare,
  Loader2
} from "lucide-react";

const hasDiscrepancies = (receipt, receivedQuantities) => {
  if (!receipt || !receipt.products) return false;
  return receipt.products.some(
    (product) =>
      receivedQuantities[product.productId.toString()] !== product.quantity
  );
};

const ReceiptPurchase = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [allowCloseWithDiscrepancy, setAllowCloseWithDiscrepancy] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [isGoodsChecked, setIsGoodsChecked] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [supplierRating, setSupplierRating] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["purchaseReceipts", "all"],
    queryFn: fetchAllReceipts,
  });

  async function fetchAllReceipts() {
    try {
      const response = await axiosInstance.get("/procurement");
      return response.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || t("receipts.fetch_error"));
    }
  }

  useEffect(() => {
    if (isError) {
      toast.error(error.message || t("receipts.fetch_error"));
    }
  }, [isError, error, t]);

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleEditClick = (receipt) => {
    setSelectedReceipt(receipt);
    const initialQuantities = {};
    receipt.products.forEach((product) => {
      initialQuantities[product.productId.toString()] =
        product.receivedQuantity || product.quantity;
    });
    setReceivedQuantities(initialQuantities);
    setAllowCloseWithDiscrepancy(false);
    setIsGoodsChecked(false);
    setAdditionalNotes("");
    setSupplierRating(0);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm(t("receipts.confirm_delete"))) {
      try {
        await axiosInstance.delete(`/procurement/${id}`);
        toast.success(t("receipts.delete_success"));
        queryClient.invalidateQueries(["purchaseReceipts", "all"]);
      } catch (err) {
        toast.error(t("receipts.delete_error"));
      }
    }
  };

  const handleQuantityChange = (productId, value) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [productId.toString()]: value,
    }));
  };

  const handleSaveReceived = async () => {
    if (!selectedReceipt) return;

    if (!isGoodsChecked) {
      toast.error(t("receipts.goods_not_checked"));
      return;
    }

    for (const [productId, qty] of Object.entries(receivedQuantities)) {
      if (isNaN(qty) || qty < 0) {
        toast.error(t("receipts.invalid_quantities"));
        return;
      }
    }

    const discrepancies = hasDiscrepancies(selectedReceipt, receivedQuantities);

    // Validate and convert supplierRating to number
    const ratingToSend = supplierRating > 0 ? Number(supplierRating) : undefined;
    
    console.log('📊 Sending supplier rating:', ratingToSend, 'Type:', typeof ratingToSend);

    try {
      const response = await axiosInstance.put(
        `/procurement/${selectedReceipt._id}/receive`,
        {
          receivedQuantities,
          allowCloseWithDiscrepancy: discrepancies
            ? allowCloseWithDiscrepancy
            : true,
          additionalNotes,
          supplierRating: ratingToSend,
        }
      );

      if (response.data.success) {
        toast.success(t("receipts.update_success"));
        setIsModalOpen(false);
        queryClient.invalidateQueries(["purchaseReceipts", "all"]);
      } else {
        toast.error(response.data.message || t("receipts.update_error"));
      }
    } catch (err) {
      toast.error(t("receipts.update_error"));
    }
  };

  const filteredData = data
    ? data.filter(
        (receipt) =>
          receipt.orderStatus !== "Delivered" &&
          receipt.orderStatus !== "Cancelled"
      )
    : [];

  const discrepancies = selectedReceipt
    ? hasDiscrepancies(selectedReceipt, receivedQuantities)
    : false;

  useEffect(() => {
    if (!discrepancies) {
      setAllowCloseWithDiscrepancy(false);
    }
  }, [discrepancies]);

  // Calculate statistics
  const stats = {
    total: filteredData.length,
    totalValue: filteredData.reduce((sum, r) => sum + (r.totalCost || 0), 0),
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <CheckCircle size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("receipts.pending_title")}
        </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("receipts.approve_pending_orders")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                  {t("receipts.pending_orders")}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-color)' }}>
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                <Package size={24} className="text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                  {t("receipts.total_pending_value")}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-color)' }}>
                  {stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
              <p style={{ color: 'var(--text-color)' }}>{t("receipts.loading")}</p>
            </motion.div>
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <motion.div
            className="rounded-2xl shadow-lg border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-green-500 to-emerald-600">
                  <tr>
                    <th className="py-4 px-4 text-sm font-bold text-white text-left w-12"></th>
                    <th className="py-4 px-4 text-sm font-bold text-white text-left">
                    {t("receipts.order_id")}
                  </th>
                    <th className="py-4 px-4 text-sm font-bold text-white text-left">
                    {t("receipts.supplier")}
                  </th>
                    <th className="py-4 px-4 text-sm font-bold text-white text-left">
                    {t("receipts.total_cost")}
                  </th>
                    <th className="py-4 px-4 text-sm font-bold text-white text-left">
                    {t("receipts.order_date")}
                  </th>
                    <th className="py-4 px-4 text-sm font-bold text-white text-left">
                    {t("receipts.receivedDate")}
                  </th>
                    <th className="py-4 px-4 text-sm font-bold text-white text-center">
                    {t("receipts.actions")}
                  </th>
                </tr>
              </thead>
                <tbody style={{ backgroundColor: 'var(--bg-color)' }}>
                  <AnimatePresence>
                    {filteredData.map((receipt, index) => {
                  const isExpanded = expandedRows.includes(receipt._id);
                  return (
                    <React.Fragment key={receipt._id}>
                          <motion.tr
                            className="border-b hover:bg-opacity-50 transition-colors"
                            style={{ borderColor: 'var(--border-color)' }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => toggleRow(receipt._id)}
                                className="p-1 rounded-lg hover:bg-opacity-20 transition-all"
                              >
                                {isExpanded ? (
                                  <ChevronUp size={20} style={{ color: 'var(--color-primary)' }} />
                                ) : (
                                  <ChevronDown size={20} style={{ color: 'var(--color-secondary)' }} />
                                )}
                          </button>
                        </td>
                            <td className="py-4 px-4 text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                          {receipt.PurchaseOrder}
                        </td>
                            <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-color)' }}>
                              <div className="flex items-center gap-2">
                                <Building2 size={16} style={{ color: 'var(--color-secondary)' }} />
                          {receipt.supplierName}
                              </div>
                        </td>
                            <td className="py-4 px-4 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                              {receipt.totalCost.toLocaleString()} {receipt.currency || "₪"}
                        </td>
                            <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-color)' }}>
                              <div className="flex items-center gap-2">
                                <Calendar size={16} style={{ color: 'var(--color-secondary)' }} />
                          {new Date(receipt.purchaseDate).toLocaleDateString()}
                              </div>
                        </td>
                            <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-color)' }}>
                              {receipt.receivedDate ? (
                                <div>
                                  <div>{new Date(receipt.receivedDate).toLocaleDateString()}</div>
                                  <div className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                                    {new Date(receipt.receivedDate).toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-yellow-600 flex items-center gap-1">
                                  <AlertTriangle size={14} />
                                  {t("receipts.not_received")}
                                </span>
                              )}
                        </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                          <button
                                  className="p-2 rounded-lg transition-all hover:scale-110"
                                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                            onClick={() => handleEditClick(receipt)}
                                  title={t("receipts.edit")}
                          >
                                  <Edit3 size={18} />
                          </button>
                          <button
                                  className="p-2 rounded-lg bg-red-500 text-white transition-all hover:scale-110 hover:bg-red-600"
                            onClick={() => handleDeleteClick(receipt._id)}
                                  title={t("receipts.delete")}
                          >
                                  <Trash2 size={18} />
                          </button>
                              </div>
                        </td>
                          </motion.tr>
                          <AnimatePresence>
                      {isExpanded && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <td colSpan={7} className="py-4 px-4" style={{ backgroundColor: 'var(--border-color)' }}>
                                  <div className="flex items-start gap-2">
                                    <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
                                    <div>
                                      <strong className="font-semibold" style={{ color: 'var(--text-color)' }}>
                                        {t("receipts.notes")}:
                                      </strong>
                            {receipt.notes ? (
                                        <p className="mt-1 text-sm" style={{ color: 'var(--text-color)' }}>
                                {receipt.notes}
                                        </p>
                            ) : (
                                        <p className="mt-1 text-sm opacity-70" style={{ color: 'var(--color-secondary)' }}>
                                {t("receipts.no_notes")}
                                        </p>
                                      )}
                                    </div>
                              </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                    </React.Fragment>
                  );
                })}
                  </AnimatePresence>
              </tbody>
            </table>
          </div>
          </motion.div>
        ) : (
          !isLoading && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Package size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
              <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
              {t("receipts.no_records")}
            </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-secondary)' }}>
                {t("receipts.all_orders_processed")}
              </p>
            </motion.div>
          )
        )}

        {/* Receipt Modal */}
        <AnimatePresence>
        {isModalOpen && selectedReceipt && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="p-6 sm:p-8">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                        <Package size={24} color="white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                          {t("receipts.receive_order")}
              </h2>
                        <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                  {selectedReceipt.PurchaseOrder}
                </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                      <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>
                          {t("receipts.supplier")}
                        </p>
                        <p className="font-bold" style={{ color: 'var(--text-color)' }}>
                  {selectedReceipt.supplierName}
                </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>
                          {t("receipts.total_cost")}
                        </p>
                        <p className="font-bold" style={{ color: 'var(--text-color)' }}>
                          {selectedReceipt.totalCost.toLocaleString()} {selectedReceipt.currency || "₪"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>
                          {t("receipts.order_date")}
                        </p>
                        <p className="font-bold" style={{ color: 'var(--text-color)' }}>
                  {new Date(selectedReceipt.purchaseDate).toLocaleDateString()}
                </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>
                          {t("receipts.receivedDate")}
                        </p>
                        {selectedReceipt.receivedDate ? (
                          <div>
                            <p className="font-bold" style={{ color: 'var(--text-color)' }}>
                              {new Date(selectedReceipt.receivedDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                              {new Date(selectedReceipt.receivedDate).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-yellow-600">
                            {t("receipts.not_received")}
                          </p>
                        )}
                      </div>
                    </div>
              </div>

                  {/* Products Table */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                      <Package size={20} />
                      {t("receipts.products_to_receive")}
                    </h3>
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                          <tr>
                            <th className="py-3 px-4 text-sm font-semibold text-left" style={{ color: 'var(--text-color)' }}>
                        {t("receipts.product_name")}
                      </th>
                            <th className="py-3 px-4 text-sm font-semibold text-center" style={{ color: 'var(--text-color)' }}>
                              {t("receipts.ordered_qty")}
                      </th>
                            <th className="py-3 px-4 text-sm font-semibold text-center" style={{ color: 'var(--text-color)' }}>
                        {t("receipts.received_quantity")}
                      </th>
                    </tr>
                  </thead>
                        <tbody style={{ backgroundColor: 'var(--bg-color)' }}>
                          {selectedReceipt.products.map((product, idx) => (
                            <tr key={product.productId} className="border-b hover:bg-opacity-50" style={{ borderColor: 'var(--border-color)' }}>
                              <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                          {product.productName}
                        </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                          {product.quantity}
                                </span>
                        </td>
                              <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                                  max={product.quantity - (product.receivedQuantity || 0)}
                            value={
                                    receivedQuantities[product.productId.toString()] ??
                              (product.receivedQuantity || 0)
                            }
                            onChange={(e) =>
                              handleQuantityChange(
                                product.productId,
                                Number(e.target.value)
                              )
                            }
                                  className="w-full p-2 border rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                  style={{
                                    borderColor: 'var(--border-color)',
                                    backgroundColor: 'var(--bg-color)',
                                    color: 'var(--text-color)'
                                  }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                    </div>
              </div>

                  {/* Verification Section */}
                  <div className="space-y-4 mb-6">
                    <motion.label
                      className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                      style={{
                        borderColor: isGoodsChecked ? 'var(--color-primary)' : 'var(--border-color)',
                        backgroundColor: isGoodsChecked ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-color)'
                      }}
                      whileHover={{ scale: 1.01 }}
                    >
                  <input
                    type="checkbox"
                    checked={isGoodsChecked}
                    onChange={(e) => setIsGoodsChecked(e.target.checked)}
                        className="w-5 h-5 rounded border-2 text-green-600 focus:ring-green-500"
                  />
                      <div className="flex items-center gap-2 flex-1">
                        <CheckCircle size={20} className={isGoodsChecked ? "text-green-600" : "text-gray-400"} />
                        <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                  {t("receipts.goods_checked")}
                        </span>
                      </div>
                    </motion.label>

                    {/* Additional Notes */}
                <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                        <MessageSquare size={18} />
                    {t("receipts.additional_notes")}
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        style={{
                          borderColor: 'var(--border-color)',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)'
                        }}
                    rows="3"
                    placeholder={t("receipts.enter_additional_notes")}
                  />
                </div>

                    {/* Supplier Rating */}
                <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                        <Star size={18} />
                    {t("receipts.supplier_rating")}
                  </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            type="button"
                            onClick={() => setSupplierRating(rating)}
                            className="p-2 transition-all"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star
                              size={32}
                              fill={rating <= supplierRating ? "#FCD34D" : "none"}
                              className={rating <= supplierRating ? "text-yellow-400" : "text-gray-300"}
                            />
                          </motion.button>
                        ))}
                        <span className="ml-2 text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                          {supplierRating > 0 ? `${supplierRating}/5` : t("receipts.not_rated")}
                        </span>
                      </div>
                </div>

                    {/* Discrepancy Warning */}
                {discrepancies && (
                      <motion.div
                        className="p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-yellow-800 mb-2">
                              {t("receipts.discrepancy_detected")}
                            </p>
                            <label className="flex items-center gap-2 text-sm text-yellow-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowCloseWithDiscrepancy}
                      onChange={(e) =>
                        setAllowCloseWithDiscrepancy(e.target.checked)
                      }
                                className="w-4 h-4 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                    />
                              <span>{t("receipts.allow_close_with_discrepancy")}</span>
                  </label>
                          </div>
                        </div>
                      </motion.div>
                )}
              </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4">
                <button
                      className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2"
                      style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  onClick={() => setIsModalOpen(false)}
                >
                      <X size={20} />
                  {t("receipts.cancel")}
                </button>
                <button
                      className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                  onClick={handleSaveReceived}
                      disabled={!isGoodsChecked}
                >
                      <Save size={20} />
                  {t("receipts.save")}
                </button>
              </div>
            </div>
              </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReceiptPurchase;
