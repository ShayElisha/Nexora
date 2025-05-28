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

const EmployeeForm = ({ employee, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(
    employee || {
      name: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      identity: "",
      email: "",
      password: "",
      profileImage: "",
      role: "",
      phone: "",
      employeeId: "",
      department: "",
      benefits: [],
      status: "active",
      address: { city: "", street: "", country: "", postalCode: "" },
      paymentType: "Global",
      hourlySalary: null,
      globalSalary: null,
      expectedHours: null,
      vacationBalance: 0,
      sickBalance: 0,
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-bg rounded-xl shadow-lg border border-border-color"
    >
      <h2 className="text-2xl font-bold text-text mb-4">
        {t("users.edit_employee")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.name")}
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("users.name")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.last_name")}
          </label>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder={t("users.last_name")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.gender")}
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          >
            <option value="">{t("users.select_gender")}</option>
            <option value="Male">{t("users.male")}</option>
            <option value="Female">{t("users.female")}</option>
            <option value="Other">{t("users.other")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.date_of_birth")}
          </label>
          <input
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.identity")}
          </label>
          <input
            name="identity"
            value={formData.identity}
            onChange={handleChange}
            placeholder={t("users.identity")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.email")}
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t("users.email")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.password")}
          </label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t("users.password")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.profile_image")}
          </label>
          <input
            name="profileImage"
            value={formData.profileImage}
            onChange={handleChange}
            placeholder={t("users.profile_image_url")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.role")}
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          >
            <option value="">{t("users.select_role")}</option>
            <option value="Admin">{t("users.admin")}</option>
            <option value="Manager">{t("users.manager")}</option>
            <option value="Employee">{t("users.employee")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.phone")}
          </label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t("users.phone")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.employee_id")}
          </label>
          <input
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            placeholder={t("users.employee_id")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.department")}
          </label>
          <input
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder={t("users.department")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.benefits")}
          </label>
          <input
            name="benefits"
            value={formData.benefits.join(",")}
            onChange={(e) =>
              setFormData({ ...formData, benefits: e.target.value.split(",") })
            }
            placeholder={t("users.benefits_placeholder")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.status")}
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          >
            <option value="active">{t("users.active")}</option>
            <option value="inactive">{t("users.inactive")}</option>
            <option value="suspended">{t("users.suspended")}</option>
            <option value="deleted">{t("users.deleted")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.city")}
          </label>
          <input
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            placeholder={t("users.city")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.street")}
          </label>
          <input
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder={t("users.street")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.country")}
          </label>
          <input
            name="address.country"
            value={formData.address.country}
            onChange={handleChange}
            placeholder={t("users.country")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.postal_code")}
          </label>
          <input
            name="address.postalCode"
            value={formData.address.postalCode}
            onChange={handleChange}
            placeholder={t("users.postal_code")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.payment_type")}
          </label>
          <select
            name="paymentType"
            value={formData.paymentType}
            onChange={handleChange}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            required
          >
            <option value="Hourly">{t("users.hourly")}</option>
            <option value="Global">{t("users.global")}</option>
            <option value="Commission-Based">
              {t("users.commission_based")}
            </option>
          </select>
        </div>
        {formData.paymentType === "Hourly" && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t("users.hourly_salary")}
            </label>
            <input
              name="hourlySalary"
              type="number"
              value={formData.hourlySalary || ""}
              onChange={handleChange}
              placeholder={t("users.hourly_salary")}
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              required
            />
          </div>
        )}
        {formData.paymentType === "Global" && (
          <>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {t("users.global_salary")}
              </label>
              <input
                name="globalSalary"
                type="number"
                value={formData.globalSalary || ""}
                onChange={handleChange}
                placeholder={t("users.global_salary")}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {t("users.expected_hours")}
              </label>
              <input
                name="expectedHours"
                type="number"
                value={formData.expectedHours || ""}
                onChange={handleChange}
                placeholder={t("users.expected_hours")}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.vacation_balance")}
          </label>
          <input
            name="vacationBalance"
            type="number"
            value={formData.vacationBalance}
            onChange={handleChange}
            placeholder={t("users.vacation_balance")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t("users.sick_balance")}
          </label>
          <input
            name="sickBalance"
            type="number"
            value={formData.sickBalance}
            onChange={handleChange}
            placeholder={t("users.sick_balance")}
            className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-text rounded-full hover:bg-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          {t("users.cancel")}
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {t("users.save")}
        </button>
      </div>
    </form>
  );
};

const Users = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const usersPerPage = 12;

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

  const updateEmployeeMutation = useMutation({
    mutationFn: (employee) =>
      axiosInstance.put(`/employees/${employee._id}`, employee),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      toast.success(t("users.updated"));
      setEditingEmployee(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("users.error_updating"));
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
      user.paymentType || "",
      user.hourlySalary ? user.hourlySalary.toString() : "",
      user.globalSalary ? user.globalSalary.toString() : "",
      user.expectedHours ? user.expectedHours.toString() : "",
      user.vacationBalance ? user.vacationBalance.toString() : "",
      user.sickBalance ? user.sickBalance.toString() : "",
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
            className={`px-4 py-2 rounded-full mx-1 text-sm font-medium transition-all duration-200 ${
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
            className={`px-4 py-2 rounded-full mx-1 text-sm font-medium transition-all duration-200 ${
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
            <span key="start-dots" className="mx-2 text-text">
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
            className={`px-4 py-2 rounded-full mx-1 text-sm font-medium transition-all duration-200 ${
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
            <span key="end-dots" className="mx-2 text-text">
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => paginate(totalPages)}
            className={`px-4 py-2 rounded-full mx-1 text-sm font-medium transition-all duration-200 ${
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

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
  };

  const handleSave = (employee) => {
    updateEmployeeMutation.mutate(employee);
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
    <div className="max-h-screen flex justify-center items-start py-12 bg-bg animate-fade-in">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mp-8 rounded-xl shadow-xl border border-border-color bg-bg">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-text tracking-tight drop-shadow-md">
          {t("users.users_list")}
        </h1>

        <div className="mb-8">
          <input
            type="text"
            placeholder={t("users.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50 text-sm"
          />
        </div>

        {editingEmployee && (
          <EmployeeForm
            employee={editingEmployee}
            onSave={handleSave}
            onCancel={() => setEditingEmployee(null)}
          />
        )}

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
            <div className="overflow-x-auto rounded-xl shadow-md border border-border-color">
              <table className="min-w-full text-text">
                <thead>
                  <tr className="bg-button-bg text-button-text">
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.profile_image")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.name")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.last_name")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.email")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.phone")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.role")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.address")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.payment_type")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.status")}
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold tracking-wide">
                      {t("users.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-8 px-6 text-center text-text opacity-70 italic text-lg"
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
                            className="border-b border-border-color hover:bg-secondary cursor-pointer transition-all duration-200"
                            onClick={() => handleRowClick(user)}
                          >
                            <td className="py-4 px-6">
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
                            <td className="py-4 px-6 text-sm">
                              {user.name || "-"}
                            </td>
                            <td className="py-4 px-6 text-sm">
                              {user.lastName || "-"}
                            </td>
                            <td className="py-4 px-6 text-sm">
                              {user.email || "-"}
                            </td>
                            <td className="py-4 px-6 text-sm">
                              {user.phone || "-"}
                            </td>
                            <td className="py-4 px-6 text-sm">
                              {user.role || "-"}
                            </td>
                            <td className="py-4 px-6 text-sm">
                              {formatAddress(user.address)}
                            </td>
                            <td className="py-4 px-6 text-sm">
                              {user.paymentType || "-"}
                            </td>
                            <td className="py-4 px-6">
                              <select
                                value={user.status || "active"}
                                onChange={(e) =>
                                  handleStatusChange(user._id, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200 w-full text-sm"
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
                            <td className="py-4 px-6 flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(user);
                                }}
                                className="px-4 py-2 bg-blue-500 text-button-text rounded-full shadow-md hover:bg-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                              >
                                {t("users.edit")}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(user._id);
                                }}
                                className="px-4 py-2 bg-red-500 text-button-text rounded-full shadow-md hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                              >
                                {t("users.delete")}
                              </button>
                            </td>
                          </tr>
                          {selectedRow === user._id && (
                            <tr className="bg-bg border-b border-border-color">
                              <td colSpan={10} className="py-6 px-8">
                                <div className="flex flex-col gap-4">
                                  <div>
                                    <strong className="text-sm font-semibold text-text">
                                      {t("users.projects")}:
                                    </strong>{" "}
                                    {user.projects &&
                                    user.projects.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm text-text">
                                        {user.projects.map((proj, idx) => (
                                          <li key={idx}>
                                            {proj.projectId?.name || "-"}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-sm text-text opacity-70">
                                        {t("users.no_projects")}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <strong className="text-sm font-semibold text-text">
                                      {t("users.performance_reviews")}:
                                    </strong>{" "}
                                    {user.performanceReviews &&
                                    user.performanceReviews.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm text-text">
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
                                      <span className="text-sm text-text opacity-70">
                                        {t("users.no_reviews")}
                                      </span>
                                    )}
                                  </div>
                                  {user.paymentType === "Hourly" && (
                                    <div>
                                      <strong className="text-sm font-semibold text-text">
                                        {t("users.hourly_salary")}:
                                      </strong>{" "}
                                      <span className="text-sm text-text">
                                        {user.hourlySalary || "-"}
                                      </span>
                                    </div>
                                  )}
                                  {user.paymentType === "Global" && (
                                    <>
                                      <div>
                                        <strong className="text-sm font-semibold text-text">
                                          {t("users.global_salary")}:
                                        </strong>{" "}
                                        <span className="text-sm text-text">
                                          {user.globalSalary || "-"}
                                        </span>
                                      </div>
                                      <div>
                                        <strong className="text-sm font-semibold text-text">
                                          {t("users.expected_hours")}:
                                        </strong>{" "}
                                        <span className="text-sm text-text">
                                          {user.expectedHours || "-"}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <strong className="text-sm font-semibold text-text">
                                      {t("users.vacation_balance")}:
                                    </strong>{" "}
                                    <span className="text-sm text-text">
                                      {user.vacationBalance || 0}
                                    </span>
                                  </div>
                                  <div>
                                    <strong className="text-sm font-semibold text-text">
                                      {t("users.sick_balance")}:
                                    </strong>{" "}
                                    <span className="text-sm text-text">
                                      {user.sickBalance || 0}
                                    </span>
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
              <div className="flex justify-center items-center mt-10 space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentPage === 1
                      ? "bg-gray-300 cursor-not-allowed text-text"
                      : "bg-button-bg text-button-text hover:bg-secondary"
                  }`}
                >
                  ←
                </button>
                {renderPageNumbers()}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentPage === totalPages
                      ? "bg-gray-300 cursor-not-allowed text-text"
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
