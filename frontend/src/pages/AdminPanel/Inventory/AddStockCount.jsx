import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2 } from "lucide-react";

const AddStockCount = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    warehouseId: "",
    countType: "Full",
    countDate: new Date().toISOString().split("T")[0],
    scheduledDate: "",
    items: [],
    notes: "",
  });

  const { data: stockCount } = useQuery({
    queryKey: ["stock-count", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/inventory-advanced/stock-counts/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/warehouses");
      return res.data.data || [];
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory", formData.warehouseId],
    queryFn: async () => {
      if (!formData.warehouseId) return [];
      const res = await axiosInstance.get(`/inventory/warehouse/${formData.warehouseId}`);
      return res.data.data || [];
    },
    enabled: !!formData.warehouseId,
  });

  useEffect(() => {
    if (stockCount && isEdit) {
      setFormData({
        warehouseId: stockCount.warehouseId?._id || "",
        countType: stockCount.countType || "Full",
        countDate: stockCount.countDate
          ? new Date(stockCount.countDate).toISOString().split("T")[0]
          : "",
        scheduledDate: stockCount.scheduledDate
          ? new Date(stockCount.scheduledDate).toISOString().split("T")[0]
          : "",
        items: stockCount.items || [],
        notes: stockCount.notes || "",
      });
    }
  }, [stockCount, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/inventory-advanced/stock-counts/${id}`, data);
      }
      return axiosInstance.post("/inventory-advanced/stock-counts", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("inventory.stock_count_updated") || "Stock count updated successfully"
          : t("inventory.stock_count_created") || "Stock count created successfully"
      );
      queryClient.invalidateQueries(["stock-counts"]);
      navigate("/dashboard/inventory/stock-counts");
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
          inventoryId: "",
          productName: "",
          location: "",
          systemQuantity: 0,
          countedQuantity: 0,
          variance: 0,
          unitCost: 0,
          varianceValue: 0,
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
    
    if (field === "inventoryId") {
      const invItem = inventory.find((inv) => inv._id === value);
      if (invItem) {
        updatedItems[index].productId = invItem.productId?._id || "";
        updatedItems[index].productName = invItem.productId?.productName || "";
        updatedItems[index].systemQuantity = invItem.quantity || 0;
        updatedItems[index].unitCost = invItem.productId?.unitPrice || 0;
      }
    }
    
    if (field === "countedQuantity") {
      const systemQty = updatedItems[index].systemQuantity || 0;
      const counted = parseFloat(value) || 0;
      updatedItems[index].variance = counted - systemQty;
      updatedItems[index].varianceValue = (counted - systemQty) * (updatedItems[index].unitCost || 0);
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
          {isEdit
            ? t("inventory.edit_stock_count") || "Edit Stock Count"
            : t("inventory.add_stock_count") || "Add Stock Count"}
        </h1>

        <form onSubmit={handleSubmit} className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.warehouse") || "Warehouse"} *</label>
              <select
                required
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
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.count_type") || "Count Type"} *</label>
              <select
                required
                value={formData.countType}
                onChange={(e) => setFormData({ ...formData, countType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="Full">Full</option>
                <option value="Partial">Partial</option>
                <option value="Cycle">Cycle</option>
                <option value="Spot">Spot</option>
                <option value="Random">Random</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.count_date") || "Count Date"} *</label>
              <input
                type="date"
                required
                value={formData.countDate}
                onChange={(e) => setFormData({ ...formData, countDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.scheduled_date") || "Scheduled Date"}</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            </div>

            {formData.warehouseId && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-color)' }}>{t("inventory.items") || "Items"}</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 px-3 py-1 rounded text-sm text-white hover:opacity-90 transition"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus size={16} />
                  {t("inventory.add_item") || "Add Item"}
                </button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-2 mb-2 items-end p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <select
                    value={item.inventoryId}
                    onChange={(e) => updateItem(index, "inventoryId", e.target.value)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  >
                    <option value="">Select Product</option>
                    {inventory.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {inv.productId?.productName} - Qty: {inv.quantity}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="System Qty"
                    value={item.systemQuantity}
                    readOnly
                    className="px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', opacity: 0.7 }}
                  />
                  <input
                    type="number"
                    placeholder="Counted Qty"
                    value={item.countedQuantity}
                    onChange={(e) => updateItem(index, "countedQuantity", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                  <input
                    type="number"
                    placeholder="Variance"
                    value={item.variance}
                    readOnly
                    className={`px-3 py-2 rounded-lg border ${
                      item.variance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', opacity: 0.7 }}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={item.location}
                    onChange={(e) => updateItem(index, "location", e.target.value)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.notes") || "Notes"}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
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
                onClick={() => navigate("/dashboard/inventory/stock-counts")}
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

export default AddStockCount;

