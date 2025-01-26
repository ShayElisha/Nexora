import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);

  // Fetch authenticated user
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });

  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  // Fetch suppliers
  const { mutate: fetchSuppliers, isLoading: suppliersLoading } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/suppliers");
      return response.data.data;
    },
    onSuccess: (data) => {
      setSuppliers(data);
      setError(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to fetch suppliers.");
      setError(err.message);
    },
  });

  useEffect(() => {
    if (authUser?.company) {
      fetchSuppliers();
    }
  }, [fetchSuppliers, authUser]);

  if (suppliersLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-red-500">User is not authenticated.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-gray-900 text-gray-200">
      <Sidebar className="w-1/5 bg-gray-800 p-4" />
      <div className="flex-1 py-12 px-6">
        <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Supplier List
        </h2>
        {error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : suppliers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div
                key={supplier._id}
                className="bg-gray-800 rounded-lg p-4 shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <h3 className="text-blue-400 font-semibold mb-2">
                  {supplier.SupplierName}
                </h3>
                <p>Contact: {supplier.Contact || "N/A"}</p>
                <p>Email: {supplier.Email || "N/A"}</p>
                <p>Phone: {supplier.Phone || "N/A"}</p>
                <p>Rating: {supplier.Rating || "N/A"}</p>
                <p
                  className={`text-sm font-semibold ${
                    supplier.IsActive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {supplier.IsActive ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No suppliers found.</p>
        )}
      </div>
    </div>
  );
};

export default SupplierList;
