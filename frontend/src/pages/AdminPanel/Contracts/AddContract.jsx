import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X } from "lucide-react";

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
          {isEdit ? t("contracts.edit_contract") || "Edit Contract" : t("contracts.add_contract") || "Add Contract"}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block mb-2">{t("contracts.contract_name") || "Contract Name"} *</label>
              <input
                type="text"
                required
                value={formData.contractName}
                onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("contracts.contract_number") || "Contract Number"} *</label>
              <input
                type="text"
                required
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("contracts.contract_type") || "Contract Type"} *</label>
              <select
                required
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Customer">Customer</option>
                <option value="Supplier">Supplier</option>
                <option value="Employee">Employee</option>
                <option value="Service">Service</option>
                <option value="Lease">Lease</option>
                <option value="Partnership">Partnership</option>
                <option value="NDA">NDA</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.contractType === "Customer" && (
              <div>
                <label className="block mb-2">{t("contracts.customer") || "Customer"}</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Customer</option>
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
                <label className="block mb-2">{t("contracts.supplier") || "Supplier"}</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} - {supplier.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block mb-2">{t("contracts.start_date") || "Start Date"} *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("contracts.end_date") || "End Date"}</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("contracts.contract_value") || "Contract Value"}</label>
              <input
                type="number"
                step="0.01"
                value={formData.contractValue}
                onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("contracts.currency") || "Currency"}</label>
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
              <label className="block mb-2">{t("contracts.status") || "Status"}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Terminated">Terminated</option>
                <option value="Renewed">Renewed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoRenewal}
                onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                className="w-4 h-4"
              />
              <label>{t("contracts.auto_renewal") || "Auto Renewal"}</label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2">{t("contracts.terms") || "Terms"}</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={4}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">{t("contracts.renewal_terms") || "Renewal Terms"}</label>
            <textarea
              value={formData.renewalTerms}
              onChange={(e) => setFormData({ ...formData, renewalTerms: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">{t("contracts.notes") || "Notes"}</label>
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
              {mutation.isLoading ? "Saving..." : t("contracts.save") || "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/contracts")}
              className="flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              <X size={20} />
              {t("contracts.cancel") || "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContract;

