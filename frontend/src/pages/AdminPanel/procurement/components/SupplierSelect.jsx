// src/components/procurement/SupplierSelect.jsx
import { useSupplierStore } from "../../../../stores/useSupplierStore.js";

const SupplierSelect = ({ supplierId, onChange }) => {
  const { suppliers, isLoading, error } = useSupplierStore();

  if (isLoading) return <p>Loading suppliers...</p>;
  if (error) return <p>Error loading suppliers: {error}</p>;

  return (
    <select
      name="supplierId"
      value={supplierId}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 rounded bg-gray-700"
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
