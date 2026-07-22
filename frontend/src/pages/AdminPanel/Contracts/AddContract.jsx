import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, ArrowLeft, FileText } from "lucide-react";

const AddContract = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    contractName: "",
    contractNumber: "",
    contractType: "Customer",
    customerId: "",
    supplierId: "",
    startDate: "",
    endDate: "",
    contractValue: 0,
    currency: "ILS",
    status: "Draft",
    terms: "",
    renewalTerms: "",
    autoRenewal: false,
    notes: "",
  });

  const { data: contract } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/contracts/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data || [];
    },
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
        contractType: contract.contractType || "Customer",
        customerId: contract.customerId?._id || "",
        supplierId: contract.supplierId?._id || "",
        startDate: contract.startDate
          ? new Date(contract.startDate).toISOString().split("T")[0]
          : "",
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split("T")[0] : "",
        contractValue: contract.contractValue || 0,
        currency: contract.currency || "ILS",
        status: contract.status || "Draft",
        terms: contract.terms || "",
        renewalTerms: contract.renewalTerms || "",
        autoRenewal: contract.autoRenewal || false,
        notes: contract.notes || "",
      });
    }
  }, [contract, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/contracts/${id}`, data);
      }
      return axiosInstance.post("/contracts", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("contracts.contract_updated") || "Contract updated successfully"
          : t("contracts.contract_created") || "Contract created successfully"
      );
      queryClient.invalidateQueries(["contracts"]);
      navigate("/dashboard/contracts");
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
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate("/dashboard/contracts")}
            className="flex items-center gap-2 mb-4 text-sm hover:underline"
            style={{ color: "var(--color-secondary)" }}
          >
            <ArrowLeft size={18} />
            {t("common.back") || "Back"}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h1
                className="text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {isEdit ? t("contracts.edit_contract") || "Edit Contract" : t("contracts.add_contract") || "Add Contract"}
              </h1>
            </div>
          </div>
          <p className="text-sm ml-16" style={{ color: "var(--color-secondary)" }}>
            {isEdit
              ? t("contracts.update_contract_desc") || "Update contract details"
              : t("contracts.create_contract_desc") || "Create a new contract"}
          </p>
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
              {t("contracts.basic_information") || "Basic Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.contract_name") || "Contract Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contractName}
                  onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("contracts.enter_contract_name") || "Enter contract name"}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.contract_number") || "Contract Number"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("contracts.enter_contract_number") || "Enter contract number"}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.contract_type") || "Contract Type"} *
                </label>
                <select
                  required
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="Customer">{t("contracts.customer") || "Customer"}</option>
                  <option value="Supplier">{t("contracts.supplier") || "Supplier"}</option>
                  <option value="Employee">{t("contracts.employee") || "Employee"}</option>
                  <option value="Service">{t("contracts.service") || "Service"}</option>
                  <option value="Lease">{t("contracts.lease") || "Lease"}</option>
                  <option value="Partnership">{t("contracts.partnership") || "Partnership"}</option>
                  <option value="NDA">{t("contracts.nda") || "NDA"}</option>
                  <option value="Other">{t("contracts.other") || "Other"}</option>
                </select>
              </div>
              {formData.contractType === "Customer" && (
                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                    {t("contracts.customer") || "Customer"}
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="">{t("contracts.select_customer") || "Select Customer"}</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {formData.contractType === "Supplier" && (
                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                    {t("contracts.supplier") || "Supplier"}
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="">{t("contracts.select_supplier") || "Select Supplier"}</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name} - {supplier.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b" style={{ color: "var(--text-color)", borderColor: "var(--border-color)" }}>
              {t("contracts.financial_information") || "Financial Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.start_date") || "Start Date"} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.end_date") || "End Date"}
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.contract_value") || "Contract Value"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.contractValue}
                  onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
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
                  {t("contracts.currency") || "Currency"}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
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
                  {t("contracts.status") || "Status"}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="Draft">{t("contracts.draft") || "Draft"}</option>
                  <option value="Active">{t("contracts.active") || "Active"}</option>
                  <option value="Expired">{t("contracts.expired") || "Expired"}</option>
                  <option value="Terminated">{t("contracts.terminated") || "Terminated"}</option>
                  <option value="Renewed">{t("contracts.renewed") || "Renewed"}</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  id="autoRenewal"
                  checked={formData.autoRenewal}
                  onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                  className="w-5 h-5 rounded border-2"
                  style={{
                    borderColor: "var(--border-color)",
                    accentColor: "var(--color-primary)",
                  }}
                />
                <label htmlFor="autoRenewal" className="font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.auto_renewal") || "Auto Renewal"}
                </label>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b" style={{ color: "var(--text-color)", borderColor: "var(--border-color)" }}>
              {t("contracts.additional_information") || "Additional Information"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.terms") || "Terms"}
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  rows={4}
                  placeholder={t("contracts.enter_terms") || "Enter contract terms..."}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.renewal_terms") || "Renewal Terms"}
                </label>
                <textarea
                  value={formData.renewalTerms}
                  onChange={(e) => setFormData({ ...formData, renewalTerms: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  rows={3}
                  placeholder={t("contracts.enter_renewal_terms") || "Enter renewal terms..."}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("contracts.notes") || "Notes"}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  rows={3}
                  placeholder={t("contracts.enter_notes") || "Enter any additional notes..."}
                />
              </div>
            </div>
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
                : t("contracts.save") || "Save"}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => navigate("/dashboard/contracts")}
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
              {t("contracts.cancel") || "Cancel"}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AddContract;
