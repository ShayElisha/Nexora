
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", userId: "" });
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const usersPerPage = 12;
  const location = useLocation();
  const navigate = useNavigate();

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

  const {
    data: departments = [],
    isLoading: isLoadingDepts,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data?.data || [];
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (employeeId) => axiosInstance.delete(`/employees/${employeeId}`),
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

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ employeeId, data }) =>
      axiosInstance.put(`/employees/${employeeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      toast.success(t("users.updated"));
      closeEditModal();
      navigate("/dashboard/employees");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("users.error_updating"));
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
      user.identity || "",
      `${user.address?.city || ""} ${user.address?.street || ""} ${
        user.address?.country || ""
      } ${user.address?.postalCode || ""}`,
      user.bankDetails?.accountNumber || "",
      user.bankDetails?.bankNumber || "",
      user.bankDetails?.branchCode || "",
      user.projects
        ?.map((proj) => proj.projectId?.name || "")
        .filter(Boolean)
        .join(" ") || "",
      user.performanceReviews?.length > 0
        ? `${user.performanceReviews.length} ${t("users.reviews")}`
        : t("users.no_reviews"),
      user.paymentType || "",
      user.hourlySalary ? `${user.hourlySalary} ${t("users.hourly")}` : "",
      user.globalSalary ? `${user.globalSalary} ${t("users.global")}` : "",
      user.vacationBalance
        ? `${user.vacationBalance} ${t("users.vacation_days")}`
        : "",
      user.sickBalance ? `${user.sickBalance} ${t("users.sick_days")}` : "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableString.includes(searchLower);
  });

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

  const openModal = (type, userId) => {
    setModalContent({ type, userId });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent({ type: "", userId: "" });
  };

  const openEditModal = (user) => {
    setEditUser({
      _id: user._id,
      name: user.name || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      department: user.department?._id || "",
      paymentType: user.paymentType || "",
      hourlySalary: user.hourlySalary || "",
      globalSalary: user.globalSalary || "",
      expectedHours: user.expectedHours || "",
      address: {
        street: user.address?.street || "",
        city: user.address?.city || "",
        country: user.address?.country || "",
        postalCode: user.address?.postalCode || "",
      },
      bankDetails: {
        accountNumber: user.bankDetails?.accountNumber || "",
        bankNumber: user.bankDetails?.bankNumber || "",
        branchCode: user.bankDetails?.branchCode || "",
      },
    });
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditUser(null);
    navigate("/dashboard/employees");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setEditUser((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else if (name.includes("bankDetails.")) {
      const field = name.split(".")[1];
      setEditUser((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [field]: value },
      }));
    } else {
      setEditUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateEmployeeMutation.mutate({
      employeeId: editUser._id,
      data: {
        name: editUser.name,
        lastName: editUser.lastName,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
        department: editUser.department || undefined,
        paymentType: editUser.paymentType,
        hourlySalary:
          editUser.paymentType === "Hourly" ? editUser.hourlySalary : undefined,
        globalSalary:
          editUser.paymentType === "Global" ? editUser.globalSalary : undefined,
        expectedHours:
          editUser.paymentType === "Global" ? editUser.expectedHours : undefined,
        address: editUser.address,
        bankDetails: editUser.bankDetails,
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeEditModal();
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editEmployeeId = params.get("editEmployee");
    if (
      editEmployeeId &&
      editEmployeeId !== "null" &&
      users.length > 0 &&
      !editModal
    ) {
      const user = users.find((u) => u._id === editEmployeeId);
      if (user) {
        openEditModal(user);
      } else {
        toast.error(t("users.employee_not_found"));
        navigate("/dashboard/employees");
      }
    } else if (editEmployeeId === "null") {
      toast.error(t("users.invalid_employee_id"));
      navigate("/dashboard/employees");
    }
  }, [users, location.search, editModal]);

  useEffect(() => {
    if (showModal || editModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, editModal]);

  const formatAddress = (address) =>
    address
      ? `${address.street || ""}, ${address.city || ""}, ${
          address.country || ""
        } ${address.postalCode || ""}`.trim() || "-"
      : "-";

  const formatBankDetails = (bankDetails) =>
    bankDetails
      ? `חשבון: ${bankDetails.accountNumber || "-"}, בנק: ${
          bankDetails.bankNumber || "-"
        }, סניף: ${bankDetails.branchCode || "-"}`
      : "-";

  return (
    <div className="max-h-full flex justify-center items-start py-8 animate-fade-in">
      <div className="w-full max-w-full pb-[40vh] rounded-xl shadow-lg border border-border-color bg-bg">
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
                      {t("users.identity")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.role")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.payment_type")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.salary")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.vacation_balance")}
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                      {t("users.sick_balance")}
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
                        colSpan={11}
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
                      const userId = user._id || `${user.email}-${index}`;

                      return (
                        <>
                          <tr
                            key={userId}
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
                                  onError={() => handleImageError(userId)}
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
                              {user.identity || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.role || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.paymentType || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.paymentType === "Hourly" &&
                              user.hourlySalary
                                ? `${user.hourlySalary} ${t("users.hourly")}`
                                : user.paymentType === "Global" &&
                                  user.globalSalary
                                ? `${user.globalSalary} ${t("users.global")}`
                                : "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.vacationBalance ?? "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {user.sickBalance ?? "-"}
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
                                <option value="active">{t("users.active")}</option>
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
                            <td className="py-3 px-4 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(user);
                                }}
                                className="px-4 py-2 bg-primary text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              >
                                {t("users.edit")}
                              </button>
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
                              <td colSpan={11} className="py-6 px-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {/* Personal Details Section */}
                                  <div className="bg-secondary p-4 rounded-lg shadow-sm">
                                    <h3 className="text-base font-semibold text-text mb-3">
                                      {t("users.personal_details")}
                                    </h3>
                                    <ul className="space-y-2 text-sm text-text">
                                      <li className="flex items-center">
                                        <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                                        {t("users.address")}:{" "}
                                        {formatAddress(user.address)}
                                      </li>
                                      <li className="flex items-center">
                                        <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                                        {t("users.email")}: {user.email || "-"}
                                      </li>
                                      <li className="flex items-center">
                                        <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                                        {t("users.phone")}: {user.phone || "-"}
                                      </li>
                                    </ul>
                                  </div>

                                  {/* Projects Section */}
                                  <div className="bg-secondary p-4 rounded-lg shadow-sm">
                                    <h3 className="text-base font-semibold text-text mb-3">
                                      {t("users.projects")}
                                    </h3>
                                    {user.projects && user.projects.length > 0 ? (
                                      <ul className="space-y-2 text-sm text-text">
                                        {user.projects.map((proj, idx) => (
                                          <li
                                            key={idx}
                                            className="flex items-center"
                                          >
                                            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                                            {proj.projectId?.name || "-"} (
                                            {proj.role || "-"})
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-text opacity-70 italic">
                                        {t("users.no_projects")}
                                      </p>
                                    )}
                                  </div>

                                  {/* Performance Reviews Section */}
                                  <div className="bg-secondary p-4 rounded-lg shadow-sm">
                                    <h3 className="text-base font-semibold text-text mb-3">
                                      {t("users.performance_reviews")}
                                    </h3>
                                    {user.performanceReviews &&
                                    user.performanceReviews.length > 0 ? (
                                      <ul className="space-y-2 text-sm text-text">
                                        {user.performanceReviews.map(
                                          (review, idx) => (
                                            <li
                                              key={idx}
                                              className="flex items-center"
                                            >
                                              <span className="inline-block w-2 h-2 bg-button-bg rounded-full mr-2"></span>
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
                                      <p className="text-sm text-text opacity-70 italic">
                                        {t("users.no_reviews")}
                                      </p>
                                    )}
                                  </div>

                                  {/* Payment Details Section */}
                                  <div className="bg-secondary p-4 rounded-lg shadow-sm">
                                    <h3 className="text-base font-semibold text-text mb-3">
                                      {t("users.payment_details")}
                                    </h3>
                                    <ul className="space-y-2 text-sm text-text">
                                      <li className="flex items-center">
                                        <span className="inline-block w-2 h-2 bg-secondary rounded-full mr-2"></span>
                                        {t("users.payment_type")}:{" "}
                                        {user.paymentType || "-"}
                                      </li>
                                      {user.paymentType === "Hourly" && (
                                        <li className="flex items-center">
                                          <span className="inline-block w-2 h-2 bg-secondary rounded-full mr-2"></span>
                                          {t("users.hourly_salary")}:{" "}
                                          {user.hourlySalary ?? "-"}
                                        </li>
                                      )}
                                      {user.paymentType === "Global" && (
                                        <>
                                          <li className="flex items-center">
                                            <span className="inline-block w-2 h-2 bg-secondary rounded-full mr-2"></span>
                                            {t("users.global_salary")}:{" "}
                                            {user.globalSalary ?? "-"}
                                          </li>
                                          <li className="flex items-center">
                                            <span className="inline-block w-2 h-2 bg-secondary rounded-full mr-2"></span>
                                            {t("users.expected_hours")}:{" "}
                                            {user.expectedHours ?? "-"}
                                          </li>
                                        </>
                                      )}
                                      <li className="flex items-center">
                                        <span className="inline-block w-2 h-2 bg-secondary rounded-full mr-2"></span>
                                        {t("users.bank_details")}:{" "}
                                        {formatBankDetails(user.bankDetails)}
                                      </li>
                                    </ul>
                                  </div>

                                  {/* Vacation Details Section */}
                                  <div className="bg-secondary p-4 rounded-lg shadow-sm">
                                    <h3 className="text-base font-semibold text-text mb-3">
                                      {t("users.vacation_details")}
                                    </h3>
                                    <ul className="space-y-2 text-sm text-text">
                                      <li className="flex items-center">
                                        <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                                        {t("users.vacation_balance")}:{" "}
                                        {user.vacationBalance ?? "-"}
                                      </li>
                                      <li>
                                        <button
                                          onClick={() =>
                                            openModal("vacation", userId)
                                          }
                                          className="mt-2 px-4 py-1.5 bg-button-bg text-button-text text-sm rounded-full shadow hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                          {t("users.show_vacation_history")}
                                        </button>
                                      </li>
                                    </ul>
                                  </div>

                                  {/* Sick Details Section */}
                                  <div className="bg-secondary p-4 rounded-lg shadow-sm">
                                    <h3 className="text-base font-semibold text-text mb-3">
                                      {t("users.sick_details")}
                                    </h3>
                                    <ul className="space-y-2 text-sm text-text">
                                      <li className="flex items-center">
                                        <span className="inline-block w-2 h-2 bg-button-bg rounded-full mr-2"></span>
                                        {t("users.sick_balance")}:{" "}
                                        {user.sickBalance ?? "-"}
                                      </li>
                                      <li>
                                        <button
                                          onClick={() => openModal("sick", userId)}
                                          className="mt-2 px-4 py-1.5 bg-button-bg text-button-text text-sm rounded-full shadow hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                          {t("users.show_sick_history")}
                                        </button>
                                      </li>
                                    </ul>
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

        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="bg-bg rounded-xl p-6 w-11/12 sm:w-1/2 max-h-[80vh] overflow-y-auto shadow-lg border border-border-color"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="modal-title"
                className="text-xl font-semibold mb-4 text-text"
              >
                {modalContent.type === "vacation"
                  ? t("users.vacation_history")
                  : t("users.sick_history")}
              </h2>
              <ul className="p-3 border border-border-color rounded-lg bg-secondary">
                {(() => {
                  const user = users.find(
                    (u) =>
                      (u._id || `${u.email}-${users.indexOf(u)}`) ===
                      modalContent.userId
                  );
                  const history =
                    modalContent.type === "vacation"
                      ? user?.vacationHistory
                      : user?.sickHistory;
                  return history && history.length > 0 ? (
                    history.map((entry, idx) => (
                      <li
                        key={idx}
                        className="py-2 px-3 hover:bg-accent transition-all duration-200 border-b border-border-color last:border-b-0"
                      >
                        {entry.month}: {entry.daysAdded} {t("users.days_added")}{" "}
                        ({t("users.new_balance")}: {entry.newBalance})
                      </li>
                    ))
                  ) : (
                    <li className="text-sm opacity-70 py-2 px-3">
                      {modalContent.type === "vacation"
                        ? t("users.no_vacation_history")
                        : t("users.no_sick_history")}
                    </li>
                  );
                })()}
              </ul>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-primary text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {t("users.close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {editModal && editUser && (
          <div
            className="fixed inset-0 max-h-[100%] bg-black bg-opacity-70 flex justify-center items-center z-50"
            onClick={closeEditModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
          >
            <div
              className="bg-bg rounded-xl p-6 w-11/12 sm:w-3/4 max-h-[100vh] overflow-y-auto shadow-lg border border-border-color"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="edit-modal-title"
                className="text-xl font-semibold mb-4 text-text"
              >
                {t("users.edit_user")}
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.name")}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editUser.name}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.last_name")}
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={editUser.lastName}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.email")}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editUser.email}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.phone")}
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editUser.phone}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.role")}
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={editUser.role}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.department")}
                    </label>
                    <select
                      name="department"
                      value={editUser.department}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t("users.select_department")}</option>
                      {isLoadingDepts ? (
                        <option disabled>{t("loading")}</option>
                      ) : (
                        departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.payment_type")}
                    </label>
                    <select
                      name="paymentType"
                      value={editUser.paymentType}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t("users.select_payment_type")}</option>
                      <option value="Hourly">{t("users.hourly")}</option>
                      <option value="Global">{t("users.global")}</option>
                    </select>
                  </div>
                  {editUser.paymentType === "Hourly" && (
                    <div>
                      <label className="block text-sm font-medium text-text">
                        {t("users.hourly_salary")}
                      </label>
                      <input
                        type="number"
                        name="hourlySalary"
                        value={editUser.hourlySalary}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                  {editUser.paymentType === "Global" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text">
                          {t("users.global_salary")}
                        </label>
                        <input
                          type="number"
                          name="globalSalary"
                          value={editUser.globalSalary}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text">
                          {t("users.expected_hours")}
                        </label>
                        <input
                          type="number"
                          name="expectedHours"
                          value={editUser.expectedHours}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.address.street")}
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={editUser.address.street}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.address.city")}
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={editUser.address.city}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.address.country")}
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={editUser.address.country}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.address.postalCode")}
                    </label>
                    <input
                      type="text"
                      name="address.postalCode"
                      value={editUser.address.postalCode}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.bank_details.account_number")}
                    </label>
                    <input
                      type="text"
                      name="bankDetails.accountNumber"
                      value={editUser.bankDetails.accountNumber}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.bank_details.bank_number")}
                    </label>
                    <input
                      type="text"
                      name="bankDetails.bankNumber"
                      value={editUser.bankDetails.bankNumber}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("users.bank_details.branch_code")}
                    </label>
                    <input
                      type="text"
                      name="bankDetails.branchCode"
                      value={editUser.bankDetails.branchCode}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-gray-500 text-button-text rounded-full shadow-md hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {t("users.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {t("users.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;