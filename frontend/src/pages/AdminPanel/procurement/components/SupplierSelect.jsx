// src/components/procurement/SupplierSelect.jsx
import { useSupplierStore } from "../../../../stores/useSupplierStore.js";

const SupplierSelect = ({ supplierId, onChange }) => {
  const { suppliers, isLoading, error } = useSupplierStore();

  if (isLoading) return <p className="text-text">Loading suppliers...</p>;
  if (error)
    return <p className="text-red-500">Error loading suppliers: {error}</p>;

  return (
    <select
      name="supplierId"
      value={supplierId}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-md mx-auto p-2 rounded bg-bg text-text border border-border-color"
    >
      <option value="">Select Supplier</option>
      {suppliers.map((supplier) => (
        <option key={supplier._id} value={supplier._id}>
          {supplier.SupplierName}
        </option>
      ))}
    </select>
  );
};

export default SupplierSelect;
