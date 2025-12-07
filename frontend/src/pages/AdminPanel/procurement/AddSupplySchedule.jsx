import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";

const AddSupplySchedule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    supplierId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "Scheduled",
    schedule: [],
    notes: "",
  });

  const { data: supplySchedule } = useQuery({
    queryKey: ["supply-schedule", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/procurement-advanced/supply-schedules/${id}`);
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

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/warehouses");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (supplySchedule && isEdit) {
      setFormData({
        supplierId: supplySchedule.supplierId?._id || "",
        startDate: supplySchedule.startDate ? new Date(supplySchedule.startDate).toISOString().split("T")[0] : "",
        endDate: supplySchedule.endDate ? new Date(supplySchedule.endDate).toISOString().split("T")[0] : "",
        status: supplySchedule.status || "Scheduled",
        schedule: supplySchedule.schedule || [],
        notes: supplySchedule.notes || "",
      });
    }
  }, [supplySchedule, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/procurement-advanced/supply-schedules/${id}`, data);
      }
      return axiosInstance.post("/procurement-advanced/supply-schedules", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("procurement.schedule_updated") || "Supply schedule updated successfully"
          : t("procurement.schedule_created") || "Supply schedule created successfully"
      );
      queryClient.invalidateQueries(["supply-schedules"]);
      navigate("/dashboard/procurement/supply-schedules");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addScheduleItem = () => {
    setFormData({
      ...formData,
      schedule: [
        ...formData.schedule,
        {
          productId: "",
          productName: "",
          quantity: 1,
          deliveryDate: "",
          warehouseId: "",
          status: "Scheduled",
        },
      ],
    });
  };

  const removeScheduleItem = (index) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index),
    });
  };

  const updateScheduleItem = (index, field, value) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[index][field] = value;
    if (field === "productId") {
      const product = products.find((p) => p._id === value);
      if (product) {
        updatedSchedule[index].productName = product.productName;
      }
    }
    setFormData({ ...formData, schedule: updatedSchedule });
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
              onClick={() => navigate("/dashboard/procurement/supply-schedules")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              style={{ color: 'var(--text-color)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isEdit
                  ? t("procurement.edit_supply_schedule") || "Edit Supply Schedule"
                  : t("procurement.add_supply_schedule") || "Add Supply Schedule"}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t("procurement.fill_schedule_details") || "Fill in the details below to create a supply schedule"}
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
                    <option value="Scheduled">{t("procurement.scheduled") || "Scheduled"}</option>
                    <option value="In Progress">{t("procurement.in_progress") || "In Progress"}</option>
                    <option value="Partially Delivered">{t("procurement.partially_delivered") || "Partially Delivered"}</option>
                    <option value="Delivered">{t("procurement.delivered") || "Delivered"}</option>
                    <option value="Delayed">{t("procurement.delayed") || "Delayed"}</option>
                    <option value="Cancelled">{t("procurement.cancelled") || "Cancelled"}</option>
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
              </div>
            </div>

            {/* Schedule Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.schedule") || "Schedule"} *
                </h2>
                <button
                  type="button"
                  onClick={addScheduleItem}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus size={18} />
                  {t("procurement.add_schedule_item") || "Add Schedule Item"}
                </button>
              </div>
              {formData.schedule.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {t("procurement.no_schedule_items") || "No schedule items added yet. Click 'Add Schedule Item' to get started."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.schedule.map((item, index) => (
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
                            onChange={(e) => updateScheduleItem(index, "productId", e.target.value)}
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
                            {t("procurement.quantity") || "Quantity"} *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateScheduleItem(index, "quantity", parseFloat(e.target.value) || 0)}
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
                            {t("procurement.delivery_date") || "Delivery Date"} *
                          </label>
                          <input
                            type="date"
                            required
                            value={item.deliveryDate}
                            onChange={(e) => updateScheduleItem(index, "deliveryDate", e.target.value)}
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
                            {t("procurement.warehouse") || "Warehouse"}
                          </label>
                          <select
                            value={item.warehouseId}
                            onChange={(e) => updateScheduleItem(index, "warehouseId", e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                            style={{ 
                              borderColor: 'var(--border-color)', 
                              backgroundColor: 'var(--bg-color)', 
                              color: 'var(--text-color)',
                              '--tw-ring-color': 'var(--color-primary)'
                            }}
                          >
                            <option value="">{t("procurement.select_warehouse") || "Select Warehouse"}</option>
                            {warehouses.map((wh) => (
                              <option key={wh._id} value={wh._id}>
                                {wh.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeScheduleItem(index)}
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
                onClick={() => navigate("/dashboard/procurement/supply-schedules")}
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

export default AddSupplySchedule;

