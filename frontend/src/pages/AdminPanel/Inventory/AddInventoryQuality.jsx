import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X } from "lucide-react";

const AddInventoryQuality = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    productId: "",
    warehouseId: "",
    checkType: "Incoming",
    checkDate: new Date().toISOString().split("T")[0],
    batchNumber: "",
    quantityChecked: 0,
    passed: 0,
    rejected: 0,
    overallResult: "Pass",
    inspectionCriteria: [],
    notes: "",
  });

  const { data: qualityCheck } = useQuery({
    queryKey: ["inventory-quality", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/inventory-advanced/quality/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product");
      return res.data.data || [];
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/warehouses");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (qualityCheck && isEdit) {
      setFormData({
        productId: qualityCheck.productId?._id || "",
        warehouseId: qualityCheck.warehouseId?._id || "",
        checkType: qualityCheck.checkType || "Incoming",
        checkDate: qualityCheck.checkDate
          ? new Date(qualityCheck.checkDate).toISOString().split("T")[0]
          : "",
        batchNumber: qualityCheck.batchNumber || "",
        quantityChecked: qualityCheck.quantityChecked || 0,
        passed: qualityCheck.passed || 0,
        rejected: qualityCheck.rejected || 0,
        overallResult: qualityCheck.overallResult || "Pass",
        inspectionCriteria: qualityCheck.inspectionCriteria || [],
        notes: qualityCheck.notes || "",
      });
    }
  }, [qualityCheck, isEdit]);

  useEffect(() => {
    if (formData.passed + formData.rejected > formData.quantityChecked) {
      setFormData((prev) => ({
        ...prev,
        quantityChecked: prev.passed + prev.rejected,
      }));
    }
    if (formData.rejected > 0) {
      setFormData((prev) => ({
        ...prev,
        overallResult: prev.rejected > prev.passed ? "Fail" : "Conditional",
      }));
    } else if (formData.passed === formData.quantityChecked && formData.quantityChecked > 0) {
      setFormData((prev) => ({
        ...prev,
        overallResult: "Pass",
      }));
    }
  }, [formData.passed, formData.rejected, formData.quantityChecked]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/inventory-advanced/quality/${id}`, data);
      }
      return axiosInstance.post("/inventory-advanced/quality", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("inventory.quality_check_updated") || "Quality check updated successfully"
          : t("inventory.quality_check_created") || "Quality check created successfully"
      );
      queryClient.invalidateQueries(["inventory-quality"]);
      navigate("/dashboard/inventory/quality");
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
          {isEdit
            ? t("inventory.edit_quality_check") || "Edit Quality Check"
            : t("inventory.add_quality_check") || "Add Quality Check"}
        </h1>

        <form onSubmit={handleSubmit} className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.product") || "Product"} *</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.warehouse") || "Warehouse"}</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh._id} value={wh._id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.check_type") || "Check Type"} *</label>
              <select
                required
                value={formData.checkType}
                onChange={(e) => setFormData({ ...formData, checkType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="Incoming">Incoming</option>
                <option value="Outgoing">Outgoing</option>
                <option value="Periodic">Periodic</option>
                <option value="Random">Random</option>
                <option value="Complaint">Complaint</option>
                <option value="Return">Return</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.check_date") || "Check Date"} *</label>
              <input
                type="date"
                required
                value={formData.checkDate}
                onChange={(e) => setFormData({ ...formData, checkDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.batch_number") || "Batch Number"}</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.quantity_checked") || "Quantity Checked"} *</label>
              <input
                type="number"
                required
                value={formData.quantityChecked}
                onChange={(e) => setFormData({ ...formData, quantityChecked: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.passed") || "Passed"} *</label>
              <input
                type="number"
                required
                value={formData.passed}
                onChange={(e) => setFormData({ ...formData, passed: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.rejected") || "Rejected"} *</label>
              <input
                type="number"
                required
                value={formData.rejected}
                onChange={(e) => setFormData({ ...formData, rejected: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.overall_result") || "Overall Result"} *</label>
              <select
                required
                value={formData.overallResult}
                onChange={(e) => setFormData({ ...formData, overallResult: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Conditional">Conditional</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2">{t("inventory.notes") || "Notes"}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

            <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Save size={20} />
                {mutation.isLoading ? "Saving..." : t("inventory.save") || "Save"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/inventory/quality")}
                className="flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                <X size={20} />
                {t("inventory.cancel") || "Cancel"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryQuality;

