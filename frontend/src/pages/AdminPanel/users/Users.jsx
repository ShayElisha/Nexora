import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

// Function to generate a random color
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const Users = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/employees");
        const uniqueUsers = Array.from(
          new Map(
            response.data.data.map((user) => [user._id || user.email, user])
          ).values()
        );
        return uniqueUsers;
      } catch (err) {
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (employeeId) =>
      axiosInstance.delete(`/employees/${employeeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      toast.success(t("users.deleted"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("users.error_deleting"));
    },
  });

  const updateEmployeeStatusMutation = useMutation({
    mutationFn: ({ employeeId, status }) =>
      axiosInstance.put(`/employees/${employeeId}`, { status }), // Removed 'await' here
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      toast.success(t("users.status_updated"));
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("users.error_updating_status")
      );
    },
  });

  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    const searchableString = [
      user.name || "",
      user.lastName || "",
      user.email || "",
      user.phone || "",
      user.role || "",
      `${user.address?.city || ""} ${user.address?.street || ""} ${
        user.address?.country || ""
      } ${user.address?.postalCode || ""}`,
      user.projects
        ?.map((proj) => proj.projectId?.name || "")
        .filter(Boolean)
        .join(" ") || "",
      user.performanceReviews?.length > 0
        ? `${user.performanceReviews.length} ${t("users.reviews")}`
        : t("users.no_reviews"),
    ]
      .join(" ")
      .toLowerCase();

    return searchableString.includes(searchLower);
  });

  const handleImageError = (userId) => {
    setImageErrors((prev) => ({ ...prev, [userId]: true }));
  };

  const handleRowClick = (user) => {
    setSelectedRow(selectedRow === user._id ? null : user._id);
  };

  const handleDelete = (employeeId) => {
    if (window.confirm(t("users.confirm_delete"))) {
      deleteEmployeeMutation.mutate(employeeId);
    }
  };

  const handleStatusChange = (employeeId, status) => {
    updateEmployeeStatusMutation.mutate({ employeeId, status });
  };

  // Helper function to format address object into a string
  const formatAddress = (address) => {
    if (!address) return "-";
    const { city, street, country, postalCode } = address;
    return `${street}, ${city}, ${country} ${postalCode}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800 flex justify-center items-start py-8">
      <div className="w-4/5 p-6 rounded-xl shadow-md border border-gray-200 bg-white">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-600">
          {t("users.users_list")}
        </h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder={t("users.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600 animate-pulse">{t("users.loading")}</p>
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center h-64 text-red-500 font-medium">
            {error?.message || t("users.failed_to_load_users")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-gray-700 rounded-xl overflow-hidden text-center border border-gray-200">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-3 px-4">{t("users.profile_image")}</th>
                  <th className="py-3 px-4">{t("users.name")}</th>
                  <th className="py-3 px-4">{t("users.last_name")}</th>
                  <th className="py-3 px-4">{t("users.email")}</th>
                  <th className="py-3 px-4">{t("users.phone")}</th>
                  <th className="py-3 px-4">{t("users.role")}</th>
                  <th className="py-3 px-4">{t("users.address")}</th>
                  <th className="py-3 px-4">{t("users.status")}</th>
                  <th className="py-3 px-4">{t("users.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-6 px-4 text-center text-gray-500 italic"
                    >
                      {searchTerm
                        ? t("users.no_users_match")
                        : t("users.no_users")}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    const initial = (user.name ||
                      user.lastName ||
                      "U")[0].toUpperCase();
                    const backgroundColor = getRandomColor();
                    const hasImageError =
                      imageErrors[user._id || `${user.email}-${index}`];
                    const shouldShowInitial =
                      !user.profileImage || hasImageError;

                    return (
                      <>
                        <tr
                          key={user._id || `${user.email}-${index}`}
                          className="border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => handleRowClick(user)}
                        >
                          <td className="py-3 px-4">
                            {shouldShowInitial ? (
                              <div
                                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
                                style={{ backgroundColor }}
                              >
                                {initial}
                              </div>
                            ) : (
                              <img
                                src={user.profileImage}
                                alt={`${user.name || "User"} ${
                                  user.lastName || ""
                                }`}
                                className="w-16 h-16 rounded-full object-cover mx-auto"
                                onError={() =>
                                  handleImageError(
                                    user._id || `${user.email}-${index}`
                                  )
                                }
                                loading="lazy"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4">{user.name || "-"}</td>
                          <td className="py-3 px-4">{user.lastName || "-"}</td>
                          <td className="py-3 px-4">{user.email || "-"}</td>
                          <td className="py-3 px-4">{user.phone || "-"}</td>
                          <td className="py-3 px-4">{user.role || "-"}</td>
                          <td className="py-3 px-4">
                            {formatAddress(user.address)}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={user.status || "active"}
                              onChange={(e) =>
                                handleStatusChange(user._id, e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 border rounded-md"
                            >
                              <option value="active">
                                {t("users.active")}
                              </option>
                              <option value="inactive">
                                {t("users.inactive")}
                              </option>
                              <option value="suspended">
                                {t("users.suspended")}
                              </option>
                              <option value="deleted">
                                {t("users.deleted")}
                              </option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(user._id);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              {t("users.delete")}
                            </button>
                          </td>
                        </tr>
                        {selectedRow === user._id && (
                          <tr>
                            <td colSpan={9} className="py-2 px-4 bg-gray-50">
                              <div className="flex flex-col gap-2">
                                <div>
                                  <strong>{t("users.projects")}:</strong>{" "}
                                  {user.projects && user.projects.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                      {user.projects.map((proj, idx) => (
                                        <li key={idx}>
                                          {proj.projectId?.name || "-"}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    t("users.no_projects")
                                  )}
                                </div>
                                <div>
                                  <strong>
                                    {t("users.performance_reviews")}:
                                  </strong>{" "}
                                  {user.performanceReviews &&
                                  user.performanceReviews.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                      {user.performanceReviews.map(
                                        (review, idx) => (
                                          <li key={idx}>
                                            {review.score || "Review"} -{" "}
                                            {review.date
                                              ? new Date(
                                                  review.date
                                                ).toLocaleDateString()
                                              : "-"}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    t("users.no_reviews")
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
