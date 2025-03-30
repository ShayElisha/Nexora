import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

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
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const usersPerPage = 12; // 12 users per page

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
        if (err.response?.status === 404) return [];
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
      axiosInstance.put(`/employees/${employeeId}`, { status }),
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === i
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (startPage > 1) {
        pageNumbers.push(
          <button
            key={1}
            onClick={() => paginate(1)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === 1
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(
            <span key="start-dots" className="mx-1">
              ...
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === i
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-dots" className="mx-1">
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => paginate(totalPages)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === totalPages
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

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

  const formatAddress = (address) =>
    address
      ? `${address.street || ""}, ${address.city || ""}, ${
          address.country || ""
        } ${address.postalCode || ""}`.trim() || "-"
      : "-";

  return (
    <div className="min-h-screen  flex justify-center items-start py-8 animate-fade-in">
      <div className="w-11/12 sm:w-4/5 p-6 rounded-xl shadow-lg border border-border-color bg-bg">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center text-text tracking-tight drop-shadow-md">
          {t("users.users_list")}
        </h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder={t("users.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center h-64 text-red-500 font-medium text-lg">
            {error?.message || t("users.failed_to_load_users")}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-text rounded-xl shadow-md border border-border-color">
                <thead>
                  <tr className="bg-button-bg text-button-text">
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.profile_image")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.name")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.last_name")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.email")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.phone")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.role")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.address")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.status")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-6 px-4 text-center text-text opacity-70 italic text-lg"
                      >
                        {searchTerm
                          ? t("users.no_users_match")
                          : t("users.no_users")}
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user, index) => {
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
                            className="border-b border-border-color hover:bg-secondary cursor-pointer"
                            onClick={() => handleRowClick(user)}
                          >
                            <td className="py-3 px-4">
                              {shouldShowInitial ? (
                                <div
                                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold"
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
                                  className="w-12 h-12 rounded-full object-cover mx-auto"
                                  onError={() =>
                                    handleImageError(
                                      user._id || `${user.email}-${index}`
                                    )
                                  }
                                  loading="lazy"
                                />
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.name || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.lastName || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.email || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.phone || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.role || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {formatAddress(user.address)}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={user.status || "active"}
                                onChange={(e) =>
                                  handleStatusChange(user._id, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
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
                                className="px-4 py-2 bg-red-500 text-button-text rounded-full shadow-md hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                {t("users.delete")}
                              </button>
                            </td>
                          </tr>
                          {selectedRow === user._id && (
                            <tr className="bg-bg border-b border-border-color">
                              <td colSpan={9} className="py-4 px-6">
                                <div className="flex flex-col gap-3">
                                  <div>
                                    <strong className="text-sm font-semibold">
                                      {t("users.projects")}:
                                    </strong>{" "}
                                    {user.projects &&
                                    user.projects.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm">
                                        {user.projects.map((proj, idx) => (
                                          <li key={idx}>
                                            {proj.projectId?.name || "-"}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-sm opacity-70">
                                        {t("users.no_projects")}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <strong className="text-sm font-semibold">
                                      {t("users.performance_reviews")}:
                                    </strong>{" "}
                                    {user.performanceReviews &&
                                    user.performanceReviews.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm">
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
                                      <span className="text-sm opacity-70">
                                        {t("users.no_reviews")}
                                      </span>
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
            {filteredUsers.length > 0 && totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-full ${
                    currentPage === 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-button-bg text-button-text hover:bg-secondary"
                  }`}
                >
                  ←
                </button>
                {renderPageNumbers()}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-full ${
                    currentPage === totalPages
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-button-bg text-button-text hover:bg-secondary"
                  }`}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Users;
