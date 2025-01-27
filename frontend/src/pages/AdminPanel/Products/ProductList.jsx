// src/pages/ProductList.jsx
import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Sidebar from "../layouts/Sidebar";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const EditInventoryModal = ({ item, onClose }) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    quantity: item?.quantity || 0,
    minStockLevel: item?.minStockLevel || 10,
    reorderQuantity: item?.reorderQuantity || 20,
    batchNumber: item?.batchNumber || "",
    expirationDate: item?.expirationDate
      ? item.expirationDate.split("T")[0]
      : "",
    shelfLocation: item?.shelfLocation || "",
    lastOrderDate: item?.lastOrderDate ? item.lastOrderDate.split("T")[0] : "",
  });

  const [errors, setErrors] = useState({});

  // שינוי של אינפוטים
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Mutation לעדכון פריט במלאי
  const { mutate: updateInventoryItem } = useMutation({
    mutationFn: async (updates) => {
      const response = await axiosInstance.put(
        `/inventory/${item?._id}`,
        updates
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["inventory"]);
      toast.success("Inventory updated successfully");
      onClose();
    },
    onError: (error) => {
      toast.error(
        `Failed to update inventory: ${
          error.response?.data?.message || error.message
        }`
      );
    },
  });

  // שליחת הטופס
  const handleSubmit = (e) => {
    e.preventDefault();
    updateInventoryItem({ ...formData });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {t("inventory.edit_inventory_item")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-gray-700">
              {t("inventory.quantity")}:
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm">
                {t("errors.quantity_required")}
              </p>
            )}
          </div>

          {/* Min Stock Level */}
          <div>
            <label className="block text-gray-700">
              {t("inventory.min_stock_level")}:
            </label>
            <input
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.minStockLevel && (
              <p className="text-red-500 text-sm">
                {t("errors.min_stock_level_required")}
              </p>
            )}
          </div>

          {/* Reorder Quantity */}
          <div>
            <label className="block text-gray-700">
              {t("inventory.reorder_quantity")}:
            </label>
            <input
              type="number"
              name="reorderQuantity"
              value={formData.reorderQuantity}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.reorderQuantity && (
              <p className="text-red-500 text-sm">
                {t("errors.reorder_quantity_required")}
              </p>
            )}
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-gray-700">
              {t("inventory.batch_number")}
            </label>
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.batchNumber && (
              <p className="text-red-500 text-sm">
                {t("errors.batch_number_required")}
              </p>
            )}
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-gray-700">
              {t("inventory.expiration_date")}:
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.expirationDate && (
              <p className="text-red-500 text-sm">
                {t("errors.expiration_date_required")}
              </p>
            )}
          </div>

          {/* Shelf Location */}
          <div>
            <label className="block text-gray-700">
              {t("inventory.shelf_location")}:
            </label>
            <input
              type="text"
              name="shelfLocation"
              value={formData.shelfLocation}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.shelfLocation && (
              <p className="text-red-500 text-sm">
                {t("errors.shelf_location_required")}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              {t("buttons.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {t("buttons.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { t } = useTranslation();

  // בקשת המשתמש המחובר
  const { data: authData, error: authError } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const resp = await axiosInstance.get("/auth/me");
      return resp.data;
    },
  });

  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  // בקשת רשימת המלאי
  const {
    data: inventoryData,
    error: inventoryError,
    isFetching: isFetchingInventory,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      // נסה להביא את הנתונים מה-API
      const response = await axiosInstance.get("/inventory");
      // בדוק מה מגיע
      console.log("Fetched inventory data:", response.data);

      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return response.data || [];
      }
    },
    // נטען את הרשימה רק אם המשתמש מחובר
    enabled: isLoggedIn,
  });

  // מעקב אחרי טעינת בקשות
  useEffect(() => {
    // אם יש שגיאה באימות המשתמש
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // אם יש שגיאה בנתוני המלאי
    else if (inventoryError) {
      setError(inventoryError.message);
      setLoading(false);
    }
  }, [authError, inventoryError]);

  // כשנתוני המלאי מתעדכנים
  useEffect(() => {
    // במקרה שהבקשה עדיין רצה, הספינר ימשיך להופיע (דרך `loading`)
    if (isFetchingInventory) {
      setLoading(true);
      return;
    }

    if (inventoryData) {
      // מוודאים שהנתונים הם מערך
      if (Array.isArray(inventoryData)) {
        setProducts(inventoryData);
      } else {
        setProducts([]);
      }
      setLoading(false);
    }
  }, [inventoryData, isFetchingInventory]);

  // לחיצה על כפתור "Edit"
  const handleEdit = (id) => {
    const item = products.find((p) => p._id === id);
    setSelectedItem(item || null);
    setModalOpen(true);
  };

  // סגירת המודאל
  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  // רינדור
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />

      <div className="container mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          {t("inventory.Product_Inventory_List")}
        </h1>

        {/* הצגת שגיאה גלובלית אם קיימת */}
        {error && <div className="text-center text-red-500 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-700 text-gray-300 rounded-lg">
            <thead>
              <tr>
                {[
                  t("inventory.image"),
                  t("inventory.sku"),
                  t("inventory.barcode"),
                  t("inventory.product_name"),
                  t("inventory.unit_price"),
                  t("inventory.category"),
                  t("inventory.supplier_name"),
                  t("inventory.quantity"),
                  t("inventory.min_stock_level"),
                  t("inventory.reorder_qty"),
                  t("inventory.actions"),
                ].map((header) => (
                  <th key={header} className="py-3 px-6 text-left bg-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-6 text-center text-gray-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-6 text-center text-gray-400">
                    No products available
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-600 hover:bg-gray-700"
                  >
                    <td className="py-2 px-6">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td className="py-2 px-6">
                      {item.SKU || t("inventory.not_available")}
                    </td>
                    <td className="py-2 px-6">
                      {item.barcode || t("inventory.not_available")}
                    </td>
                    <td className="py-2 px-6">
                      {item.productName || t("inventory.not_available")}
                    </td>
                    <td className="py-2 px-6">
                      {item.unitPrice || t("inventory.not_available")}
                    </td>
                    <td className="py-2 px-6">
                      {item.category || t("inventory.not_available")}
                    </td>
                    <td className="py-2 px-6">
                      {item.supplierName || t("inventory.not_available")}
                    </td>
                    <td className="py-2 px-6">
                      {item.inventory?.quantity ?? 0}
                    </td>
                    <td className="py-2 px-6">
                      {item.inventory?.minStockLevel ?? 0}
                    </td>
                    <td className="py-2 px-6">
                      {item.inventory?.reorderQuantity ?? 0}
                    </td>
                    <td className="py-2 px-6 flex space-x-2">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none"
                        onClick={() => handleEdit(item._id)}
                      >
                        {t("inventory.edit")}
                      </button>
                      <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none">
                        {t("inventory.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* מודאל עריכה */}
      {modalOpen && selectedItem && (
        <EditInventoryModal item={selectedItem} onClose={closeModal} />
      )}
    </div>
  );
};

export default ProductList;
