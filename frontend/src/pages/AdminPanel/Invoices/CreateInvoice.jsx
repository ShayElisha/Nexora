import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Calculator,
} from "lucide-react";

const CreateInvoice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0,
        total: 0,
      },
    ],
    globalDiscount: { type: "percentage", value: 0 },
    taxRate: 0,
    notes: "",
    paymentTerms: "Net 30",
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data || [];
    },
  });

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount ? (itemTotal * item.discount) / 100 : 0;
      return sum + itemTotal - itemDiscount;
    }, 0);

    const discountAmount =
      formData.globalDiscount.type === "percentage"
        ? (subtotal * formData.globalDiscount.value) / 100
        : formData.globalDiscount.value;

    const amountAfterDiscount = subtotal - discountAmount;
    const taxAmount = (amountAfterDiscount * formData.taxRate) / 100;
    const totalAmount = amountAfterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, totalAmount };
  };

  const totals = calculateTotals();

  // Update item total when item changes
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate item total
    const item = newItems[index];
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount ? (itemTotal * item.discount) / 100 : 0;
    item.total = itemTotal - itemDiscount;

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxRate: 0,
          total: 0,
        },
      ],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/invoices", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["invoices"]);
      queryClient.invalidateQueries(["invoiceStats"]);
      toast.success(t("invoices.createdSuccessfully"));
      navigate(`/dashboard/invoices/${data.data._id}`);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || t("invoices.failedToCreate")
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate items
    const hasEmptyItems = formData.items.some(
      (item) => !item.description || item.quantity <= 0 || item.unitPrice <= 0
    );

    if (hasEmptyItems) {
      toast.error(t("invoices.fillAllItems"));
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard/invoices")}
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText size={32} style={{ color: "var(--color-primary)" }} />
              {t("invoices.createInvoice")}
            </h1>
            <p className="text-gray-500 mt-1">{t("invoices.createSubtitle")}</p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Information */}
          <div
            className="p-6 rounded-lg border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2 className="text-xl font-semibold mb-4">
              {t("invoices.basicInformation")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("invoices.customer")} {t("invoices.optional")}
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">{t("invoices.selectCustomer")}</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("invoices.issueDate")}
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("invoices.dueDate")}
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("invoices.paymentTerms")}
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentTerms: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder="Net 30"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div
            className="p-6 rounded-lg border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t("invoices.items")}</h2>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Plus size={20} />
                {t("invoices.addItem")}
              </motion.button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-sm font-medium mb-2">
                        {t("invoices.description")} *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: "var(--bg-color)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-color)",
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        {t("invoices.quantity")} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: "var(--bg-color)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-color)",
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        {t("invoices.unitPrice")} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: "var(--bg-color)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-color)",
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        {t("invoices.discount")} (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "discount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: "var(--bg-color)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <label className="block text-sm font-medium mb-2">
                        {t("invoices.total")}
                      </label>
                      <div className="px-4 py-2 rounded-lg border bg-gray-50">
                        {item.total.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-1">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={20} className="mx-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount and Tax */}
          <div
            className="p-6 rounded-lg border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2 className="text-xl font-semibold mb-4">
              {t("invoices.discountAndTax")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("invoices.globalDiscount")}
                </label>
                <select
                  value={formData.globalDiscount.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      globalDiscount: {
                        ...formData.globalDiscount,
                        type: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border mb-2"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="percentage">{t("invoices.percentage")}</option>
                  <option value="fixed">{t("invoices.fixedAmount")}</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.globalDiscount.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      globalDiscount: {
                        ...formData.globalDiscount,
                        value: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("invoices.taxRate")} (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div
            className="p-6 rounded-lg border bg-gray-50"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={20} />
              <h2 className="text-xl font-semibold">{t("invoices.summary")}</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t("invoices.subtotal")}:</span>
                <span className="font-semibold">
                  ${totals.subtotal.toFixed(2)}
                </span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t("invoices.discount")}:</span>
                  <span className="font-semibold">
                    -${totals.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>
                    {t("invoices.tax")} ({formData.taxRate}%):
                  </span>
                  <span className="font-semibold">
                    ${totals.taxAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>{t("invoices.total")}:</span>
                <span>${totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div
            className="p-6 rounded-lg border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <label className="block text-sm font-medium mb-2">
              {t("invoices.notes")} {t("invoices.optional")}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 rounded-lg border resize-none"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard/invoices")}
              className="px-6 py-3 rounded-lg border font-semibold"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              {t("invoices.cancel")}
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={createMutation.isLoading}
              className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {createMutation.isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t("invoices.creating")}
                </>
              ) : (
                <>
                  <FileText size={20} />
                  {t("invoices.createInvoice")}
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateInvoice;

