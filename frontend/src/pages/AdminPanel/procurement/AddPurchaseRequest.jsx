import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";

const AddPurchaseRequest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    departmentId: "",
    items: [],
    requestDate: new Date().toISOString().split("T")[0],
    requiredDate: "",
    priority: "Medium",
    notes: "",
  });

  const { data: request } = useQuery({
    queryKey: ["purchase-request", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/procurement-advanced/purchase-requests/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
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

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/suppliers");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (request && isEdit) {
      setFormData({
        title: request.title || "",
        description: request.description || "",
        departmentId: request.departmentId?._id || "",
        items: request.items || [],
        requestDate: request.requestDate
          ? new Date(request.requestDate).toISOString().split("T")[0]
          : "",
        requiredDate: request.requiredDate
          ? new Date(request.requiredDate).toISOString().split("T")[0]
          : "",
        priority: request.priority || "Medium",
        notes: request.notes || "",
      });
    }
  }, [request, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/procurement-advanced/purchase-requests/${id}`, data);
      }
      return axiosInstance.post("/procurement-advanced/purchase-requests", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("procurement.request_updated") || "Purchase request updated successfully"
          : t("procurement.request_created") || "Purchase request created successfully"
      );
      queryClient.invalidateQueries(["purchase-requests"]);
      navigate("/dashboard/procurement/purchase-requests");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          productName: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          requiredDate: "",
          preferredSupplier: "",
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
        updatedItems[index].unitPrice = product.unitPrice || 0;
      }
    }
    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].totalPrice =
        (updatedItems[index].quantity || 0) * (updatedItems[index].unitPrice || 0);
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
              onClick={() => navigate("/dashboard/procurement/purchase-requests")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              style={{ color: 'var(--text-color)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isEdit
                  ? t("procurement.edit_request") || "Edit Purchase Request"
                  : t("procurement.add_request") || "Add Purchase Request"}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t("procurement.fill_request_details") || "Fill in the details below to create a purchase request"}
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
                    {t("procurement.title") || "Title"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.description") || "Description"}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition resize-none"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.department") || "Department"}
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="">{t("procurement.select_department") || "Select Department"}</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.priority") || "Priority"}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="Low">{t("procurement.low") || "Low"}</option>
                    <option value="Medium">{t("procurement.medium") || "Medium"}</option>
                    <option value="High">{t("procurement.high") || "High"}</option>
                    <option value="Urgent">{t("procurement.urgent") || "Urgent"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.request_date") || "Request Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.requestDate}
                    onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
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
                    {t("procurement.required_date") || "Required Date"}
                  </label>
                  <input
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.items") || "Items"}
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
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                            {t("procurement.product") || "Product"}
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const selectedProduct = products.find(p => p._id === e.target.value);
                              updateItem(index, "productId", e.target.value);
                              if (selectedProduct) {
                                updateItem(index, "productName", selectedProduct.productName || "");
                              }
                            }}
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
                            {t("procurement.quantity") || "Quantity"}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
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
                            {t("procurement.unit_price") || "Unit Price"}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
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
                            {t("procurement.preferred_supplier") || "Preferred Supplier"}
                          </label>
                          <select
                            value={item.preferredSupplier || ""}
                            onChange={(e) => updateItem(index, "preferredSupplier", e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                            style={{ 
                              borderColor: 'var(--border-color)', 
                              backgroundColor: 'var(--bg-color)', 
                              color: 'var(--text-color)',
                              '--tw-ring-color': 'var(--color-primary)'
                            }}
                          >
                            <option value="">{t("procurement.select_supplier") || "Select Supplier"}</option>
                            {suppliers.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.SupplierName || s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                            {t("procurement.total") || "Total"}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.totalPrice}
                            readOnly
                            className="w-full px-4 py-2 rounded-lg border"
                            style={{ 
                              borderColor: 'var(--border-color)', 
                              backgroundColor: 'var(--bg-secondary)', 
                              color: 'var(--text-color)'
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
                onClick={() => navigate("/dashboard/procurement/purchase-requests")}
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

export default AddPurchaseRequest;

