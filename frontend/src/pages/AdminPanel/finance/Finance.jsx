import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Finance = () => {
  const [financeData, setFinanceData] = useState([]);
  const [loading, setLoading] = useState(true); // מצב טעינה
  const [error, setError] = useState(null); // מצב שגיאה

  const queryClient = useQueryClient();

  // Fetch authenticated user data
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;
  const { mutate: getProducts, isLoading } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/finance");
      console.log("finance data:", response.data.data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["finance"]);
      setFinanceData(data); // עדכון רשימת המוצרים
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message); // טיפול בשגיאות
      setLoading(false);
    },
  });

  useEffect(() => {
    getProducts();
  }, [getProducts]);
  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <div className="flex-1 container mx-auto max-w-5xl p-8">
        {loading ? (
          <div className="flex items-center justify-center text-white">
            Loading...
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
              Finance Documents
            </h1>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-900 text-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="py-2 px-4">Transaction ID</th>
                    <th className="py-2 px-4">Date</th>
                    <th className="py-2 px-4">Type</th>
                    <th className="py-2 px-4">Amount</th>
                    <th className="py-2 px-4">Currency</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {financeData.map((doc) => (
                    <tr key={doc._id} className="border-b border-gray-700">
                      <td className="py-2 px-4">{doc._id}</td>
                      <td className="py-2 px-4">
                        {new Date(doc.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">{doc.transactionType}</td>
                      <td className="py-2 px-4">{doc.transactionAmount}</td>
                      <td className="py-2 px-4">{doc.transactionCurrency}</td>
                      <td className="py-2 px-4">{doc.transactionStatus}</td>
                      <td className="py-2 px-4">{doc.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;
