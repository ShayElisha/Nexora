import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Loader2, ArrowLeft } from "lucide-react";

const AddSupplierContract = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    contractName: "",
    contractNumber: "",
    supplierId: "",
    startDate: "",
    endDate: "",
    contractValue: 0,
    currency: "ILS",
    status: "Draft",
    paymentTerms: "",
    deliveryTerms: "",
    autoRenewal: false,
    notes: "",
  });

  const { data: contract } = useQuery({
    queryKey: ["supplier-contract", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/procurement-advanced/supplier-contracts/${id}`);
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

  useEffect(() => {
    if (contract && isEdit) {
      setFormData({
        contractName: contract.contractName || "",
        contractNumber: contract.contractNumber || "",
        supplierId: contract.supplierId?._id || "",
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split("T")[0] : "",
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split("T")[0] : "",
        contractValue: contract.contractValue || 0,
        currency: contract.currency || "ILS",
        status: contract.status || "Draft",
        paymentTerms: contract.paymentTerms || "",
        deliveryTerms: contract.deliveryTerms || "",
        autoRenewal: contract.autoRenewal || false,
        notes: contract.notes || "",
      });
    }
  }, [contract, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/procurement-advanced/supplier-contracts/${id}`, data);
      }
      return axiosInstance.post("/procurement-advanced/supplier-contracts", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("procurement.contract_updated") || "Contract updated successfully"
          : t("procurement.contract_created") || "Contract created successfully"
      );
      queryClient.invalidateQueries(["supplier-contracts"]);
      navigate("/dashboard/procurement/supplier-contracts");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
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
              onClick={() => navigate("/dashboard/procurement/supplier-contracts")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              style={{ color: 'var(--text-color)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isEdit
                  ? t("procurement.edit_supplier_contract") || "Edit Supplier Contract"
                  : t("procurement.add_supplier_contract") || "Add Supplier Contract"}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t("procurement.fill_contract_details") || "Fill in the details below to create a supplier contract"}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.contract_name") || "Contract Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contractName}
                    onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
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
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.contract_number") || "Contract Number"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
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
                    {t("procurement.contract_value") || "Contract Value"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
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
                    <option value="Draft">{t("procurement.draft") || "Draft"}</option>
                    <option value="Active">{t("procurement.active") || "Active"}</option>
                    <option value="Expired">{t("procurement.expired") || "Expired"}</option>
                    <option value="Terminated">{t("procurement.terminated") || "Terminated"}</option>
                    <option value="Renewed">{t("procurement.renewed") || "Renewed"}</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.autoRenewal}
                    onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <label className="text-sm" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.auto_renewal") || "Auto Renewal"}
                  </label>
                </div>
              </div>
            </div>

            {/* Terms Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.terms") || "Terms & Conditions"}
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
                    {t("procurement.delivery_terms") || "Delivery Terms"}
                  </label>
                  <textarea
                    value={formData.deliveryTerms}
                    onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition resize-none"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                    rows={3}
                    placeholder={t("procurement.delivery_terms_placeholder") || "Enter delivery terms..."}
                  />
                </div>
              </div>
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
                onClick={() => navigate("/dashboard/procurement/supplier-contracts")}
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

export default AddSupplierContract;

