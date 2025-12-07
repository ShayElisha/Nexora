import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, Plus, Trash2 } from "lucide-react";

const AddInventoryMovement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    movementType: "Internal",
    movementDate: new Date().toISOString().split("T")[0],
    fromWarehouseId: "",
    toWarehouseId: "",
    items: [],
    reference: "",
    notes: "",
  });

  const { data: movement } = useQuery({
    queryKey: ["inventory-movement", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/inventory-advanced/movements/${id}`);
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

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (movement && isEdit) {
      setFormData({
        movementType: movement.movementType || "Internal",
        movementDate: movement.movementDate
          ? new Date(movement.movementDate).toISOString().split("T")[0]
          : "",
        fromWarehouseId: movement.fromWarehouseId?._id || "",
        toWarehouseId: movement.toWarehouseId?._id || "",
        items: movement.items || [],
        reference: movement.reference || "",
        notes: movement.notes || "",
      });
    }
  }, [movement, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/inventory-advanced/movements/${id}`, data);
      }
      return axiosInstance.post("/inventory-advanced/movements", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("inventory.movement_updated") || "Movement updated successfully"
          : t("inventory.movement_created") || "Movement created successfully"
      );
      queryClient.invalidateQueries(["inventory-movements"]);
      navigate("/dashboard/inventory/movements");
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
          productName: "",
          quantity: 1,
          unitCost: 0,
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
    if (field === "productId") {
      const product = products.find((p) => p._id === value);
      if (product) {
        updatedItems[index].productName = product.productName;
        updatedItems[index].unitCost = product.unitPrice || 0;
      }
    }
    setFormData({ ...formData, items: updatedItems });
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
          {isEdit
            ? t("inventory.edit_movement") || "Edit Inventory Movement"
            : t("inventory.add_movement") || "Add Inventory Movement"}
        </h1>

        <form onSubmit={handleSubmit} className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.movement_type") || "Movement Type"} *</label>
                <select
                  required
                  value={formData.movementType}
                  onChange={(e) => setFormData({ ...formData, movementType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                <option value="Internal">Internal</option>
                <option value="External">External</option>
                <option value="Production">Production</option>
                <option value="Service">Service</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Return">Return</option>
              </select>
            </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.movement_date") || "Movement Date"} *</label>
                <input
                  type="date"
                  required
                  value={formData.movementDate}
                  onChange={(e) => setFormData({ ...formData, movementDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>
              {formData.movementType === "Internal" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.from_warehouse") || "From Warehouse"} *</label>
                    <select
                      required
                      value={formData.fromWarehouseId}
                      onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.to_warehouse") || "To Warehouse"} *</label>
                    <select
                      required
                      value={formData.toWarehouseId}
                      onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses
                        .filter((wh) => wh._id !== formData.fromWarehouseId)
                        .map((wh) => (
                          <option key={wh._id} value={wh._id}>
                            {wh.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>{t("inventory.reference") || "Reference"}</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-color)' }}>{t("inventory.items") || "Items"} *</label>
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
                <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
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
                    required
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Cost"
                    value={item.unitCost}
                    onChange={(e) => updateItem(index, "unitCost", parseFloat(e.target.value) || 0)}
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
                onClick={() => navigate("/dashboard/inventory/movements")}
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

export default AddInventoryMovement;

