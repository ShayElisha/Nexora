import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import { toast } from "react-hot-toast";

const UpdateForSupplier = () => {
  const { purchaseOrder } = useParams();
  const [oldProcurement, setOldProcurement] = useState(null);
  const [newProcurement, setNewProcurement] = useState(null);
  const [error, setError] = useState(null);

  const { mutate: fetchProcurement, isLoading: oldProcurementLoading } =
    useMutation({
      mutationFn: async () => {
        const response = await axiosInstance.get(
          `/procurement/by/${purchaseOrder}`
        );
        if (!response.data || !response.data.data) {
          toast.error("No procurement data found.");
        }
        return response.data.data;
      },
      onSuccess: (data) => {
        setOldProcurement(data);
        setError(null);
      },
      onError: (err) => {
        toast.error(
          err.response?.data?.message || "Failed to fetch old procurement."
        );
        setError(err.message);
      },
    });

  const { mutate: fetchUpdatedProcurement, isLoading: newProcurementLoading } =
    useMutation({
      mutationFn: async () => {
        const response = await axiosInstance.get(
          `/updateProcurement/by/${purchaseOrder}`
        );
        if (!response.data || !response.data.data) {
          toast.error("No updated procurement data found.");
        }
        return response.data.data;
      },
      onSuccess: (data) => {
        setNewProcurement(data);
        setError(null);
      },
      onError: (err) => {
        toast.error(
          err.response?.data?.message || "Failed to fetch updated procurement."
        );
        setError(err.message);
      },
    });

  // Approve update
  const { mutate: updateProcurement, isLoading: updateLoading } = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.put(
        `/suppliers/approve-update/${purchaseOrder}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Update successful!");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Failed to update procurement."
      );
      setError(err.message);
    },
  });
  const { mutate: rejectUpdateProcurement, isLoading: rejectUpdateLoading } =
    useMutation({
      mutationFn: async () => {
        const response = await axiosInstance.put(
          `/suppliers/reject-update/${purchaseOrder}`
        );
        return response.data;
      },
      onSuccess: () => {
        toast.success("Update successful!");
      },
      onError: (err) => {
        toast.error(
          err.response?.data?.message || "Failed to update procurement."
        );
        setError(err.message);
      },
    });

  useEffect(() => {
    if (purchaseOrder) {
      try {
        fetchProcurement();
        fetchUpdatedProcurement();
      } catch (err) {
        console.error("Error fetching procurement data:", err);
        setError("Failed to fetch procurement data.");
      }
    }
  }, [purchaseOrder, fetchProcurement, fetchUpdatedProcurement]);

  const supplierName = oldProcurement?.supplierName || "Supplier";
  const companyName = oldProcurement?.companyId?.CompanyName || "Acme Co.";

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 rounded-md shadow-md font-sans">
      {/* כותרת ושאלה */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Hello {supplierName},
      </h1>
      <p className="text-gray-700 mb-6 text-lg">
        Would you like to confirm the purchase certificate update for{" "}
        <span className="font-semibold">{companyName}</span>?
      </p>

      {/* Loading indicators / Error message */}
      {(oldProcurementLoading || newProcurementLoading) && (
        <p className="text-blue-500 font-semibold">Loading...</p>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* אם אין לנו עדיין את שתי הרשומות להשוואה */}
      {!oldProcurement || !newProcurement ? (
        <div className="bg-white rounded p-4 shadow-sm text-gray-700">
          <p>Could not find procurement data to compare.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* עמודה ראשונה: נתוני הרכש המקורי */}
          <div className="bg-white rounded-md shadow p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              Original Procurement Data
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Product
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      SKU
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Category
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Price
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Qty
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {oldProcurement.products?.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-2 border-b">{product.productName}</td>
                      <td className="p-2 border-b">{product.SKU}</td>
                      <td className="p-2 border-b">{product.category}</td>
                      <td className="p-2 border-b">
                        {product.unitPrice} {oldProcurement.currency || "USD"}
                      </td>
                      <td className="p-2 border-b">{product.quantity}</td>
                      <td className="p-2 border-b">
                        {product.total} {oldProcurement.currency || "USD"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right">
              <span className="font-semibold text-gray-800 mr-2">
                Total Cost:
              </span>
              <span className="font-bold text-gray-900">
                {oldProcurement.totalCost} {oldProcurement.currency || "USD"}
              </span>
            </div>
          </div>

          {/* עמודה שנייה: נתוני הרכש המעודכן (מ-PendingUpdate) */}
          <div className="bg-white rounded-md shadow p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              Updated Procurement Data
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Product
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      SKU
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Category
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Price
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Qty
                    </th>
                    <th className="border-b p-2 font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newProcurement.updatedData?.products?.map(
                    (product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-2 border-b">{product.productName}</td>
                        <td className="p-2 border-b">{product.SKU}</td>
                        <td className="p-2 border-b">{product.category}</td>
                        <td className="p-2 border-b">
                          {product.unitPrice}{" "}
                          {newProcurement.updatedData?.currency || "USD"}
                        </td>
                        <td className="p-2 border-b">{product.quantity}</td>
                        <td className="p-2 border-b">
                          {product.total}{" "}
                          {newProcurement.updatedData?.currency || "USD"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right">
              <span className="font-semibold text-gray-800 mr-2">
                Total Cost:
              </span>
              <span className="font-bold text-gray-900">
                {newProcurement.updatedData?.totalCost}{" "}
                {newProcurement.updatedData?.currency || "USD"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* כפתורי אישור ודחייה */}
      <div className="mt-8 flex justify-end gap-4">
        {/* Confirm button passes the required data to updateProcurement */}
        <button
          className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 transition-colors font-semibold shadow"
          onClick={() => {
            updateProcurement({
              updates: {
                products: newProcurement.updatedData?.products,
                currency: newProcurement.updatedData?.currency,
                totalCost: newProcurement.updatedData?.totalCost,
              },
            });
          }}
          disabled={updateLoading}
        >
          {updateLoading ? "Confirming..." : "Confirm"}
        </button>

        <button
          className="bg-red-500 text-white py-2 px-6 rounded hover:bg-red-600 transition-colors font-semibold shadow"
          onClick={() => {
            rejectUpdateProcurement({});
          }}
          disabled={rejectUpdateLoading}
        >
          {rejectUpdateLoading ? "Rejecting..." : "Reject"}
        </button>
      </div>
    </div>
  );
};

export default UpdateForSupplier;
