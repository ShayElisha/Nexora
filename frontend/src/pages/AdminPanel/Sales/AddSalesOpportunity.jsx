import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2, ArrowLeft } from "lucide-react";

const AddSalesOpportunity = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    opportunityName: "",
    leadId: "",
    customerId: "",
    stage: "Prospecting",
    amount: 0,
    currency: "ILS",
    probability: 10,
    expectedCloseDate: "",
    source: "Other",
    type: "New Business",
    assignedTo: "",
    notes: "",
    products: [],
  });

  const { data: opportunity } = useQuery({
    queryKey: ["sales-opportunity", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/sales/opportunities/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await axiosInstance.get("/leads");
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

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
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
    if (opportunity && isEdit) {
      setFormData({
        opportunityName: opportunity.opportunityName || "",
        leadId: opportunity.leadId?._id || "",
        customerId: opportunity.customerId?._id || "",
        stage: opportunity.stage || "Prospecting",
        amount: opportunity.amount || 0,
        currency: opportunity.currency || "ILS",
        probability: opportunity.probability || 10,
        expectedCloseDate: opportunity.expectedCloseDate
          ? new Date(opportunity.expectedCloseDate).toISOString().split("T")[0]
          : "",
        source: opportunity.source || "Other",
        type: opportunity.type || "New Business",
        assignedTo: opportunity.assignedTo?._id || "",
        notes: opportunity.notes || "",
        products: opportunity.products || [],
      });
    }
  }, [opportunity, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/sales/opportunities/${id}`, data);
      }
      return axiosInstance.post("/sales/opportunities", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("sales.opportunity_updated") || "Opportunity updated successfully"
          : t("sales.opportunity_created") || "Opportunity created successfully"
      );
      queryClient.invalidateQueries(["sales-opportunities"]);
      navigate("/dashboard/sales/opportunities");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [
        ...formData.products,
        {
          productId: "",
          productName: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    });
  };

  const removeProduct = (index) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index),
    });
  };

  const updateProduct = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;
    if (field === "quantity" || field === "unitPrice") {
      updatedProducts[index].totalPrice =
        (updatedProducts[index].quantity || 0) * (updatedProducts[index].unitPrice || 0);
    }
    if (field === "productId") {
      const product = products.find((p) => p._id === value);
      if (product) {
        updatedProducts[index].productName = product.productName;
      }
    }
    setFormData({ ...formData, products: updatedProducts });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate("/dashboard/sales/opportunities")}
            className="flex items-center gap-2 mb-4 text-sm hover:underline"
            style={{ color: "var(--color-secondary)" }}
          >
            <ArrowLeft size={18} />
            {t("common.back") || "Back"}
          </button>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
            >
              <Plus size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {isEdit
                  ? t("sales.edit_opportunity") || "Edit Sales Opportunity"
                  : t("sales.add_opportunity") || "Add Sales Opportunity"}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {isEdit
                  ? t("sales.update_opportunity_desc") || "Update opportunity details"
                  : t("sales.create_opportunity_desc") || "Create a new sales opportunity"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.form
          onSubmit={handleSubmit}
          className="rounded-2xl shadow-lg border p-6 md:p-8"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b" style={{ color: "var(--text-color)", borderColor: "var(--border-color)" }}>
              {t("sales.basic_information") || "Basic Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.opportunity_name") || "Opportunity Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.opportunityName}
                  onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("sales.enter_opportunity_name") || "Enter opportunity name"}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.lead") || "Lead"}
                </label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">{t("sales.none") || "None"}</option>
                  {leads.map((lead) => (
                    <option key={lead._id} value={lead._id}>
                      {lead.name} - {lead.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.customer") || "Customer"}
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">{t("sales.none") || "None"}</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.stage") || "Stage"} *
                </label>
                <select
                  required
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="Prospecting">{t("sales.prospecting") || "Prospecting"}</option>
                  <option value="Qualification">{t("sales.qualification") || "Qualification"}</option>
                  <option value="Needs Analysis">{t("sales.needs_analysis") || "Needs Analysis"}</option>
                  <option value="Proposal">{t("sales.proposal") || "Proposal"}</option>
                  <option value="Negotiation">{t("sales.negotiation") || "Negotiation"}</option>
                  <option value="Closed Won">{t("sales.closed_won") || "Closed Won"}</option>
                  <option value="Closed Lost">{t("sales.closed_lost") || "Closed Lost"}</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.assigned_to") || "Assigned To"} *
                </label>
                <select
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">{t("sales.select_employee") || "Select Employee"}</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b" style={{ color: "var(--text-color)", borderColor: "var(--border-color)" }}>
              {t("sales.financial_information") || "Financial Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.amount") || "Amount"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.currency") || "Currency"}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="ILS">ILS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.probability") || "Probability (%)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
                <div className="mt-2 w-full bg-[var(--border-color)] bg-[var(--bg-secondary)] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${formData.probability}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.expected_close_date") || "Expected Close Date"}
                </label>
                <input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.source") || "Source"}
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Email Campaign">Email Campaign</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Partner">Partner</option>
                  <option value="Existing Customer">Existing Customer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("sales.type") || "Type"}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="New Business">New Business</option>
                  <option value="Existing Business">Existing Business</option>
                  <option value="Renewal">Renewal</option>
                  <option value="Upsell">Upsell</option>
                  <option value="Cross-sell">Cross-sell</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("sales.products") || "Products"}
              </h2>
              <motion.button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all"
                style={{
                  backgroundColor: "var(--button-bg)",
                  color: "var(--button-text)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={18} />
                {t("sales.add_product") || "Add Product"}
              </motion.button>
            </div>
            <div className="space-y-3">
              {formData.products.map((product, index) => (
                <motion.div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 rounded-xl border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <select
                    value={product.productId}
                    onChange={(e) => updateProduct(index, "productId", e.target.value)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all md:col-span-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="">{t("sales.select_product") || "Select Product"}</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.productName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder={t("sales.quantity") || "Quantity"}
                    value={product.quantity}
                    onChange={(e) => updateProduct(index, "quantity", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder={t("sales.unit_price") || "Unit Price"}
                    value={product.unitPrice}
                    onChange={(e) => updateProduct(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={t("sales.total") || "Total"}
                      value={product.totalPrice}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--footer-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {formData.products.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: "var(--color-secondary)" }}>
                  {t("sales.no_products_added") || "No products added yet. Click 'Add Product' to get started."}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
              {t("sales.notes") || "Notes"}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              rows={4}
              placeholder={t("sales.enter_notes") || "Enter any additional notes..."}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
            <motion.button
              type="submit"
              disabled={mutation.isLoading}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--button-bg)",
                color: "var(--button-text)",
              }}
              whileHover={{ scale: mutation.isLoading ? 1 : 1.02 }}
              whileTap={{ scale: mutation.isLoading ? 1 : 0.98 }}
            >
              <Save size={20} />
              {mutation.isLoading
                ? t("common.saving") || "Saving..."
                : t("sales.save") || "Save"}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => navigate("/dashboard/sales/opportunities")}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl border shadow-md hover:shadow-lg transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--surface-color)",
                color: "var(--text-color)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X size={20} />
              {t("sales.cancel") || "Cancel"}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AddSalesOpportunity;
