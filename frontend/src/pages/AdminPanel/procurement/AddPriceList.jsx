import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";

const AddPriceList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    priceListName: "",
    priceListNumber: "",
    priceListType: "Customer",
    supplierId: "",
    customerId: "",
    currency: "ILS",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "Draft",
    items: [],
    notes: "",
  });

  const { data: priceList } = useQuery({
    queryKey: ["price-list", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/procurement-advanced/price-lists/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/suppliers");
      return res.data.data || [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (priceList && isEdit) {
      console.log("📥 Loading price list for editing:", {
        priceListName: priceList.priceListName,
        itemsCount: priceList.items?.length || 0,
        items: priceList.items?.map(item => ({
          productName: item.productName,
          quantityBreaksCount: item.quantityBreaks?.length || 0,
          quantityBreaks: item.quantityBreaks
        }))
      });
      
      setFormData({
        priceListName: priceList.priceListName || "",
        priceListNumber: priceList.priceListNumber || "",
        priceListType: priceList.priceListType || "Customer",
        supplierId: priceList.supplierId?._id || priceList.supplierId || "",
        customerId: priceList.customerId?._id || priceList.customerId || "",
        currency: priceList.currency || "ILS",
        startDate: priceList.startDate ? new Date(priceList.startDate).toISOString().split("T")[0] : "",
        endDate: priceList.endDate ? new Date(priceList.endDate).toISOString().split("T")[0] : "",
        status: priceList.status || "Draft",
        items: (priceList.items || []).map(item => {
          const quantityBreaks = (item.quantityBreaks || []).map(qb => ({
            minQuantity: qb.minQuantity || 1,
            maxQuantity: qb.maxQuantity || null,
            price: qb.price || 0,
            discount: qb.discount || 0
          }));
          
          console.log(`📥 Loading item ${item.productName}:`, {
            basePrice: item.basePrice,
            quantityBreaksCount: quantityBreaks.length,
            quantityBreaks: quantityBreaks
          });
          
          return {
            ...item,
            basePrice: item.basePrice || 0,
            unitPrice: item.basePrice || 0, // For UI compatibility
            quantityBreaks: quantityBreaks, // Ensure quantityBreaks array exists
          };
        }),
        notes: priceList.notes || "",
      });
    }
  }, [priceList, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/procurement-advanced/price-lists/${id}`, data);
      }
      return axiosInstance.post("/procurement-advanced/price-lists", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("procurement.price_list_updated") || "Price list updated successfully"
          : t("procurement.price_list_created") || "Price list created successfully"
      );
      queryClient.invalidateQueries(["price-lists"]);
      navigate("/dashboard/procurement/price-lists");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log("📤 Form data before processing:", JSON.stringify(formData, null, 2));
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      // Remove empty supplierId/customerId (convert to null or undefined)
      supplierId: formData.supplierId && formData.supplierId.trim() !== "" ? formData.supplierId : undefined,
      customerId: formData.customerId && formData.customerId.trim() !== "" ? formData.customerId : undefined,
      // Convert items: unitPrice -> basePrice, and ensure basePrice exists
      items: formData.items.map((item, idx) => {
        // Validate that productId and basePrice exist
        if (!item.productId || item.productId.trim() === "") {
          throw new Error("All items must have a product selected");
        }
        
        const basePrice = item.basePrice !== undefined ? item.basePrice : (item.unitPrice || 0);
        if (!basePrice || basePrice <= 0) {
          throw new Error("All items must have a valid base price");
        }
        
        // Process quantity breaks - ensure they're valid
        const rawQuantityBreaks = item.quantityBreaks || [];
        console.log(`📦 Item ${idx} (${item.productName || item.productId}) raw quantityBreaks:`, rawQuantityBreaks);
        
        const quantityBreaks = rawQuantityBreaks
          .filter(qb => {
            const isValid = qb && 
              qb.minQuantity !== undefined && 
              qb.minQuantity !== null && 
              qb.minQuantity !== "" &&
              qb.price !== undefined && 
              qb.price !== null &&
              qb.price !== "";
            if (!isValid) {
              console.warn(`⚠️ Invalid quantity break filtered out:`, qb);
            }
            return isValid;
          })
          .map(qb => ({
            minQuantity: Number(qb.minQuantity) || 1,
            maxQuantity: (qb.maxQuantity !== null && qb.maxQuantity !== undefined && qb.maxQuantity !== "") 
              ? Number(qb.maxQuantity) 
              : null,
            price: Number(qb.price) || 0,
            discount: qb.discount ? Number(qb.discount) : 0
          }));

        console.log(`📦 Preparing item ${item.productName || item.productId}:`, {
          basePrice,
          quantityBreaksCount: quantityBreaks.length,
          quantityBreaks: quantityBreaks,
          rawQuantityBreaksCount: rawQuantityBreaks.length
        });

        return {
          productId: item.productId,
          productName: item.productName || products.find(p => p._id === item.productId)?.productName || "",
          sku: item.sku || "",
          basePrice: basePrice,
          quantityBreaks: quantityBreaks,
          periodPricing: item.periodPricing || [],
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
          notes: item.notes || "",
        };
      }),
    };
    
    console.log("📤 Final submit data:", JSON.stringify(submitData.items.map(i => ({
      productName: i.productName,
      quantityBreaks: i.quantityBreaks
    })), null, 2));
    
    // Validate that at least one item exists
    if (submitData.items.length === 0) {
      toast.error(t("procurement.at_least_one_item_required") || "At least one item is required");
      return;
    }
    
    mutation.mutate(submitData);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          productName: "",
          basePrice: 0,
          unitPrice: 0, // Keep for backward compatibility in UI
          minQuantity: 1,
          maxQuantity: null,
          quantityBreaks: [], // Initialize empty array for quantity breaks
          effectiveDate: formData.startDate,
          expiryDate: formData.endDate || null,
        },
      ],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    if (field === "productId") {
      const product = products.find((p) => p._id === value);
      if (product) {
        updatedItems[index].productName = product.productName;
      }
    }
    setFormData({ ...formData, items: updatedItems });
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/procurement/price-lists")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              style={{ color: 'var(--text-color)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isEdit
                  ? t("procurement.edit_price_list") || "Edit Price List"
                  : t("procurement.add_price_list") || "Add Price List"}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t("procurement.fill_price_list_details") || "Fill in the details below to create a price list"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.basic_information") || "Basic Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.price_list_name") || "Price List Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.priceListName}
                    onChange={(e) => setFormData({ ...formData, priceListName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.price_list_number") || "Price List Number"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.priceListNumber}
                    onChange={(e) => setFormData({ ...formData, priceListNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.price_list_type") || "Price List Type"} *
                  </label>
                  <select
                    required
                    value={formData.priceListType}
                    onChange={(e) => setFormData({ ...formData, priceListType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="Customer">{t("procurement.customer") || "Customer"}</option>
                    <option value="Supplier">{t("procurement.supplier") || "Supplier"}</option>
                    <option value="Internal">{t("procurement.internal") || "Internal"}</option>
                    <option value="Promotional">{t("procurement.promotional") || "Promotional"}</option>
                  </select>
                </div>
                {formData.priceListType === "Supplier" && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.supplier") || "Supplier"}
                    </label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                      style={{ 
                        borderColor: 'var(--border-color)', 
                        backgroundColor: 'var(--bg-color)', 
                        color: 'var(--text-color)',
                        '--tw-ring-color': 'var(--color-primary)'
                      }}
                    >
                      <option value="">{t("procurement.select_supplier") || "Select Supplier"}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.SupplierName || supplier.name || supplier.supplierName || "Unknown Supplier"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.priceListType === "Customer" && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.customer") || "Customer"}
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                      style={{ 
                        borderColor: 'var(--border-color)', 
                        backgroundColor: 'var(--bg-color)', 
                        color: 'var(--text-color)',
                        '--tw-ring-color': 'var(--color-primary)'
                      }}
                    >
                      <option value="">{t("procurement.select_customer") || "Select Customer"}</option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.currency") || "Currency"}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="ILS">ILS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.start_date") || "Start Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.end_date") || "End Date"}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.status") || "Status"}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="Draft">{t("procurement.draft") || "Draft"}</option>
                    <option value="Active">{t("procurement.active") || "Active"}</option>
                    <option value="Expired">{t("procurement.expired") || "Expired"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.items") || "Items"} *
                </h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus size={18} />
                  {t("procurement.add_item") || "Add Item"}
                </button>
              </div>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {t("procurement.no_items") || "No items added yet. Click 'Add Item' to get started."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                              {t("procurement.product") || "Product"} *
                            </label>
                            <select
                              required
                              value={item.productId}
                              onChange={(e) => updateItem(index, "productId", e.target.value)}
                              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                              style={{ 
                                borderColor: 'var(--border-color)', 
                                backgroundColor: 'var(--bg-color)', 
                                color: 'var(--text-color)',
                                '--tw-ring-color': 'var(--color-primary)'
                              }}
                            >
                              <option value="">{t("procurement.select_product") || "Select Product"}</option>
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.productName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                              {t("procurement.base_price") || "Base Price"} *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={item.basePrice !== undefined ? item.basePrice : (item.unitPrice || 0)}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0;
                                updateItem(index, "basePrice", price);
                                updateItem(index, "unitPrice", price); // Keep for UI compatibility
                              }}
                              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                              style={{ 
                                borderColor: 'var(--border-color)', 
                                backgroundColor: 'var(--bg-color)', 
                                color: 'var(--text-color)',
                                '--tw-ring-color': 'var(--color-primary)'
                              }}
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <Trash2 size={18} className="text-red-500 mx-auto" />
                            </button>
                          </div>
                        </div>

                        {/* Quantity Breaks Section */}
                        <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                              {t("procurement.quantity_breaks") || "Quantity Breaks"} (הנחות לפי כמות)
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = [...formData.items];
                                if (!updatedItems[index].quantityBreaks) {
                                  updatedItems[index].quantityBreaks = [];
                                }
                                updatedItems[index].quantityBreaks.push({
                                  minQuantity: 1,
                                  maxQuantity: null,
                                  price: item.basePrice || 0,
                                  discount: 0
                                });
                                setFormData({ ...formData, items: updatedItems });
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-white hover:opacity-90 transition"
                              style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                              <Plus size={14} />
                              {t("procurement.add_break") || "Add Break"}
                            </button>
                          </div>
                          
                          {item.quantityBreaks && item.quantityBreaks.length > 0 ? (
                            <div className="space-y-2">
                              {item.quantityBreaks.map((breakItem, breakIndex) => (
                                <div key={breakIndex} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                      {t("procurement.min_quantity") || "Min Qty"} *
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      required
                                      value={breakItem.minQuantity || ""}
                                      onChange={(e) => {
                                        const updatedItems = [...formData.items];
                                        updatedItems[index].quantityBreaks[breakIndex].minQuantity = Number(e.target.value) || 1;
                                        setFormData({ ...formData, items: updatedItems });
                                      }}
                                      className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition"
                                      style={{ 
                                        borderColor: 'var(--border-color)', 
                                        backgroundColor: 'var(--bg-color)', 
                                        color: 'var(--text-color)',
                                        '--tw-ring-color': 'var(--color-primary)'
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                      {t("procurement.max_quantity") || "Max Qty"} (אופציונלי)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={breakItem.maxQuantity || ""}
                                      onChange={(e) => {
                                        const updatedItems = [...formData.items];
                                        updatedItems[index].quantityBreaks[breakIndex].maxQuantity = e.target.value ? Number(e.target.value) : null;
                                        setFormData({ ...formData, items: updatedItems });
                                      }}
                                      placeholder={t("procurement.unlimited") || "Unlimited"}
                                      className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition"
                                      style={{ 
                                        borderColor: 'var(--border-color)', 
                                        backgroundColor: 'var(--bg-color)', 
                                        color: 'var(--text-color)',
                                        '--tw-ring-color': 'var(--color-primary)'
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                      {t("procurement.price") || "Price"} *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      required
                                      value={breakItem.price || ""}
                                      onChange={(e) => {
                                        const updatedItems = [...formData.items];
                                        updatedItems[index].quantityBreaks[breakIndex].price = Number(e.target.value) || 0;
                                        setFormData({ ...formData, items: updatedItems });
                                      }}
                                      className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition"
                                      style={{ 
                                        borderColor: 'var(--border-color)', 
                                        backgroundColor: 'var(--bg-color)', 
                                        color: 'var(--text-color)',
                                        '--tw-ring-color': 'var(--color-primary)'
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedItems = [...formData.items];
                                        updatedItems[index].quantityBreaks.splice(breakIndex, 1);
                                        setFormData({ ...formData, items: updatedItems });
                                      }}
                                      className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                      <Trash2 size={16} className="text-red-500 mx-auto" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-center py-2" style={{ color: 'var(--text-secondary)' }}>
                              {t("procurement.no_quantity_breaks") || "No quantity breaks defined. Click 'Add Break' to add pricing tiers."}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.additional_information") || "Additional Information"}
              </h2>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                {t("procurement.notes") || "Notes"}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition resize-none"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)',
                  '--tw-ring-color': 'var(--color-primary)'
                }}
                rows={4}
                placeholder={t("procurement.notes_placeholder") || "Add any additional notes or comments..."}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {mutation.isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t("procurement.saving") || "Saving..."}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {t("procurement.save") || "Save"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/procurement/price-lists")}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
              >
                <X size={20} />
                {t("procurement.cancel") || "Cancel"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddPriceList;

