import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import {
  Search,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  Users,
  Eye,
  Edit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmployeeDirectory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"

  const { data: employees = [], isLoading, isError } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data || [];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data.data || [];
    },
  });

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      `${employee.name} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.identity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filterDepartment === "all" ||
      (employee.department?._id || employee.department)?.toString() === filterDepartment;

    const matchesRole = filterRole === "all" || employee.role === filterRole;

    const matchesStatus = filterStatus === "all" || employee.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-yellow-100 text-yellow-800",
      deleted: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getRoleColor = (role) => {
    const colors = {
      Admin: "bg-purple-100 text-purple-800",
      Manager: "bg-blue-100 text-blue-800",
      Employee: "bg-green-100 text-green-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("employees.loading") || "Loading employees..."}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("employees.error_loading") || "Error loading employees"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("employees.directory.title") || "Employee Directory"}
        </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("employees.directory.description") || "Browse and manage all employees in your organization"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
            >
              {viewMode === "cards" ? "Table View" : "Card View"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl shadow-md border overflow-hidden mb-6" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder={t("employees.directory.search_placeholder") || "Search by name, email, ID..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>

              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="all">{t("employees.directory.all_departments") || "All Departments"}</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="all">{t("employees.directory.all_roles") || "All Roles"}</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="all">{t("employees.directory.all_statuses") || "All Statuses"}</option>
                <option value="active">{t("employees.active") || "Active"}</option>
                <option value="inactive">{t("employees.inactive") || "Inactive"}</option>
                <option value="suspended">{t("employees.suspended") || "Suspended"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          {filteredEmployees.length === 1 
            ? t("employees.directory.results_count", { count: 1 }) || "Showing 1 employee"
            : t("employees.directory.results_count_plural", { count: filteredEmployees.length }) || 
              `Showing ${filteredEmployees.length} employees`}
        </div>

        {/* Employee List */}
        {filteredEmployees.length === 0 ? (
          <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <div className="p-12 text-center">
              <Users size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                {t("employees.directory.no_employees") || "No employees found"}
              </p>
            </div>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <motion.div
                key={employee._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl shadow-md border overflow-hidden hover:shadow-lg transition"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              >
                <div className="p-6">
                  {/* Employee Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {employee.profileImage ? (
                          <img
                            src={employee.profileImage}
                            alt={`${employee.name} ${employee.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={32} style={{ color: 'var(--text-secondary)' }} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                          {employee.name} {employee.lastName}
                        </h3>
                        {employee.employeeId && (
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            ID: {employee.employeeId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee.status)}`}>
                        {employee.status || "active"}
                      </span>
                      {employee.role && (
                        <span className={`px-2 py-1 rounded text-xs ${getRoleColor(employee.role)}`}>
                          {employee.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="space-y-2 mb-4">
                    {employee.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>{employee.phone}</span>
                      </div>
                    )}
                    {employee.department && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>
                          {employee.department?.name || "No Department"}
                        </span>
                      </div>
                    )}
                    {employee.role && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>{employee.role}</span>
                      </div>
                    )}
                    {employee.address?.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>
                          {employee.address.city}, {employee.address.country}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      onClick={() => navigate(`/dashboard/employees/${employee._id}/details`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                    >
                      <Eye size={16} />
                      {t("employees.view") || "View"}
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/employees/${employee._id}`, { state: { edit: true } })}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Edit size={16} />
                      {t("employees.edit") || "Edit"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("employees.name") || "Name"}
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("employees.email") || "Email"}
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("employees.phone") || "Phone"}
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("employees.department") || "Department"}
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("employees.role") || "Role"}
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("employees.status") || "Status"}
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("employees.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <motion.tr
                      key={employee._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            {employee.profileImage ? (
                              <img
                                src={employee.profileImage}
                                alt={`${employee.name} ${employee.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={20} style={{ color: 'var(--text-secondary)' }} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                              {employee.name} {employee.lastName}
                            </p>
                            {employee.employeeId && (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                ID: {employee.employeeId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-color)' }}>
                        {employee.email || "-"}
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-color)' }}>
                        {employee.phone || "-"}
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-color)' }}>
                        {employee.department?.name || "-"}
                      </td>
                      <td className="p-4">
                        {employee.role && (
                          <span className={`px-2 py-1 rounded text-xs ${getRoleColor(employee.role)}`}>
                            {employee.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee.status)}`}>
                          {employee.status || "active"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/employees/${employee._id}/details`)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                            title={t("employees.view") || "View"}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/employees/${employee._id}`, { state: { edit: true } })}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                            title={t("employees.edit") || "Edit"}
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EmployeeDirectory;
