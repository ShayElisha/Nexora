import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2 } from "lucide-react";

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
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
          {isEdit
            ? t("sales.edit_opportunity") || "Edit Sales Opportunity"
            : t("sales.add_opportunity") || "Add Sales Opportunity"}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block mb-2">{t("sales.opportunity_name") || "Opportunity Name"} *</label>
              <input
                type="text"
                required
                value={formData.opportunityName}
                onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("sales.lead") || "Lead"}</label>
              <select
                value={formData.leadId}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">None</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name} - {lead.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("sales.customer") || "Customer"}</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">None</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("sales.stage") || "Stage"} *</label>
              <select
                required
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Prospecting">Prospecting</option>
                <option value="Qualification">Qualification</option>
                <option value="Needs Analysis">Needs Analysis</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("sales.assigned_to") || "Assigned To"} *</label>
              <select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("sales.amount") || "Amount"}</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("sales.currency") || "Currency"}</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="ILS">ILS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("sales.probability") || "Probability (%)"}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("sales.expected_close_date") || "Expected Close Date"}</label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("sales.source") || "Source"}</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
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
              <label className="block mb-2">{t("sales.type") || "Type"}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="New Business">New Business</option>
                <option value="Existing Business">Existing Business</option>
                <option value="Renewal">Renewal</option>
                <option value="Upsell">Upsell</option>
                <option value="Cross-sell">Cross-sell</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block">{t("sales.products") || "Products"}</label>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                <Plus size={16} />
                {t("sales.add_product") || "Add Product"}
              </button>
            </div>
            {formData.products.map((product, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 mb-2 items-end">
                <select
                  value={product.productId}
                  onChange={(e) => updateProduct(index, "productId", e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, "quantity", parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit Price"
                  value={product.unitPrice}
                  onChange={(e) => updateProduct(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Total"
                  value={product.totalPrice}
                  readOnly
                  className="px-3 py-2 border rounded-lg bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block mb-2">{t("sales.notes") || "Notes"}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} />
              {mutation.isLoading ? "Saving..." : t("sales.save") || "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/sales/opportunities")}
              className="flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              <X size={20} />
              {t("sales.cancel") || "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalesOpportunity;

