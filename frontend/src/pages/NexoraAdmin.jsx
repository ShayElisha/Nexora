import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const useCompanyMutation = (type) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companyId) => {
      const endpoint =
        type === "approve" ? "/companies/approve" : "/companies/reject";
      await axiosInstance.put(endpoint, { id: companyId });
    },
    onSuccess: () => {
      toast.success(`Company ${type}d successfully`);
      queryClient.invalidateQueries(["pendingCompanies"]); // Refetch pending companies
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || `Failed to ${type} company`);
    },
  });
};

const NexoraAdmin = () => {
  const { data: pendingCompanies, isLoading } = useQuery({
    queryKey: ["pendingCompanies"],
    queryFn: async () => {
      const res = await axiosInstance.get("/companies/pending");
      // Make sure to return the data array directly
      return res.data.data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to fetch companies");
    },
  });

  const approveCompany = useCompanyMutation("approve");
  const rejectCompany = useCompanyMutation("reject");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Pending Companies
      </h1>

      {!pendingCompanies || pendingCompanies.length === 0 ? (
        <p className="text-center text-gray-600">
          No pending companies at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pendingCompanies.map((company) => (
            <div
              key={company._id}
              className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center"
            >
              {/* Company Logo */}
              <img
                src={
                  company.logo ||
                  "https://via.placeholder.com/100x100?text=Logo"
                }
                alt={`${company.name} Logo`}
                className="w-24 h-24 rounded-full mb-4 bg-gray-100 object-contain"
              />

              {/* Company Name */}
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                {company.name}
              </h2>

              {/* Company Details */}
              <div className="text-sm text-gray-700 space-y-1 w-full">
                <p>
                  <span className="font-semibold text-gray-600 mr-1">
                    Email:
                  </span>
                  {company.email}
                </p>
                <p>
                  <span className="font-semibold text-gray-600 mr-1">
                    Phone:
                  </span>
                  {company.phone}
                </p>
                {company.website && (
                  <p>
                    <span className="font-semibold text-gray-600 mr-1">
                      Website:
                    </span>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </p>
                )}
                <p>
                  <span className="font-semibold text-gray-600 mr-1">
                    Address:
                  </span>
                  {company.address.street}, {company.address.city}
                  {company.address.state && `, ${company.address.state}`}
                  {company.address.postalCode &&
                    `, ${company.address.postalCode}`}
                  , {company.address.country}
                </p>
                <p>
                  <span className="font-semibold text-gray-600 mr-1">
                    Industry:
                  </span>
                  {company.industry}
                </p>
                <p>
                  <span className="font-semibold text-gray-600 mr-1">
                    Subscription:
                  </span>
                  {company.subscription.plan} (
                  {company.subscription.paymentStatus})
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => approveCompany.mutate(company._id)}
                  disabled={approveCompany.isLoading}
                  className={`py-2 px-4 rounded font-bold text-white ${
                    approveCompany.isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {approveCompany.isLoading ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => rejectCompany.mutate(company._id)}
                  disabled={rejectCompany.isLoading}
                  className={`py-2 px-4 rounded font-bold text-white ${
                    rejectCompany.isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {rejectCompany.isLoading ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NexoraAdmin;
