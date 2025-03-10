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
      <div className="bg-bg rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 transform transition-all duration-300 animate-slide-in relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text hover:text-gray-800 text-xl transition-all duration-200 transform hover:scale-110"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-text mb-4 text-center tracking-tight">
          {t("inventory.attached_files")}
        </h2>
        {files && files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="bg-accent p-3 rounded-lg shadow-sm border border-border-color hover:bg-primary hover:text-button-text transition-all duration-200"
              >
                <a
                  href={file.fileUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-primary hover:underline font-medium ${
                    !file.fileUrl ? "pointer-events-none text-gray-400" : ""
                  }`}
                >
                  {file.fileName || file.name || `File ${index + 1}`}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text text-center text-lg opacity-70">
            {t("inventory.no_files")}
          </p>
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
      <div className="bg-bg rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[85vh] overflow-y-auto mx-4 transform transition-all duration-300 animate-slide-in relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text hover:text-gray-800 text-xl transition-all duration-200 transform hover:scale-110"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-text mb-6 text-center tracking-tight drop-shadow-md">
          {t("inventory.edit_product_and_inventory")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Details */}
          <div className="bg-accent p-4 rounded-xl border border-border-color shadow-sm">
            <h3 className="text-xl font-semibold text-text mb-4">
              {t("inventory.product_details")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.sku")}
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.barcode")}
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.product_name")}
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
                {errors.productName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.productName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.unit_price")}
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
                {errors.unitPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.unitPrice}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.category")}
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.supplier_name")}
                </label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  disabled={
                    formData.productType === "sale" || isLoadingSuppliers
                  }
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 disabled:bg-accent disabled:opacity-50"
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
                <label className="block text-sm font-medium text-text">
                  {t("inventory.length")}
                </label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.width")}
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.height")}
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.product_type")}
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                >
                  <option value="sale">{t("inventory.sale")}</option>
                  <option value="purchase">{t("inventory.purchase")}</option>
                  <option value="both">{t("inventory.both")}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-text">
                  {t("inventory.product_image")}
                </label>
                {formData.productImage && (
                  <div className="mt-2 flex items-center space-x-4">
                    <img
                      src={formData.productImage}
                      alt={formData.productName}
                      className="w-20 h-20 object-cover rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={handleImageDelete}
                      className="px-3 py-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                    >
                      {t("buttons.delete_image")}
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2 w-full p-2 border border-border-color rounded-lg text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-button-text hover:file:bg-secondary transition-all duration-200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-text">
                  {t("inventory.attached_files")}
                </label>
                {formData.attachments.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-accent p-3 rounded-lg shadow-sm border border-border-color"
                      >
                        <span className="text-sm text-text truncate">
                          {file.fileName || file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFileDelete(index)}
                          className="px-3 py-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
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
                    className="w-full p-2 border border-border-color rounded-lg text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-button-text hover:file:bg-secondary transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={handleFileAdd}
                    disabled={!newAttachedFile}
                    className="px-3 py-1 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {t("buttons.add_file")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Details */}
          <div className="bg-accent p-4 rounded-xl border border-border-color shadow-sm">
            <h3 className="text-xl font-semibold text-text mb-4">
              {t("inventory.inventory_details")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.quantity")}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.min_stock_level")}
                </label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
                {errors.minStockLevel && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.minStockLevel}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.reorder_quantity")}
                </label>
                <input
                  type="number"
                  name="reorderQuantity"
                  value={formData.reorderQuantity}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
                {errors.reorderQuantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.reorderQuantity}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.batch_number")}
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.expiration_date")}
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.shelf_location")}
                </label>
                <input
                  type="text"
                  name="shelfLocation"
                  value={formData.shelfLocation}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("inventory.last_order_date")}
                </label>
                <input
                  type="date"
                  name="lastOrderDate"
                  value={formData.lastOrderDate}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* BOM Section */}
          {(formData.productType === "sale" ||
            formData.productType === "both") && (
            <div className="bg-accent p-4 rounded-xl border border-border-color shadow-sm">
              <h3 className="text-xl font-semibold text-text mb-4">
                {t("product.bom.title")}
              </h3>
              <div className="space-y-4">
                {bomComponents.map((comp, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 bg-bg p-4 rounded-lg shadow-sm border border-border-color"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text">
                        {t("product.bom.component_id")}
                      </label>
                      <select
                        value={comp.componentId}
                        onChange={(e) =>
                          handleBomChange(index, "componentId", e.target.value)
                        }
                        className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 disabled:bg-accent disabled:opacity-50"
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
                    <div className="w-full sm:w-24">
                      <label className="block text-sm font-medium text-text">
                        {t("product.bom.quantity")}
                      </label>
                      <input
                        type="number"
                        value={comp.quantity}
                        onChange={(e) =>
                          handleBomChange(index, "quantity", e.target.value)
                        }
                        className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                        min="1"
                      />
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="block text-sm font-medium text-text">
                        {t("product.bom.unit_cost")}
                      </label>
                      <input
                        type="number"
                        value={comp.unitCost}
                        onChange={(e) =>
                          handleBomChange(index, "unitCost", e.target.value)
                        }
                        className="mt-1 w-full p-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBomComponent(index)}
                      className="mt-2 sm:mt-0 px-3 py-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                    >
                      {t("buttons.remove")}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBomComponent}
                  className="mt-4 px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
                >
                  {t("product.bom.add_component")}
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
            >
              {t("buttons.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
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
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-text mb-4 tracking-tight drop-shadow-md">
        {title}
      </h2>
      <div className="overflow-x-auto shadow-2xl rounded-xl">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-primary to-secondary text-button-text">
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
                  className="py-4 px-6 text-left text-sm font-bold tracking-wider"
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
                  className="py-6 text-center text-text text-lg opacity-70"
                >
                  {t("inventory.no_products_available")}
                </td>
              </tr>
            ) : (
              products.map((item, index) => {
                const isExpanded = expandedRows.includes(item._id);
                return (
                  <React.Fragment key={item._id}>
                    <tr
                      className={`border-b border-border-color transition-all duration-300 ${
                        index % 2 === 0 ? "bg-bg" : "bg-accent"
                      } hover:bg-accent hover:shadow-inner cursor-pointer`}
                      onClick={() => handleToggleRow(item._id)}
                    >
                      <td className="py-4 px-6">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded-lg shadow-sm"
                          />
                        ) : (
                          <span className="text-text text-sm opacity-70">
                            No Image
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-text font-medium">
                        {item.productName || t("inventory.not_available")}
                      </td>
                      <td className="py-4 px-6 text-text">
                        {item.sku || t("inventory.not_available")}
                      </td>
                      <td className="py-4 px-6 text-text">
                        {item.barcode || t("inventory.not_available")}
                      </td>
                      <td className="py-4 px-6 text-text">
                        {item.supplierName || t("inventory.not_available")}
                      </td>
                      <td className="py-4 px-6 text-text">
                        {item.unitPrice || t("inventory.not_available")}
                      </td>
                      <td className="py-4 px-6 text-text">
                        {item.inventory?.quantity ?? 0}
                      </td>
                      <td className="py-4 px-6 flex items-center justify-end space-x-2">
                        <button
                          className="px-3 py-1 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item._id);
                          }}
                        >
                          {t("inventory.edit")}
                        </button>
                        <button
                          className="px-3 py-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item._id);
                          }}
                        >
                          {t("inventory.delete")}
                        </button>
                        <button
                          className="p-1 text-text hover:text-gray-800 transition-all duration-200 transform hover:scale-110"
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
                      <tr className="bg-accent">
                        <td colSpan={8} className="p-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-text">
                            <div>
                              <h3 className="text-lg font-semibold text-text mb-3">
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
                              <h3 className="text-lg font-semibold text-text mb-3">
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
                                className="mt-4 px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
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
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <p className="text-red-500 text-lg font-semibold">Error: {error}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <p className="text-text text-lg font-semibold">
          {t("inventory.please_log_in")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-6 animate-fade-in">
      <div className="container mx-auto max-w-screen-xl">
        <div className="bg-bg rounded-2xl shadow-2xl p-6 sm:p-8 border border-border-color transform transition-all duration-500 hover:shadow-3xl">
          <h1 className="text-3xl font-extrabold text-text mb-6 text-center tracking-tight drop-shadow-md">
            {t("inventory.Product_Inventory_List")}
          </h1>

          {/* Filters and Search */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={filterProductType}
              onChange={(e) => setFilterProductType(e.target.value)}
              className="w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-accent text-text"
            >
              <option value="all">
                {t("inventory.filter_all_product_types")}
              </option>
              <option value="sale">{t("inventory.sale_products")}</option>
              <option value="purchase">
                {t("inventory.purchase_products")}
              </option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-accent text-text"
            >
              <option value="all">
                {t("inventory.filter_all_categories")}
              </option>
              {Array.from(
                new Set(
                  allProducts.map((prod) => prod.category).filter(Boolean)
                )
              ).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-accent text-text"
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
              className="w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-accent text-text"
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
              <option value="volume_asc">
                {t("inventory.sort_volume_asc")}
              </option>
              <option value="volume_desc">
                {t("inventory.sort_volume_desc")}
              </option>
            </select>
          </div>
          <div className="mb-6">
            <input
              type="text"
              placeholder={t("inventory.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-accent text-text placeholder-opacity-50"
            />
          </div>

          {/* Tables */}
          {loading ? (
            <div className="text-center text-text text-lg animate-pulse">
              Loading products...
            </div>
          ) : (
            <>
              {renderTable(saleProducts, t("inventory.sale_products"))}
              {renderTable(purchaseProducts, t("inventory.purchase_products"))}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
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
