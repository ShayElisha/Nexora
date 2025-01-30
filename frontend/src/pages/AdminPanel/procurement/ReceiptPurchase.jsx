// src/pages/receipts/ReceiptPurchase.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios.js";
import toast from "react-hot-toast";
import Sidebar from "../layouts/Sidebar.jsx";
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

  // מצבים למודאל
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [allowCloseWithDiscrepancy, setAllowCloseWithDiscrepancy] =
    useState(false);

  // שימוש ב-react-query לשאילתת נתונים ללא פילטר
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["purchaseReceipts", "all"],
    queryFn: fetchAllReceipts,
  });

  // פונקציית fetch לשאילתת נתונים
  async function fetchAllReceipts() {
    try {
      const response = await axiosInstance.get("/procurement");
      return response.data.data; // הנחה שהנתונים נמצאים ב-data.data
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Failed to fetch purchase receipts"
      );
    }
  }

  // טיפול בשגיאות
  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Error fetching purchase receipts");
    }
  }, [isError, error]);

  // פונקציית טיפול בלחיצה על עריכה
  const handleEditClick = (receipt) => {
    setSelectedReceipt(receipt);
    // אתחל את receivedQuantities עם הכמויות הנוכחיות מההזמנה
    const initialQuantities = {};
    receipt.products.forEach((product) => {
      initialQuantities[product.productId.toString()] =
        product.receivedQuantity || product.quantity; // אתחול עם receivedQuantity אם קיים
    });
    setReceivedQuantities(initialQuantities);
    setAllowCloseWithDiscrepancy(false); // איפוס מצב ה-checkbox
    setIsModalOpen(true);
  };

  // פונקציית טיפול בלחיצה על מחיקה
  const handleDeleteClick = async (id) => {
    if (window.confirm(t("receipts.confirm_delete"))) {
      try {
        await axiosInstance.delete(`/procurement/${id}`);
        toast.success(t("receipts.delete_success"));
        // רענון הנתונים לאחר מחיקה
        queryClient.invalidateQueries(["purchaseReceipts", "all"]);
      } catch (err) {
        console.error(err);
        toast.error(
          t("receipts.delete_error") || "Failed to delete procurement"
        );
      }
    }
  };

  // פונקציה לטיפול בשינויים בשדות הכמות שהתקבלה
  const handleQuantityChange = (productId, value) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [productId.toString()]: value,
    }));
  };

  // פונקציה לשמירת הכמויות שהתקבלו
  const handleSaveReceived = async () => {
    if (!selectedReceipt) return;

    for (const [productId, qty] of Object.entries(receivedQuantities)) {
      if (isNaN(qty) || qty < 0) {
        toast.error("Please enter valid quantities.");
        return;
      }
    }

    // בדיקת הבדלים בין הכמויות שהוזנו לבין הכמויות שהוזמנו
    const discrepancies = hasDiscrepancies(selectedReceipt, receivedQuantities);

    try {
      const response = await axiosInstance.put(
        `/procurement/${selectedReceipt._id}/receive`,
        {
          receivedQuantities,
          allowCloseWithDiscrepancy: discrepancies
            ? allowCloseWithDiscrepancy
            : true,
          // הסרת `id: selectedReceipt._id` מכיוון שה-ID נמצא כבר ב-URL
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
      console.error(err);
      toast.error("Failed to update received quantities.");
    }
  };

  // פילטרציה בצד הלקוח: קבלת רק התעודות שהסטטוס שלהן אינו "Delivered" או "Cancelled"
  const filteredData = data
    ? data.filter(
        (receipt) =>
          receipt.orderStatus !== "Delivered" &&
          receipt.orderStatus !== "Cancelled"
      )
    : [];

  // חישוב הבדלים
  const discrepancies = selectedReceipt
    ? hasDiscrepancies(selectedReceipt, receivedQuantities)
    : false;

  // איפוס מצב ה-checkbox כאשר אין הבדלים
  useEffect(() => {
    if (!discrepancies) {
      setAllowCloseWithDiscrepancy(false);
    }
  }, [discrepancies]);

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <Sidebar />

      <div className="container mx-auto max-w-7xl p-6 text-gray-300">
        <h1 className="text-2xl font-bold text-blue-300 mb-6">
          {t("receipts.pending_title")}
        </h1>

        {isLoading ? (
          <p>{t("receipts.loading")}</p>
        ) : filteredData && filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr>
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
                {filteredData.map((receipt) => (
                  <React.Fragment key={receipt._id}>
                    <tr className="hover:bg-gray-600">
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
                    {/* הצגת ההערות אם קיימות */}
                    {receipt.notes && (
                      <tr>
                        <td
                          colSpan="6"
                          className="border border-gray-700 p-2 bg-gray-600"
                        >
                          <strong>Notes:</strong> {receipt.notes}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && <p>{t("receipts.no_records")}</p>
        )}

        {/* מודאל לעריכת תעודת רכש */}
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

              {/* טבלת המוצרים */}
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
                          max={product.quantity}
                          value={
                            receivedQuantities[product.productId.toString()] ||
                            ""
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

              {/* Checkbox לאפשר סגירה גם אם יש הבדלים, מופיע רק אם יש הבדלים */}
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

              {/* כפתורי שמירה וביטול */}
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
