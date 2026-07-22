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
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-[var(--border-color)] h-12 w-12 mb-4"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        <h1
          className="text-3xl font-bold text-center mb-8"
          style={{ color: "var(--text-color)" }}
        >
          Pending Companies
        </h1>

        {!pendingCompanies || pendingCompanies.length === 0 ? (
          <p
            className="text-center"
            style={{ color: "var(--color-secondary)" }}
          >
            No pending companies at the moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pendingCompanies.map((company) => (
              <div
                key={company._id}
                className="shadow-md rounded-lg p-6 flex flex-col items-center border"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                {/* Company Logo */}
                <img
                  src={
                    company.logo ||
                    "https://via.placeholder.com/100x100?text=Logo"
                  }
                  alt={`${company.name} Logo`}
                  className="w-24 h-24 rounded-full mb-4 object-contain"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                />

                {/* Company Name */}
                <h2
                  className="text-xl font-semibold mb-2 text-center"
                  style={{ color: "var(--text-color)" }}
                >
                  {company.name}
                </h2>

                {/* Company Details */}
                <div
                  className="text-sm space-y-1 w-full"
                  style={{ color: "var(--text-color)" }}
                >
                  <p>
                    <span
                      className="font-semibold mr-1"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      Email:
                    </span>
                    {company.email}
                  </p>
                  <p>
                    <span
                      className="font-semibold mr-1"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      Phone:
                    </span>
                    {company.phone}
                  </p>
                  {company.website && (
                    <p>
                      <span
                        className="font-semibold mr-1"
                        style={{ color: "var(--color-secondary)" }}
                      >
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
                    <span
                      className="font-semibold mr-1"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      Address:
                    </span>
                    {company.address.street}, {company.address.city}
                    {company.address.state && `, ${company.address.state}`}
                    {company.address.postalCode &&
                      `, ${company.address.postalCode}`}
                    , {company.address.country}
                  </p>
                  <p>
                    <span
                      className="font-semibold mr-1"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      Industry:
                    </span>
                    {company.industry}
                  </p>
                  <p>
                    <span
                      className="font-semibold mr-1"
                      style={{ color: "var(--color-secondary)" }}
                    >
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
                    className={`py-1.5 px-3 rounded font-bold text-sm text-white ${
                      approveCompany.isLoading
                        ? "cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    style={
                      approveCompany.isLoading
                        ? {
                            backgroundColor: "var(--color-secondary)",
                            color: "var(--button-text)",
                          }
                        : undefined
                    }
                  >
                    {approveCompany.isLoading ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => rejectCompany.mutate(company._id)}
                    disabled={rejectCompany.isLoading}
                    className={`py-1.5 px-3 rounded font-bold text-sm text-white ${
                      rejectCompany.isLoading
                        ? "cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                    style={
                      rejectCompany.isLoading
                        ? {
                            backgroundColor: "var(--color-secondary)",
                            color: "var(--button-text)",
                          }
                        : undefined
                    }
                  >
                    {rejectCompany.isLoading ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NexoraAdmin;
