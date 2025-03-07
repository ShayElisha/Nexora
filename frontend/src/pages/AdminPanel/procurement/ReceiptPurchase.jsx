import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
  const [allowCloseWithDiscrepancy, setAllowCloseWithDiscrepancy] =
    useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [isGoodsChecked, setIsGoodsChecked] = useState(false); // חדש: בדיקת סחורה
  const [additionalNotes, setAdditionalNotes] = useState(""); // חדש: הערות נוספות
  const [supplierRating, setSupplierRating] = useState(0); // חדש: דירוג לספק (0-5)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["purchaseReceipts", "all"],
    queryFn: fetchAllReceipts,
  });

  async function fetchAllReceipts() {
    try {
      const response = await axiosInstance.get("/procurement");
      return response.data.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Failed to fetch purchase receipts"
      );
    }
  }

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Error fetching purchase receipts");
    }
  }, [isError, error]);

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
    setIsGoodsChecked(false); // איפוס בדיקת סחורה
    setAdditionalNotes(""); // איפוס הערות
    setSupplierRating(0); // איפוס דירוג
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm(t("receipts.confirm_delete"))) {
      try {
        await axiosInstance.delete(`/procurement/${id}`);
        toast.success(t("receipts.delete_success"));
        queryClient.invalidateQueries(["purchaseReceipts", "all"]);
      } catch (err) {
        toast.error(
          t("receipts.delete_error") || "Failed to delete procurement"
        );
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

    // בדיקה אם הסחורה נבדקה
    if (!isGoodsChecked) {
      toast.error(
        "Please confirm that the goods have been checked before saving."
      );
      return;
    }

    for (const [productId, qty] of Object.entries(receivedQuantities)) {
      if (isNaN(qty) || qty < 0) {
        toast.error("Please enter valid quantities.");
        return;
      }
    }

    const discrepancies = hasDiscrepancies(selectedReceipt, receivedQuantities);

    try {
      const response = await axiosInstance.put(
        `/procurement/${selectedReceipt._id}/receive`,
        {
          receivedQuantities,
          allowCloseWithDiscrepancy: discrepancies
            ? allowCloseWithDiscrepancy
            : true,
          additionalNotes, // חדש: שליחת הערות נוספות
          supplierRating, // חדש: שליחת דירוג הספק
        }
      );

      if (response.data.success) {
        toast.success("Received quantities updated successfully!");
        setIsModalOpen(false);
        queryClient.invalidateQueries(["purchaseReceipts", "all"]);
      } else {
        toast.error(
          response.data.message || "Failed to update received quantities."
        );
      }
    } catch (err) {
      toast.error("Failed to update received quantities.");
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

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto max-w-full p-6 text-gray-300">
        <h1 className="text-2xl font-bold text-blue-300 mb-6">
          {t("receipts.pending_title")}
        </h1>

        {isLoading ? (
          <p>{t("receipts.loading")}</p>
        ) : filteredData && filteredData.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-gray-800"></th>
                  <th className="py-2 px-4 bg-gray-800">
                    {t("receipts.order_id")}
                  </th>
                  <th className="py-2 px-4 bg-gray-800">
                    {t("receipts.supplier")}
                  </th>
                  <th className="py-2 px-4 bg-gray-800">
                    {t("receipts.total_cost")}
                  </th>
                  <th className="py-2 px-4 bg-gray-800">
                    {t("receipts.order_date")}
                  </th>
                  <th className="py-2 px-4 bg-gray-800">
                    {t("receipts.receivedDate")}
                  </th>
                  <th className="py-2 px-4 bg-gray-800">
                    {t("receipts.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((receipt) => {
                  const isExpanded = expandedRows.includes(receipt._id);
                  return (
                    <React.Fragment key={receipt._id}>
                      <tr className="hover:bg-gray-600">
                        <td className="border border-gray-700 p-2 text-center">
                          <button
                            onClick={() => toggleRow(receipt._id)}
                            className="text-white"
                          >
                            {isExpanded ? "▲" : "▼"}
                          </button>
                        </td>
                        <td className="border border-gray-700 p-2">
                          {receipt.PurchaseOrder}
                        </td>
                        <td className="border border-gray-700 p-2">
                          {receipt.supplierName}
                        </td>
                        <td className="border border-gray-700 p-2">
                          {receipt.totalCost} {receipt.currency || "₪"}
                        </td>
                        <td className="border border-gray-700 p-2">
                          {new Date(receipt.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-700 p-2">
                          {receipt.receivedDate || "N/A"}
                        </td>
                        <td className="border border-gray-700 p-2">
                          <button
                            className="bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600 mr-2"
                            onClick={() => handleEditClick(receipt)}
                          >
                            {t("receipts.edit")}
                          </button>
                          <button
                            className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
                            onClick={() => handleDeleteClick(receipt._id)}
                          >
                            {t("receipts.delete")}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-800">
                          <td
                            colSpan={7}
                            className="border border-gray-700 p-3 text-white"
                          >
                            {receipt.notes ? (
                              <div>
                                <strong>Note:</strong> {receipt.notes}
                              </div>
                            ) : (
                              <div className="text-gray-400">
                                {t("receipts.no_notes")}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && <p>{t("receipts.no_records")}</p>
        )}

        {isModalOpen && selectedReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-3/4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-blue-300 mb-4">
                {t("receipts.edit_title")}
              </h2>
              <div className="mb-4">
                <p>
                  <strong>{t("receipts.order_id")}:</strong>{" "}
                  {selectedReceipt.PurchaseOrder}
                </p>
                <p>
                  <strong>{t("receipts.supplier")}:</strong>{" "}
                  {selectedReceipt.supplierName}
                </p>
                <p>
                  <strong>{t("receipts.total_cost")}:</strong>{" "}
                  {selectedReceipt.totalCost} {selectedReceipt.currency || "₪"}
                </p>
                <p>
                  <strong>{t("receipts.order_date")}:</strong>{" "}
                  {new Date(selectedReceipt.purchaseDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>{t("receipts.receivedDate")}:</strong>{" "}
                  {selectedReceipt.receivedDate || "N/A"}
                </p>
              </div>

              <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden mb-4">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-800">
                      {t("receipts.product_name")}
                    </th>
                    <th className="py-2 px-4 bg-gray-800">
                      {t("receipts.quantity_to_receive")}
                    </th>
                    <th className="py-2 px-4 bg-gray-800">
                      {t("receipts.received_quantity")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReceipt.products.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-600">
                      <td className="border border-gray-700 p-2">
                        {product.productName}
                      </td>
                      <td className="border border-gray-700 p-2">
                        {product.quantity}
                      </td>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="number"
                          min="0"
                          max={
                            product.quantity - (product.receivedQuantity || 0)
                          }
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
                          className="w-full p-1 rounded bg-gray-700 text-gray-300"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Checkbox לבדיקת סחורה */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isGoodsChecked}
                    onChange={(e) => setIsGoodsChecked(e.target.checked)}
                    className="mr-2"
                  />
                  {t("receipts.goods_checked")}
                </label>
              </div>

              {/* שדה הערות נוספות */}
              <div className="mb-4">
                <label className="block mb-2">
                  {t("receipts.additional_notes")}
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-gray-300"
                  rows="3"
                  placeholder={t("receipts.enter_additional_notes")}
                />
              </div>

              {/* שדה דירוג לספק */}
              <div className="mb-4">
                <label className="block mb-2">
                  {t("receipts.supplier_rating")}
                </label>
                <select
                  value={supplierRating}
                  onChange={(e) => setSupplierRating(Number(e.target.value))}
                  className="w-full p-2 rounded bg-gray-700 text-gray-300"
                >
                  <option value={0} disabled>
                    Choose a rating (1-5)
                  </option>{" "}
                  {/* 0 לא תקף, רק כברירת מחדל */}
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Fair</option>
                  <option value={3}>3 - Good</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              {discrepancies && (
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allowCloseWithDiscrepancy}
                      onChange={(e) =>
                        setAllowCloseWithDiscrepancy(e.target.checked)
                      }
                      className="mr-2"
                    />
                    {t("receipts.allow_close_with_discrepancy")}
                  </label>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 mr-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t("receipts.cancel")}
                </button>
                <button
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  onClick={handleSaveReceived}
                >
                  {t("receipts.save")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptPurchase;
