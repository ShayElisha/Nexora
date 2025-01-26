import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../layouts/Sidebar";
import toast from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import currencyList from "../finance/currency.json";

const AddSupplier = ({ authUser }) => {
  const queryClient = useQueryClient();

  const [supplierData, setSupplierData] = useState({
    companyId: authUser?.user?.companyId || "",
    SupplierName: "",
    Contact: "",
    Phone: "",
    Email: "",
    baseCurrency: "USD",
    Address: "",
    BankAccount: "",
    Rating: 1,
    IsActive: true,
  });

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setSupplierData({
      ...supplierData,
      [name]: type === "checkbox" ? e.target.checked : value,
    });
  };

  const addSupplierMutation = useMutation({
    mutationFn: async (newSupplier) => {
      const response = await axiosInstance.post("/suppliers", newSupplier);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Supplier added successfully!");
      queryClient.invalidateQueries(["suppliers"]); // Refresh suppliers list
      setSupplierData({
        companyId: authUser?.user?.companyId || "",
        SupplierName: "",
        Contact: "",
        Phone: "",
        Email: "",
        Address: "",
        baseCurrency: "USD",
        BankAccount: "",
        Rating: 1,
        IsActive: true,
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to add supplier. Please try again."
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addSupplierMutation.mutate(supplierData);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <div className="flex-1 flex justify-center items-center">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">
            Add New Supplier
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 font-medium">
                Supplier Name
              </label>
              <input
                type="text"
                name="SupplierName"
                value={supplierData.SupplierName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Supplier Name"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium">Contact</label>
              <input
                type="text"
                name="Contact"
                value={supplierData.Contact}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Contact Name"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium">Phone</label>
              <input
                type="text"
                name="Phone"
                value={supplierData.Phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Phone Number"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium">Email</label>
              <input
                type="email"
                name="Email"
                value={supplierData.Email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Email"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium">Address</label>
              <input
                type="text"
                name="Address"
                value={supplierData.Address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Address"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium">
                Bank Account
              </label>
              <input
                type="text"
                name="BankAccount"
                value={supplierData.BankAccount}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Bank Account"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium">Rating</label>
              <input
                type="number"
                name="Rating"
                value={supplierData.Rating}
                min="1"
                max="5"
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-medium mb-1">
                Currency:
              </label>
              <select
                name="transactionCurrency"
                value={supplierData.baseCurrency}
                onChange={supplierData}
                className="w-full px-2 py-1 border border-gray-700 bg-gray-700 rounded-md text-gray-300"
                required
              >
                {currencyList.map((currency) => (
                  <option
                    key={currency.currencyCode}
                    value={currency.currencyCode}
                  >
                    {currency.currencyName} ({currency.currencyCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center text-gray-300 font-medium">
                <input
                  type="checkbox"
                  name="IsActive"
                  checked={supplierData.IsActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Active
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              disabled={addSupplierMutation.isLoading}
            >
              {addSupplierMutation.isLoading ? "Adding..." : "Add Supplier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSupplier;
