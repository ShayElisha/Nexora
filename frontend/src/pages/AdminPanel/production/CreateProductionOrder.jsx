import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Factory,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Calendar,
  AlertTriangle,
} from "lucide-react";

const CreateProductionOrder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    productId: "",
    quantity: 1,
    dueDate: "",
    priority: "medium",
    notes: "",
    customerOrderId: "",
    departmentId: "",
    assignedTo: [],
  });

  // Fetch products - only products for sale (sale or both)
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axiosInstance.get("/product");
      if (response.data.success) {
        // Filter only products that are for sale (sale or both)
        return response.data.data.filter(
          (product) => product.productType === "sale" || product.productType === "both"
        );
      }
      return [];
    },
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await axiosInstance.get("/departments");
      return response.data.success ? response.data.data : [];
    },
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees");
      return response.data.success ? response.data.data : [];
    },
  });

  // Check if product has BOM
  const selectedProduct = products.find((p) => p._id === formData.productId);
  const { data: bomData } = useQuery({
    queryKey: ["bom", formData.productId],
    queryFn: async () => {
      if (!formData.productId) return null;
      const response = await axiosInstance.get(`/product-trees?productId=${formData.productId}`);
      return response.data.success && response.data.data.length > 0
        ? response.data.data[0]
        : null;
    },
    enabled: !!formData.productId,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post("/production-orders", data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("הזמנת ייצור נוצרה בהצלחה");
      queryClient.invalidateQueries(["production-orders"]);
      navigate(`/dashboard/production/${data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה ביצירת הזמנת ייצור");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity || !formData.dueDate) {
      toast.error("אנא מלא את כל השדות הנדרשים");
      return;
    }

    if (!bomData) {
      toast.error("למוצר הנבחר אין BOM (רשימת רכיבים). לא ניתן ליצור הזמנת ייצור.");
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ backgroundColor: "var(--border-color)" }}
            >
              <ArrowLeft size={20} style={{ color: "var(--text-color)" }} />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Factory size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                יצירת הזמנת ייצור
              </h1>
              <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
                צור הזמנת ייצור חדשה
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
              פרטי הזמנת ייצור
            </h2>

            <div className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                  מוצר לייצור *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  required
                  disabled={isLoadingProducts}
                >
                  <option value="">בחר מוצר</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.productName} ({product.sku})
                    </option>
                  ))}
                </select>
                {selectedProduct && !bomData && (
                  <div className="mt-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      למוצר זה אין BOM. יש ליצור BOM לפני יצירת הזמנת ייצור.
                    </p>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                  כמות לייצור *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  required
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                  תאריך יעד *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                  עדיפות
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                  <option value="urgent">דחוף</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                  מחלקה
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">בחר מחלקה</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                  הערות
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* BOM Preview */}
          {bomData && (
            <div className="p-6 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                רשימת רכיבים (BOM)
              </h2>
              <div className="space-y-2">
                {bomData.components?.map((component, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "var(--border-color)" }}
                  >
                    <p className="font-medium" style={{ color: "var(--text-color)" }}>
                      {component.componentId?.productName || "רכיב"} x {component.quantity * formData.quantity}
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                      כמות ליחידה: {component.quantity} | כמות כוללת: {component.quantity * formData.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !bomData}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
                opacity: createMutation.isPending || !bomData ? 0.5 : 1,
              }}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  יוצר...
                </>
              ) : (
                <>
                  <Factory size={20} />
                  צור הזמנת ייצור
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateProductionOrder;

