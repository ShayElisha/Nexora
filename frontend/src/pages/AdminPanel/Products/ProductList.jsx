// src/pages/procurement/ProductList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

// ------------------ Attached Files Modal ------------------
const AttachedFilesModal = ({ files, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative mx-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          {t("inventory.attached_files")}
        </h2>
        {files && files.length > 0 ? (
          <ul className="space-y-1">
            {files.map((file, index) => (
              <li key={index} className="bg-gray-100 p-2 rounded">
                <a
                  href={file.fileUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-blue-600 hover:underline ${
                    !file.fileUrl ? "pointer-events-none text-gray-400" : ""
                  }`}
                >
                  {file.fileName || file.name || `File ${index + 1}`}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">{t("inventory.no_files")}</p>
        )}
      </div>
    </div>
  );
};

// ------------------ Edit Product and Inventory Modal ------------------
const EditInventoryModal = ({ item, onClose }) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    productName: item?.productName || "",
    productDescription: item?.productDescription || "",
    unitPrice: item?.unitPrice || 0,
    category: item?.category || "",
    supplierId: item?.supplierId || "",
    supplierName: item?.supplierName || "",
    length: item?.length || "",
    width: item?.width || "",
    height: item?.height || "",
    productType: item?.productType || "",
    sku: item?.sku || "",
    barcode: item?.barcode || "",
    productImage: item?.productImage || "",
    attachments: item?.attachments || [],
    quantity: item?.inventory?.quantity || 0,
    minStockLevel: item?.inventory?.minStockLevel || 10,
    reorderQuantity: item?.inventory?.reorderQuantity || 20,
    batchNumber: item?.inventory?.batchNumber || "",
    expirationDate: item?.inventory?.expirationDate
      ? item.inventory.expirationDate.split("T")[0]
      : "",
    shelfLocation: item?.inventory?.shelfLocation || "",
    lastOrderDate: item?.inventory?.lastOrderDate
      ? item.inventory.lastOrderDate.split("T")[0]
      : "",
  });

  const [errors, setErrors] = useState({});
  const [bomComponents, setBomComponents] = useState([]);
  const [productTreeId, setProductTreeId] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newAttachedFile, setNewAttachedFile] = useState(null);

  const { data: productsList, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["productsList"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product");
      return res.data.data || [];
    },
  });

  const { data: suppliersList, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["suppliersList"],
    queryFn: async () => {
      const res = await axiosInstance.get("/suppliers");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (item.productType === "sale" || item.productType === "both") {
      const fetchBOM = async () => {
        try {
          const res = await axiosInstance.get(
            `/product-trees?productId=${item._id}`
          );
          if (res.data && res.data.length > 0) {
            const productTree = res.data[0];
            setBomComponents(
              productTree.components.map((comp) => ({
                componentId: comp.componentId._id || comp.componentId,
                quantity: comp.quantity,
                unitCost: comp.unitCost || comp.componentId.unitPrice || 0,
              }))
            );
            setProductTreeId(productTree._id);
          } else {
            setBomComponents([]);
            setProductTreeId(null);
          }
        } catch (err) {
          toast.error("Failed to load BOM");
          console.error(err);
        }
      };
      fetchBOM();
    }
  }, [item._id, item.productType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "supplierId" && value) {
      const selectedSupplier = suppliersList.find((s) => s._id === value);
      setFormData((prev) => ({
        ...prev,
        supplierName: selectedSupplier ? selectedSupplier.SupplierName : "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setFormData((prev) => ({
        ...prev,
        productImage: URL.createObjectURL(file),
      }));
    }
  };

  const handleImageDelete = () => {
    setFormData((prev) => ({ ...prev, productImage: "" }));
    setNewImageFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAttachedFile(file);
    }
  };

  const handleFileAdd = () => {
    if (newAttachedFile) {
      setFormData((prev) => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          { name: newAttachedFile.name, file: newAttachedFile },
        ],
      }));
      setNewAttachedFile(null);
    }
  };

  const handleFileDelete = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleBomChange = (index, field, value) => {
    const updatedBom = [...bomComponents];
    updatedBom[index][field] = value;

    if (field === "componentId" && value) {
      const selectedProduct = productsList.find((p) => p._id === value);
      if (selectedProduct) {
        updatedBom[index].unitCost = selectedProduct.unitPrice || 0;
      }
    }
    setBomComponents(updatedBom);
  };

  const addBomComponent = () => {
    setBomComponents([
      ...bomComponents,
      { componentId: "", quantity: 1, unitCost: 0 },
    ]);
  };

  const removeBomComponent = (index) => {
    setBomComponents(bomComponents.filter((_, i) => i !== index));
  };

  const { mutate: updateProduct } = useMutation({
    mutationFn: async (updates) => {
      const formDataToSend = new FormData();
      Object.entries(updates).forEach(([key, value]) => {
        if (key === "attachments") {
          formDataToSend.append("attachments", JSON.stringify(value));
          value.forEach((fileObj) => {
            if (fileObj.file) {
              formDataToSend.append("attachments", fileObj.file);
            }
          });
        } else {
          formDataToSend.append(key, value);
        }
      });
      if (newImageFile) {
        formDataToSend.append("productImage", newImageFile);
      }
      const response = await axiosInstance.put(
        `/product/${item._id}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to update product: ${
          error.response?.data?.message || error.message
        }`
      );
    },
  });

  const { mutate: updateInventoryItem } = useMutation({
    mutationFn: async (updates) => {
      const response = await axiosInstance.put(
        `/inventory/${item._id}`,
        updates
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory updated successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to update inventory: ${
          error.response?.data?.message || error.message
        }`
      );
    },
  });

  const { mutate: updateBOM } = useMutation({
    mutationFn: async (components) => {
      if (productTreeId) {
        const response = await axiosInstance.put(
          `/product-trees/${productTreeId}`,
          { components }
        );
        return response.data;
      } else {
        const response = await axiosInstance.post(`/product-trees`, {
          productId: item._id,
          components,
          notes: "",
        });
        setProductTreeId(response.data._id);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("BOM updated successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to update BOM: ${
          error.response?.data?.message || error.message
        }`
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      productName: formData.productName,
      productDescription: formData.productDescription,
      unitPrice: formData.unitPrice,
      category: formData.category,
      supplierId: formData.productType === "sale" ? null : formData.supplierId,
      supplierName:
        formData.productType === "sale" ? "" : formData.supplierName,
      length: formData.length,
      width: formData.width,
      height: formData.height,
      productType: formData.productType,
      sku: formData.sku,
      barcode: formData.barcode,
      productImage: formData.productImage,
      attachments: formData.attachments,
    };

    const inventoryData = {
      quantity: formData.quantity,
      minStockLevel: formData.minStockLevel,
      reorderQuantity: formData.reorderQuantity,
      batchNumber: formData.batchNumber,
      expirationDate: formData.expirationDate,
      shelfLocation: formData.shelfLocation,
      lastOrderDate: formData.lastOrderDate,
    };

    updateProduct(productData);
    updateInventoryItem(inventoryData);

    if (formData.productType === "sale" || formData.productType === "both") {
      updateBOM(bomComponents);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[85vh] relative mx-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          {t("inventory.edit_product_and_inventory")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="text-lg font-medium text-gray-700 mb-3">
              {t("inventory.product_details")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.sku")}
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.barcode")}
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.product_name")}
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {errors.productName && (
                  <p className="text-red-500 text-xs mt-1">
                    {t("errors.product_name_required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.unit_price")}
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {errors.unitPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {t("errors.unit_price_required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.category")}
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">
                    {t("errors.category_required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.supplier_name")}
                </label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  disabled={
                    formData.productType === "sale" || isLoadingSuppliers
                  }
                >
                  <option value="">{t("inventory.select_supplier")}</option>
                  {suppliersList?.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.SupplierName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.length")}
                </label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.width")}
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.height")}
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.product_type")}
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="sale">{t("inventory.sale")}</option>
                  <option value="purchase">{t("inventory.purchase")}</option>
                  <option value="both">{t("inventory.both")}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.product_image")}
                </label>
                {formData.productImage && (
                  <div className="mt-2 flex items-center space-x-3">
                    <img
                      src={formData.productImage}
                      alt={formData.productName}
                      className="w-20 h-20 object-cover rounded shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleImageDelete}
                      className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      {t("buttons.delete_image")}
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2 w-full p-1 border rounded text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.attached_files")}
                </label>
                {formData.attachments.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {formData.attachments.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-100 p-2 rounded"
                      >
                        <span className="text-sm">
                          {file.fileName || file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFileDelete(index)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          {t("buttons.delete")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full p-1 border rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleFileAdd}
                    disabled={!newAttachedFile}
                    className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {t("buttons.add_file")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="text-lg font-medium text-gray-700 mb-3">
              {t("inventory.inventory_details")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.quantity")}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {t("errors.quantity_required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.min_stock_level")}
                </label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {errors.minStockLevel && (
                  <p className="text-red-500 text-xs mt-1">
                    {t("errors.min_stock_level_required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.reorder_quantity")}
                </label>
                <input
                  type="number"
                  name="reorderQuantity"
                  value={formData.reorderQuantity}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {errors.reorderQuantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {t("errors.reorder_quantity_required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.batch_number")}
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.expiration_date")}
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.shelf_location")}
                </label>
                <input
                  type="text"
                  name="shelfLocation"
                  value={formData.shelfLocation}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {t("inventory.last_order_date")}
                </label>
                <input
                  type="date"
                  name="lastOrderDate"
                  value={formData.lastOrderDate}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          {(formData.productType === "sale" ||
            formData.productType === "both") && (
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                {t("product.bom.title")}
              </h3>
              <div className="space-y-3">
                {bomComponents.map((comp, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-end space-y-2 sm:space-y-0 sm:space-x-3 bg-white p-3 rounded border"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600">
                        {t("product.bom.component_id")}
                      </label>
                      <select
                        value={comp.componentId}
                        onChange={(e) =>
                          handleBomChange(index, "componentId", e.target.value)
                        }
                        className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        disabled={isLoadingProducts}
                      >
                        <option value="">
                          {t("product.bom.select_component")}
                        </option>
                        {productsList?.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.productName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-20">
                      <label className="block text-sm font-medium text-gray-600">
                        {t("product.bom.quantity")}
                      </label>
                      <input
                        type="number"
                        value={comp.quantity}
                        onChange={(e) =>
                          handleBomChange(index, "quantity", e.target.value)
                        }
                        className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        min="1"
                      />
                    </div>
                    <div className="w-full sm:w-20">
                      <label className="block text-sm font-medium text-gray-600">
                        {t("product.bom.unit_cost")}
                      </label>
                      <input
                        type="number"
                        value={comp.unitCost}
                        onChange={(e) =>
                          handleBomChange(index, "unitCost", e.target.value)
                        }
                        className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBomComponent(index)}
                      className="mt-2 sm:mt-0 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      {t("buttons.remove")}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBomComponent}
                  className="mt-3 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  {t("product.bom.add_component")}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              {t("buttons.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
            >
              {t("buttons.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ------------------ ProductList Component ------------------
const ProductList = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProductType, setFilterProductType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [sortOption, setSortOption] = useState("");

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: authData, error: authError } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const resp = await axiosInstance.get("/auth/me");
      return resp.data;
    },
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  const { data: inventoryData, isFetching: isFetchingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await axiosInstance.get("/inventory");
      return response.data.data || [];
    },
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });

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

  const handleToggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const openFilesModal = (files) => {
    setSelectedFiles(files);
    setFilesModalOpen(true);
  };

  const closeFilesModal = () => {
    setFilesModalOpen(false);
    setSelectedFiles([]);
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter((prod) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
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
  }, [
    allProducts,
    searchTerm,
    filterProductType,
    filterCategory,
    filterSupplier,
  ]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortOption) {
      sorted.sort((a, b) => {
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
            const aVolDesc =
              a.volume ||
              (a.height && a.width && a.length
                ? a.height * a.width * a.length
                : 0);
            const bVolDesc =
              b.volume ||
              (b.height && b.width && b.length
                ? b.height * b.width * b.length
                : 0);
            return bVolDesc - aVolDesc;
          }
          default:
            return 0;
        }
      });
    }
    return sorted;
  }, [filteredProducts, sortOption]);

  const saleProducts = sortedProducts.filter(
    (prod) => prod.productType === "sale"
  );
  const purchaseProducts = sortedProducts.filter(
    (prod) => prod.productType === "purchase"
  );

  const renderTable = (products, title) => (
    <div className="mb-6">
      <h2 className="text-xl font-medium text-primary mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto bg-white rounded-lg shadow-sm border border-gray-200">
          <thead>
            <tr>
              {[
                t("inventory.image"),
                t("inventory.product_name"),
                t("inventory.sku"),
                t("inventory.barcode"),
                t("inventory.supplier_name"),
                t("inventory.unit_price"),
                t("inventory.quantity"),
                t("inventory.actions"),
              ].map((header) => (
                <th
                  key={header}
                  className="py-2 px-3 text-left bg-secondary text-white text-sm font-medium border-b"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-4 text-center text-gray-400 text-sm"
                >
                  {t("inventory.no_products_available")}
                </td>
              </tr>
            ) : (
              products.map((item) => {
                const isExpanded = expandedRows.includes(item._id);
                return (
                  <React.Fragment key={item._id}>
                    <tr
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleToggleRow(item._id)}
                    >
                      <td className="py-2 px-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">
                            No Image
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {item.productName || t("inventory.not_available")}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {item.sku || t("inventory.not_available")}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {item.barcode || t("inventory.not_available")}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {item.supplierName || t("inventory.not_available")}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {item.unitPrice || t("inventory.not_available")}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {item.inventory?.quantity ?? 0}
                      </td>
                      <td className="py-2 px-3 flex items-center justify-end space-x-2">
                        <button
                          className="p-1 bg-button-bg text-button-text rounded hover:bg-button-bg/80 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item._id);
                          }}
                        >
                          {t("inventory.edit")}
                        </button>
                        <button
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item._id);
                          }}
                        >
                          {t("inventory.delete")}
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:text-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRow(item._id);
                          }}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-100">
                        <td
                          colSpan={8}
                          className="p-4 border-b border-gray-200"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <h3 className="text-base font-medium text-gray-700 mb-2">
                                {t("inventory.inventory_details")}
                              </h3>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.min_stock_level")}:
                                </span>{" "}
                                {item.inventory?.minStockLevel ?? 0}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.reorder_quantity")}:
                                </span>{" "}
                                {item.inventory?.reorderQuantity ?? 0}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.batch_number")}:
                                </span>{" "}
                                {item.inventory?.batchNumber ||
                                  t("inventory.not_available")}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.expiration_date")}:
                                </span>{" "}
                                {item.inventory?.expirationDate
                                  ? format(
                                      new Date(item.inventory.expirationDate),
                                      "yyyy-MM-dd"
                                    )
                                  : t("inventory.not_available")}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.shelf_location")}:
                                </span>{" "}
                                {item.inventory?.shelfLocation ||
                                  t("inventory.not_available")}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.last_order_date")}:
                                </span>{" "}
                                {item.inventory?.lastOrderDate
                                  ? format(
                                      new Date(item.inventory.lastOrderDate),
                                      "yyyy-MM-dd"
                                    )
                                  : t("inventory.not_available")}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-base font-medium text-gray-700 mb-2">
                                {t("inventory.additional_details")}
                              </h3>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.category")}:
                                </span>{" "}
                                {item.category || t("inventory.not_available")}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.product_type")}:
                                </span>{" "}
                                {item.productType ||
                                  t("inventory.not_available")}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.volume")}:
                                </span>{" "}
                                {item.height && item.width && item.length
                                  ? `${item.height} × ${item.width} × ${
                                      item.length
                                    } = ${
                                      item.volume ||
                                      item.height * item.width * item.length
                                    }`
                                  : "N/A"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("inventory.description")}:
                                </span>{" "}
                                {item.productDescription ||
                                  t("inventory.not_available")}
                              </p>
                              <button
                                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFilesModal(item.attachments || []);
                                }}
                              >
                                {t("inventory.view_files")}
                              </button>
                            </div>
                          </div>
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

  if (error) {
    return (
      <div className="flex min-h-screen bg-bg text-red-400 items-center justify-center p-4">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-bg text-text items-center justify-center p-4">
        <p>{t("inventory.please_log_in")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg p-4">
      <div className="container mx-auto w-full max-w-screen-xl bg-white rounded-lg shadow-sm p-4">
        <h1 className="text-2xl font-medium text-primary mb-4 text-center">
          {t("inventory.Product_Inventory_List")}
        </h1>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filterProductType}
            onChange={(e) => setFilterProductType(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="all">
              {t("inventory.filter_all_product_types")}
            </option>
            <option value="sale">{t("inventory.sale_products")}</option>
            <option value="purchase">{t("inventory.purchase_products")}</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="all">{t("inventory.filter_all_categories")}</option>
            {Array.from(
              new Set(allProducts.map((prod) => prod.category).filter(Boolean))
            ).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="all">{t("inventory.filter_all_suppliers")}</option>
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
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">{t("inventory.sort_by")}</option>
            <option value="productName_asc">
              {t("inventory.sort_productName_asc")}
            </option>
            <option value="productName_desc">
              {t("inventory.sort_productName_desc")}
            </option>
            <option value="sku_asc">{t("inventory.sort_sku_asc")}</option>
            <option value="sku_desc">{t("inventory.sort_sku_desc")}</option>
            <option value="barcode_asc">
              {t("inventory.sort_barcode_asc")}
            </option>
            <option value="barcode_desc">
              {t("inventory.sort_barcode_desc")}
            </option>
            <option value="unitPrice_asc">
              {t("inventory.sort_unitPrice_asc")}
            </option>
            <option value="unitPrice_desc">
              {t("inventory.sort_unitPrice_desc")}
            </option>
            <option value="category_asc">
              {t("inventory.sort_category_asc")}
            </option>
            <option value="category_desc">
              {t("inventory.sort_category_desc")}
            </option>
            <option value="supplierName_asc">
              {t("inventory.sort_supplierName_asc")}
            </option>
            <option value="supplierName_desc">
              {t("inventory.sort_supplierName_desc")}
            </option>
            <option value="quantity_asc">
              {t("inventory.sort_quantity_asc")}
            </option>
            <option value="quantity_desc">
              {t("inventory.sort_quantity_desc")}
            </option>
            <option value="minStockLevel_asc">
              {t("inventory.sort_minStockLevel_asc")}
            </option>
            <option value="minStockLevel_desc">
              {t("inventory.sort_minStockLevel_desc")}
            </option>
            <option value="reorderQuantity_asc">
              {t("inventory.sort_reorderQuantity_asc")}
            </option>
            <option value="reorderQuantity_desc">
              {t("inventory.sort_reorderQuantity_desc")}
            </option>
            <option value="volume_asc">{t("inventory.sort_volume_asc")}</option>
            <option value="volume_desc">
              {t("inventory.sort_volume_desc")}
            </option>
          </select>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder={t("inventory.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-sm">
            Loading products...
          </div>
        ) : (
          <>
            {renderTable(saleProducts, t("inventory.sale_products"))}
            {renderTable(purchaseProducts, t("inventory.purchase_products"))}
          </>
        )}
      </div>

      {modalOpen && selectedItem && (
        <EditInventoryModal item={selectedItem} onClose={closeModal} />
      )}
      {filesModalOpen && (
        <AttachedFilesModal files={selectedFiles} onClose={closeFilesModal} />
      )}
    </div>
  );
};

export default ProductList;
