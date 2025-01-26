import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Budgets = () => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const companyId = authUser?.company;
  const queryClient = useQueryClient();
  console.log("authUserbb:", companyId);

  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const response = await axiosInstance.get(`/budget`, {});
      return response.data.data;
    },
    onError: (err) => {
      toast.error(`Error fetching budgets: ${err.message}`);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error.message}</div>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Budgets</h1>
        <Link to="/add-budget" className="btn btn-primary mb-4">
          Add New Budget
        </Link>
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="py-2 px-4">Department/Project</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Currency</th>
              <th className="py-2 px-4">Period</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Created At</th>
              <th className="py-2 px-4">Updated At</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((budget) => (
              <tr key={budget._id}>
                <td className="py-2 px-4">{budget.departmentOrProjectName}</td>
                <td className="py-2 px-4">{budget.amount}</td>
                <td className="py-2 px-4">{budget.currency}</td>
                <td className="py-2 px-4">{budget.period}</td>
                <td className="py-2 px-4">{budget.status}</td>
                <td className="py-2 px-4">
                  {new Date(budget.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-4">
                  {new Date(budget.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-4">
                  <Link
                    to={`/dashboard/finance/budget-details/${budget._id}`}
                    className="text-blue-400"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budgets;
