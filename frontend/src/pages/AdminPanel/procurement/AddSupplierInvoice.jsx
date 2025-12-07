import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";

const AddSupplierInvoice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isEdit = !!id || !!(location.state?.invoiceData);

  const [formData, setFormData] = useState({
    supplierId: "",
    supplierInvoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [],
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
    currency: "ILS",
    status: "Pending",
    paymentTerms: "",
    notes: "",
  });

  const { data: invoice } = useQuery({
    queryKey: ["supplier-invoice", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/procurement-advanced/supplier-invoices/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/supplier");
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
    // אם יש נתונים מה-state, נשתמש בהם
    if (location.state?.invoiceData) {
      const invoiceData = location.state.invoiceData;
      setFormData({
        supplierId: invoiceData.supplierId?._id || invoiceData.supplierId || "",
        supplierInvoiceNumber: invoiceData.supplierInvoiceNumber || "",
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toISOString().split("T")[0] : "",
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split("T")[0] : "",
        items: invoiceData.items || [],
        subtotal: invoiceData.subtotal || 0,
        tax: invoiceData.taxAmount || invoiceData.tax || 0,
        totalAmount: invoiceData.totalAmount || 0,
        currency: invoiceData.currency || "ILS",
        status: invoiceData.status || "Pending",
        paymentTerms: invoiceData.paymentTerms || "",
        notes: invoiceData.notes || "",
      });
    } else if (invoice && isEdit) {
      setFormData({
        supplierId: invoice.supplierId?._id || invoice.supplierId || "",
        supplierInvoiceNumber: invoice.supplierInvoiceNumber || "",
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split("T")[0] : "",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
        items: invoice.items || [],
        subtotal: invoice.subtotal || 0,
        tax: invoice.taxAmount || invoice.tax || 0,
        totalAmount: invoice.totalAmount || 0,
        currency: invoice.currency || "ILS",
        status: invoice.status || "Pending",
        paymentTerms: invoice.paymentTerms || "",
        notes: invoice.notes || "",
      });
    }
  }, [invoice, isEdit, location.state]);

  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const tax = subtotal * 0.17; // 17% VAT
    const total = subtotal + tax;
    setFormData((prev) => ({
      ...prev,
      subtotal,
      tax,
      totalAmount: total,
    }));
  }, [formData.items]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const invoiceId = id || location.state?.invoiceData?._id;
      if (isEdit && invoiceId) {
        return axiosInstance.put(`/procurement-advanced/supplier-invoices/${invoiceId}`, data);
      }
      return axiosInstance.post("/procurement-advanced/supplier-invoices", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("procurement.invoice_updated") || "Invoice updated successfully"
          : t("procurement.invoice_created") || "Invoice created successfully"
      );
      queryClient.invalidateQueries(["supplier-invoices"]);
      navigate("/dashboard/procurement/supplier-invoices");
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
              onClick={() => navigate("/dashboard/procurement/supplier-invoices")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              style={{ color: 'var(--text-color)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isEdit
                  ? t("procurement.edit_supplier_invoice") || "Edit Supplier Invoice"
                  : t("procurement.add_supplier_invoice") || "Add Supplier Invoice"}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t("procurement.fill_invoice_details") || "Fill in the details below to create a supplier invoice"}
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
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.supplier") || "Supplier"} *
                  </label>
                  <select
                    required
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
                        {supplier.name} - {supplier.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.supplier_invoice_number") || "Supplier Invoice #"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplierInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, supplierInvoiceNumber: e.target.value })}
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
                    {t("procurement.invoice_date") || "Invoice Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
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
                    {t("procurement.due_date") || "Due Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                    <option value="Pending">{t("procurement.pending") || "Pending"}</option>
                    <option value="Partially Paid">{t("procurement.partially_paid") || "Partially Paid"}</option>
                    <option value="Paid">{t("procurement.paid") || "Paid"}</option>
                    <option value="Overdue">{t("procurement.overdue") || "Overdue"}</option>
                    <option value="Disputed">{t("procurement.disputed") || "Disputed"}</option>
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
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            {/* Summary Section */}
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.summary") || "Summary"}
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-color)' }}>{t("procurement.subtotal") || "Subtotal"}:</span>
                  <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    {formData.subtotal.toFixed(2)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-color)' }}>{t("procurement.tax") || "Tax (17%)"}:</span>
                  <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    {formData.tax.toFixed(2)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2" style={{ borderColor: 'var(--border-color)' }}>
                  <span style={{ color: 'var(--text-color)' }}>{t("procurement.total") || "Total"}:</span>
                  <span style={{ color: 'var(--text-color)' }}>
                    {formData.totalAmount.toFixed(2)} {formData.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.additional_information") || "Additional Information"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.payment_terms") || "Payment Terms"}
                  </label>
                  <textarea
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition resize-none"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                    rows={3}
                    placeholder={t("procurement.payment_terms_placeholder") || "Enter payment terms..."}
                  />
                </div>
                <div>
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
              </div>
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
                onClick={() => navigate("/dashboard/procurement/supplier-invoices")}
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

export default AddSupplierInvoice;

