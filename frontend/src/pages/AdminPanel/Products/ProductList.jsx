// src/pages/procurement/ProductList.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

// ------------------ מודאל עריכת מלאי ------------------
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const { mutate: updateInventoryItem } = useMutation({
    mutationFn: async (updates) => {
      const response = await axiosInstance.put(
        `/inventory/${item?._id}`,
        updates
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
            <label className="block text-text">
              {t("inventory.quantity")}:
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full p-2 border border-border-color rounded bg-bg text-text"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm">
                {t("errors.quantity_required")}
              </p>
            )}
          </div>

          {/* Min Stock Level */}
          <div>
            <label className="block text-text">
              {t("inventory.min_stock_level")}:
            </label>
            <input
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
              className="w-full p-2 border border-border-color rounded bg-bg text-text"
            />
            {errors.minStockLevel && (
              <p className="text-red-500 text-sm">
                {t("errors.min_stock_level_required")}
              </p>
            )}
          </div>

          {/* Reorder Quantity */}
          <div>
            <label className="block text-text">
              {t("inventory.reorder_quantity")}:
            </label>
            <input
              type="number"
              name="reorderQuantity"
              value={formData.reorderQuantity}
              onChange={handleChange}
              className="w-full p-2 border border-border-color rounded bg-bg text-text"
            />
            {errors.reorderQuantity && (
              <p className="text-red-500 text-sm">
                {t("errors.reorder_quantity_required")}
              </p>
            )}
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-text">
              {t("inventory.batch_number")}
            </label>
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              className="w-full p-2 border border-border-color rounded bg-bg text-text"
            />
            {errors.batchNumber && (
              <p className="text-red-500 text-sm">
                {t("errors.batch_number_required")}
              </p>
            )}
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-text">
              {t("inventory.expiration_date")}:
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              className="w-full p-2 border border-border-color rounded bg-bg text-text"
            />
            {errors.expirationDate && (
              <p className="text-red-500 text-sm">
                {t("errors.expiration_date_required")}
              </p>
            )}
          </div>

          {/* Shelf Location */}
          <div>
            <label className="block text-text">
              {t("inventory.shelf_location")}:
            </label>
            <input
              type="text"
              name="shelfLocation"
              value={formData.shelfLocation}
              onChange={handleChange}
              className="w-full p-2 border border-border-color rounded bg-bg text-text"
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
              className="px-4 py-2 bg-button-bg text-button-text rounded"
            >
              {t("buttons.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= קומפוננטת ProductList =================
const ProductList = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSaleRows, setExpandedSaleRows] = useState([]);
  const [bomData, setBomData] = useState({}); // { productId: [BOM-Array], ... }
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- מצבי חיפוש, פילטר ומיון ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProductType, setFilterProductType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [sortOption, setSortOption] = useState("");

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // ---- Query: Authenticated user ----
  const { data: authData, error: authError } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const resp = await axiosInstance.get("/auth/me");
      return resp.data;
    },
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  // ---- Query: Inventory (Products) ----
  const { data: inventoryData, isFetching: isFetchingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/inventory");
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else {
          return response.data || [];
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.warn("No inventory found (404). Returning empty array.");
          return [];
        }
        throw err;
      }
    },
    enabled: isLoggedIn,
  });

  // ---- Mutation: Delete Product ----
  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (productId) => {
      const response = await axiosInstance.delete(`/product/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Product deleted successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to delete product: ${
          error.response?.data?.message || error.message
        }`
      );
    },
  });

  useEffect(() => {
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }, [authError]);

  useEffect(() => {
    if (isFetchingInventory) {
      setLoading(true);
      return;
    }
    if (inventoryData) {
      setAllProducts(inventoryData);
      setLoading(false);
    }
  }, [inventoryData, isFetchingInventory]);

  const handleEdit = (id) => {
    const item = allProducts.find((p) => p._id === id);
    setSelectedItem(item || null);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t("inventory.confirm_delete"))) {
      deleteProduct(id);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleToggleBOM = async (productId) => {
    if (expandedSaleRows.includes(productId)) {
      setExpandedSaleRows(expandedSaleRows.filter((id) => id !== productId));
      return;
    }
    if (!bomData[productId]) {
      try {
        const res = await axiosInstance.get(
          `/product-trees?productId=${productId}`
        );
        setBomData((prev) => ({ ...prev, [productId]: res.data }));
      } catch (err) {
        toast.error("Failed to load BOM");
        console.error(err);
        return;
      }
    }
    setExpandedSaleRows([...expandedSaleRows, productId]);
  };

  // סינון מוצרים לפי שורת החיפוש והפילטרים
  const filteredProducts = allProducts.filter((prod) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // בדיקת חיפוש (אם שורת החיפוש ריקה, מתקבל true)
    const matchesSearch =
      !searchTerm ||
      (prod.sku && prod.sku.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (prod.barcode &&
        prod.barcode.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (prod.productName &&
        prod.productName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (prod.unitPrice &&
        prod.unitPrice
          .toString()
          .toLowerCase()
          .includes(lowerCaseSearchTerm)) ||
      (prod.category &&
        prod.category.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (prod.supplierName &&
        prod.supplierName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (prod.inventory?.quantity &&
        prod.inventory.quantity
          .toString()
          .toLowerCase()
          .includes(lowerCaseSearchTerm)) ||
      (prod.inventory?.minStockLevel &&
        prod.inventory.minStockLevel
          .toString()
          .toLowerCase()
          .includes(lowerCaseSearchTerm)) ||
      (prod.inventory?.reorderQuantity &&
        prod.inventory.reorderQuantity
          .toString()
          .toLowerCase()
          .includes(lowerCaseSearchTerm)) ||
      (prod.height &&
        prod.width &&
        prod.length &&
        (prod.volume
          ? prod.volume.toString()
          : (prod.height * prod.width * prod.length).toString()
        )
          .toLowerCase()
          .includes(lowerCaseSearchTerm));

    // בדיקת פילטרים – במידה ונבחרו ערכים שונים מ-"all"
    const matchesType =
      filterProductType === "all" || prod.productType === filterProductType;
    const matchesCategory =
      filterCategory === "all" ||
      (prod.category && prod.category === filterCategory);
    const matchesSupplier =
      filterSupplier === "all" ||
      (prod.supplierName && prod.supplierName === filterSupplier);

    return matchesSearch && matchesType && matchesCategory && matchesSupplier;
  });

  // מיון המוצרים לפי אפשרות המיון שנבחרה
  if (sortOption) {
    filteredProducts.sort((a, b) => {
      switch (sortOption) {
        case "productName_asc":
          return (a.productName || "").localeCompare(b.productName || "");
        case "productName_desc":
          return (b.productName || "").localeCompare(a.productName || "");
        case "sku_asc":
          return (a.sku || "").localeCompare(b.sku || "");
        case "sku_desc":
          return (b.sku || "").localeCompare(a.sku || "");
        case "barcode_asc":
          return (a.barcode || "").localeCompare(b.barcode || "");
        case "barcode_desc":
          return (b.barcode || "").localeCompare(a.barcode || "");
        case "unitPrice_asc":
          return a.unitPrice - b.unitPrice;
        case "unitPrice_desc":
          return b.unitPrice - a.unitPrice;
        case "category_asc":
          return (a.category || "").localeCompare(b.category || "");
        case "category_desc":
          return (b.category || "").localeCompare(a.category || "");
        case "supplierName_asc":
          return (a.supplierName || "").localeCompare(b.supplierName || "");
        case "supplierName_desc":
          return (b.supplierName || "").localeCompare(a.supplierName || "");
        case "quantity_asc":
          return (a.inventory?.quantity || 0) - (b.inventory?.quantity || 0);
        case "quantity_desc":
          return (b.inventory?.quantity || 0) - (a.inventory?.quantity || 0);
        case "minStockLevel_asc":
          return (
            (a.inventory?.minStockLevel || 0) -
            (b.inventory?.minStockLevel || 0)
          );
        case "minStockLevel_desc":
          return (
            (b.inventory?.minStockLevel || 0) -
            (a.inventory?.minStockLevel || 0)
          );
        case "reorderQuantity_asc":
          return (
            (a.inventory?.reorderQuantity || 0) -
            (b.inventory?.reorderQuantity || 0)
          );
        case "reorderQuantity_desc":
          return (
            (b.inventory?.reorderQuantity || 0) -
            (a.inventory?.reorderQuantity || 0)
          );
        case "volume_asc": {
          const aVol =
            a.volume ||
            (a.height && a.width && a.length
              ? a.height * a.width * a.length
              : 0);
          const bVol =
            b.volume ||
            (b.height && b.width && b.length
              ? b.height * b.width * b.length
              : 0);
          return aVol - bVol;
        }
        case "volume_desc": {
          const aVol =
            a.volume ||
            (a.height && a.width && a.length
              ? a.height * a.width * a.length
              : 0);
          const bVol =
            b.volume ||
            (b.height && b.width && b.length
              ? b.height * b.width * b.length
              : 0);
          return bVol - aVol;
        }
        default:
          return 0;
      }
    });
  }

  // חלוקה למוצרים למכירה ורכישה מתוך המוצרים המסוננים
  const saleProducts = filteredProducts.filter(
    (prod) => prod.productType === "sale"
  );
  const purchaseProducts = filteredProducts.filter(
    (prod) => prod.productType === "purchase"
  );

  // טבלה 1: מוצרים למכירה
  const renderSaleTable = () => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-primary mb-4">
        {t("inventory.sale_products")}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto bg-white text-text rounded-lg">
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
                t("inventory.volume"),
                t("inventory.actions"),
              ].map((header) => (
                <th
                  key={header}
                  className="py-3 px-6 text-left bg-secondary text-white"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {saleProducts.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-400">
                  {t("inventory.no_products_available", "אין מוצרים זמינים")}
                </td>
              </tr>
            ) : (
              saleProducts.map((item) => {
                const isExpanded = expandedSaleRows.includes(item._id);
                return (
                  <React.Fragment key={item._id}>
                    <tr className="border-b border-border-color hover:bg-gray-200">
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
                        {item.sku || t("inventory.not_available")}
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
                      <td className="py-2 px-6">
                        {item.height && item.width && item.length ? (
                          <>
                            {item.height} × {item.width} × {item.length} ={" "}
                            {item.volume ||
                              item.height * item.width * item.length}
                          </>
                        ) : (
                          <>N/A</>
                        )}
                      </td>
                      <td className="py-2 px-6 flex space-x-2 items-center">
                        <button
                          className="bg-secondary text-button-text px-3 py-1 rounded hover:bg-secondary/80"
                          onClick={() => handleToggleBOM(item._id)}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                        <button
                          className="bg-button-bg text-button-text px-4 py-2 rounded hover:bg-button-bg/80"
                          onClick={() => handleEdit(item._id)}
                        >
                          {t("inventory.edit")}
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                          onClick={() => handleDelete(item._id)}
                        >
                          {t("inventory.delete")}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-100">
                        <td
                          colSpan={12}
                          className="p-4 border-b border-border-color"
                        >
                          {bomData[item._id] ? (
                            <div>
                              <h3 className="text-lg font-bold mb-2">
                                {t("product.bom.title")}
                              </h3>
                              {bomData[item._id].length === 0 ? (
                                <p>{t("product.bom.no_components")}</p>
                              ) : (
                                bomData[item._id].map((tree) => (
                                  <div key={tree._id} className="mb-3">
                                    {tree.components?.length > 0 ? (
                                      <ul className="list-disc list-inside">
                                        {tree.components.map((c) => (
                                          <li key={c._id}>
                                            <strong>
                                              {c.componentId?.productName ||
                                                "??"}
                                            </strong>{" "}
                                            × {c.quantity} (cost:{" "}
                                            {c.unitCost || 0})
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p>{t("product.bom.no_components")}</p>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          ) : (
                            <p>{t("product.bom.loading")}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // טבלה 2: מוצרים לרכישה
  const renderPurchaseTable = () => (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-4">
        {t("inventory.purchase_products")}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto bg-white text-text rounded-lg">
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
                t("inventory.volume"),
                t("inventory.actions"),
              ].map((header) => (
                <th
                  key={header}
                  className="py-3 px-6 text-left bg-secondary text-white"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchaseProducts.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-400">
                  {t("inventory.no_products_available", "אין מוצרים זמינים")}
                </td>
              </tr>
            ) : (
              purchaseProducts.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-border-color hover:bg-gray-200"
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
                    {item.sku || t("inventory.not_available")}
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
                  <td className="py-2 px-6">{item.inventory?.quantity ?? 0}</td>
                  <td className="py-2 px-6">
                    {item.inventory?.minStockLevel ?? 0}
                  </td>
                  <td className="py-2 px-6">
                    {item.inventory?.reorderQuantity ?? 0}
                  </td>
                  <td className="py-2 px-6">
                    {item.height && item.width && item.length ? (
                      <>
                        {item.height} × {item.width} × {item.length} ={" "}
                        {item.volume || item.height * item.width * item.length}
                      </>
                    ) : (
                      <>N/A</>
                    )}
                  </td>
                  <td className="py-2 px-6 flex space-x-2 items-center">
                    <button
                      className="bg-button-bg text-button-text px-4 py-2 rounded hover:bg-button-bg/80"
                      onClick={() => handleEdit(item._id)}
                    >
                      {t("inventory.edit")}
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      onClick={() => handleDelete(item._id)}
                    >
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
  );

  if (error) {
    return (
      <div className="flex min-h-screen bg-bg text-red-400 items-center justify-center">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-bg text-text items-center justify-center">
        <p>{t("inventory.please_log_in")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="container mx-auto max-w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center">
          {t("inventory.Product_Inventory_List")}
        </h1>

        {/* תפריטי פילטר ומיון מעל שורת החיפוש */}
        <div className="mb-4 flex flex-wrap gap-4">
          {/* פילטר לפי סוג מוצר */}
          <select
            value={filterProductType}
            onChange={(e) => setFilterProductType(e.target.value)}
            className="p-2 border border-border-color rounded"
          >
            <option value="all">
              {t("inventory.filter_all_product_types", "All Product Types")}
            </option>
            <option value="sale">{t("inventory.sale_products", "Sale")}</option>
            <option value="purchase">
              {t("inventory.purchase_products", "Purchase")}
            </option>
          </select>

          {/* פילטר לפי קטגוריה – אפשרויות מבוססות על כל המוצרים */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border border-border-color rounded"
          >
            <option value="all">
              {t("inventory.filter_all_categories", "All Categories")}
            </option>
            {Array.from(
              new Set(allProducts.map((prod) => prod.category).filter(Boolean))
            ).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* פילטר לפי ספק */}
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="p-2 border border-border-color rounded"
          >
            <option value="all">
              {t("inventory.filter_all_suppliers", "All Suppliers")}
            </option>
            {Array.from(
              new Set(
                allProducts.map((prod) => prod.supplierName).filter(Boolean)
              )
            ).map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>

          {/* תפריט מיון */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 border border-border-color rounded"
          >
            <option value="">{t("inventory.sort_by", "Sort By")}</option>
            <option value="productName_asc">
              {t("inventory.sort_productName_asc", "Product Name (A-Z)")}
            </option>
            <option value="productName_desc">
              {t("inventory.sort_productName_desc", "Product Name (Z-A)")}
            </option>
            <option value="sku_asc">
              {t("inventory.sort_sku_asc", "SKU (A-Z)")}
            </option>
            <option value="sku_desc">
              {t("inventory.sort_sku_desc", "SKU (Z-A)")}
            </option>
            <option value="barcode_asc">
              {t("inventory.sort_barcode_asc", "Barcode (A-Z)")}
            </option>
            <option value="barcode_desc">
              {t("inventory.sort_barcode_desc", "Barcode (Z-A)")}
            </option>
            <option value="unitPrice_asc">
              {t("inventory.sort_unitPrice_asc", "Unit Price (Low-High)")}
            </option>
            <option value="unitPrice_desc">
              {t("inventory.sort_unitPrice_desc", "Unit Price (High-Low)")}
            </option>
            <option value="category_asc">
              {t("inventory.sort_category_asc", "Category (A-Z)")}
            </option>
            <option value="category_desc">
              {t("inventory.sort_category_desc", "Category (Z-A)")}
            </option>
            <option value="supplierName_asc">
              {t("inventory.sort_supplierName_asc", "Supplier (A-Z)")}
            </option>
            <option value="supplierName_desc">
              {t("inventory.sort_supplierName_desc", "Supplier (Z-A)")}
            </option>
            <option value="quantity_asc">
              {t("inventory.sort_quantity_asc", "Quantity (Low-High)")}
            </option>
            <option value="quantity_desc">
              {t("inventory.sort_quantity_desc", "Quantity (High-Low)")}
            </option>
            <option value="minStockLevel_asc">
              {t(
                "inventory.sort_minStockLevel_asc",
                "Min Stock Level (Low-High)"
              )}
            </option>
            <option value="minStockLevel_desc">
              {t(
                "inventory.sort_minStockLevel_desc",
                "Min Stock Level (High-Low)"
              )}
            </option>
            <option value="reorderQuantity_asc">
              {t(
                "inventory.sort_reorderQuantity_asc",
                "Reorder Quantity (Low-High)"
              )}
            </option>
            <option value="reorderQuantity_desc">
              {t(
                "inventory.sort_reorderQuantity_desc",
                "Reorder Quantity (High-Low)"
              )}
            </option>
            <option value="volume_asc">
              {t("inventory.sort_volume_asc", "Volume (Low-High)")}
            </option>
            <option value="volume_desc">
              {t("inventory.sort_volume_desc", "Volume (High-Low)")}
            </option>
          </select>
        </div>

        {/* שורת חיפוש */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={t("inventory.search_placeholder", "חפש מוצרים")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-border-color rounded"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading products...</div>
        ) : (
          <>
            {renderSaleTable()}
            {renderPurchaseTable()}
          </>
        )}
      </div>

      {modalOpen && selectedItem && (
        <EditInventoryModal item={selectedItem} onClose={closeModal} />
      )}
    </div>
  );
};

export default ProductList;
