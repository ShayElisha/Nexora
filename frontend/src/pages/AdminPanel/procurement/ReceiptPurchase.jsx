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

    try {
      const response = await axiosInstance.put(
        `/procurement/${selectedReceipt._id}/receive`,
        {
          receivedQuantities,
          allowCloseWithDiscrepancy: discrepancies
            ? allowCloseWithDiscrepancy
            : true,
          additionalNotes,
          supplierRating,
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

  return (
    <div className="min-h-screen bg-bg  flex flex-col items-center py-10 animate-fade-in">
      <div className="container mx-auto p-6 sm:p-8 w-full max-w-6xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-8 tracking-tight drop-shadow-md text-center">
          {t("receipts.pending_title")}
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <div className="bg-accent rounded-xl shadow-md overflow-x-auto">
            <table className="min-w-full text-text">
              <thead className="bg-button-bg text-button-text">
                <tr>
                  <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left"></th>
                  <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                    {t("receipts.order_id")}
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                    {t("receipts.supplier")}
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                    {t("receipts.total_cost")}
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                    {t("receipts.order_date")}
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                    {t("receipts.receivedDate")}
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                    {t("receipts.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((receipt) => {
                  const isExpanded = expandedRows.includes(receipt._id);
                  return (
                    <React.Fragment key={receipt._id}>
                      <tr className="hover:bg-bg">
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleRow(receipt._id)}
                            className="text-text hover:text-primary"
                          >
                            {isExpanded ? "▲" : "▼"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {receipt.PurchaseOrder}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {receipt.supplierName}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {receipt.totalCost} {receipt.currency || "₪"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(receipt.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {receipt.receivedDate || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            className="bg-green-500 text-white py-1 px-3 rounded-full hover:bg-green-600 mr-2 transition-all duration-200"
                            onClick={() => handleEditClick(receipt)}
                          >
                            {t("receipts.edit")}
                          </button>
                          <button
                            className="bg-red-500 text-white py-1 px-3 rounded-full hover:bg-red-600 transition-all duration-200"
                            onClick={() => handleDeleteClick(receipt._id)}
                          >
                            {t("receipts.delete")}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-accent">
                          <td
                            colSpan={7}
                            className="py-3 px-4 text-sm text-text"
                          >
                            {receipt.notes ? (
                              <div>
                                <strong className="font-semibold">
                                  {t("receipts.note")}:
                                </strong>{" "}
                                {receipt.notes}
                              </div>
                            ) : (
                              <div className="opacity-70">
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
          !isLoading && (
            <p className="text-text opacity-70 text-center">
              {t("receipts.no_records")}
            </p>
          )
        )}

        {isModalOpen && selectedReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-accent p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-text mb-6 tracking-tight drop-shadow-sm">
                {t("receipts.edit_title")}
              </h2>
              <div className="mb-6 space-y-2">
                <p className="text-sm text-text">
                  <strong className="font-semibold">
                    {t("receipts.order_id")}:
                  </strong>{" "}
                  {selectedReceipt.PurchaseOrder}
                </p>
                <p className="text-sm text-text">
                  <strong className="font-semibold">
                    {t("receipts.supplier")}:
                  </strong>{" "}
                  {selectedReceipt.supplierName}
                </p>
                <p className="text-sm text-text">
                  <strong className="font-semibold">
                    {t("receipts.total_cost")}:
                  </strong>{" "}
                  {selectedReceipt.totalCost} {selectedReceipt.currency || "₪"}
                </p>
                <p className="text-sm text-text">
                  <strong className="font-semibold">
                    {t("receipts.order_date")}:
                  </strong>{" "}
                  {new Date(selectedReceipt.purchaseDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-text">
                  <strong className="font-semibold">
                    {t("receipts.receivedDate")}:
                  </strong>{" "}
                  {selectedReceipt.receivedDate || "N/A"}
                </p>
              </div>

              <div className="bg-accent rounded-xl shadow-md overflow-x-auto mb-6">
                <table className="min-w-full text-text">
                  <thead className="bg-button-bg text-button-text">
                    <tr>
                      <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                        {t("receipts.product_name")}
                      </th>
                      <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                        {t("receipts.quantity_to_receive")}
                      </th>
                      <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                        {t("receipts.received_quantity")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.products.map((product) => (
                      <tr key={product.productId} className="hover:bg-bg">
                        <td className="py-3 px-4 text-sm">
                          {product.productName}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {product.quantity}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <input
                            type="number"
                            min="0"
                            max={
                              product.quantity - (product.receivedQuantity || 0)
                            }
                            value={
                              receivedQuantities[
                                product.productId.toString()
                              ] ??
                              (product.receivedQuantity || 0)
                            }
                            onChange={(e) =>
                              handleQuantityChange(
                                product.productId,
                                Number(e.target.value)
                              )
                            }
                            className="w-full p-2 rounded bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <label className="flex items-center text-sm text-text">
                  <input
                    type="checkbox"
                    checked={isGoodsChecked}
                    onChange={(e) => setIsGoodsChecked(e.target.checked)}
                    className="mr-2 rounded border-border-color text-primary focus:ring-primary"
                  />
                  {t("receipts.goods_checked")}
                </label>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    {t("receipts.additional_notes")}
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full p-2 rounded bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                    rows="3"
                    placeholder={t("receipts.enter_additional_notes")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    {t("receipts.supplier_rating")}
                  </label>
                  <select
                    value={supplierRating}
                    onChange={(e) => setSupplierRating(Number(e.target.value))}
                    className="w-full p-2 rounded bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200"
                  >
                    <option value={0} disabled>
                      {t("receipts.choose_rating")}
                    </option>
                    <option value={1}>1 - {t("receipts.poor")}</option>
                    <option value={2}>2 - {t("receipts.fair")}</option>
                    <option value={3}>3 - {t("receipts.good")}</option>
                    <option value={4}>4 - {t("receipts.very_good")}</option>
                    <option value={5}>5 - {t("receipts.excellent")}</option>
                  </select>
                </div>

                {discrepancies && (
                  <label className="flex items-center text-sm text-text">
                    <input
                      type="checkbox"
                      checked={allowCloseWithDiscrepancy}
                      onChange={(e) =>
                        setAllowCloseWithDiscrepancy(e.target.checked)
                      }
                      className="mr-2 rounded border-border-color text-primary focus:ring-primary"
                    />
                    {t("receipts.allow_close_with_discrepancy")}
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  className="px-5 py-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition-all duration-200"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t("receipts.cancel")}
                </button>
                <button
                  className="px-5 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200"
                  onClick={handleSaveReceived}
                >
                  {t("receipts.save")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ReceiptPurchase;
