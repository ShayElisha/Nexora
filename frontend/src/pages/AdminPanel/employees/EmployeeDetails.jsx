import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  Edit,
  UserCheck,
  UserX,
  CalendarDays,
  Banknote,
  FileText,
} from "lucide-react";

const EmployeeDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: employee, isLoading, isError } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/employees/${id}`);
      return res.data.data;
    },
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
          <p style={{ color: 'var(--text-color)' }}>{t("employees.loading") || "Loading employee details..."}</p>
        </motion.div>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("employees.error_loading") || "Error loading employee details"}
          </p>
          <button
            onClick={() => navigate("/dashboard/employees/directory")}
            className="mt-4 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t("employees.back_to_directory") || "Back to Directory"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/employees/directory")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              style={{ color: 'var(--text-color)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("employees.details.title") || "Employee Details"}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t("employees.details.description") || "View complete employee information"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/employees/${id}`, { state: { edit: true } })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Edit size={20} />
            {t("employees.edit") || "Edit"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl shadow-md border overflow-hidden"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="p-6">
                {/* Profile Image */}
                <div className="flex justify-center mb-6">
                  {employee.profileImage ? (
                    <img
                      src={employee.profileImage}
                      alt={`${employee.name} ${employee.lastName}`}
                      className="w-32 h-32 rounded-full object-cover border-4"
                      style={{ borderColor: 'var(--color-primary)' }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4"
                      style={{ borderColor: 'var(--color-primary)' }}>
                      <User size={64} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  )}
                </div>

                {/* Name and Status */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    {employee.name} {employee.lastName}
                  </h2>
                  {employee.employeeId && (
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      ID: {employee.employeeId}
                    </p>
                  )}
                  <div className="flex justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(employee.status)}`}>
                      {employee.status || "active"}
                    </span>
                    {employee.role && (
                      <span className={`px-3 py-1 rounded-full text-sm ${getRoleColor(employee.role)}`}>
                        {employee.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                  {employee.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>{employee.phone}</span>
                    </div>
                  )}
                  {employee.department && (
                    <div className="flex items-center gap-3">
                      <Building2 size={18} style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                        {employee.department?.name || "No Department"}
                      </span>
                    </div>
                  )}
                  {employee.role && (
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>{employee.role}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl shadow-md border overflow-hidden"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                  {t("employees.personal_info") || "Personal Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t("employees.name") || "First Name"}
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t("employees.last_name") || "Last Name"}
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t("employees.identity") || "Identity Number"}
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.identity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t("employees.gender") || "Gender"}
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.gender}</p>
                  </div>
                  {employee.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.date_of_birth") || "Date of Birth"}
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                        {new Date(employee.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Address Information */}
            {employee.address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl shadow-md border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                    {t("employees.address") || "Address"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.street") || "Street"}
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.address.street}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.city") || "City"}
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.address.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.country") || "Country"}
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.address.country}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.postal_code") || "Postal Code"}
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.address.postalCode}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Employment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl shadow-md border overflow-hidden"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                  {t("employees.employment_info") || "Employment Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t("employees.department") || "Department"}
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                      {employee.department?.name || "No Department"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t("employees.role") || "Role"}
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.role || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {t("employees.status") || "Status"}
                    </label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(employee.status)}`}>
                        {employee.status || "active"}
                      </span>
                    </p>
                  </div>
                  {employee.lastLogin && (
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.last_login") || "Last Login"}
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                        {new Date(employee.lastLogin).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Salary Information */}
            {employee.paymentType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl shadow-md border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                    {t("employees.salary_info") || "Salary Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.payment_type") || "Payment Type"}
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-color)' }}>{employee.paymentType}</p>
                    </div>
                    {employee.paymentType === "Hourly" && employee.hourlySalary && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {t("employees.hourly_salary") || "Hourly Salary"}
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                          {employee.hourlySalary.toLocaleString()} {t("employees.currency") || "ILS"}
                        </p>
                      </div>
                    )}
                    {employee.paymentType === "Global" && employee.globalSalary && (
                      <>
                        <div>
                          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {t("employees.global_salary") || "Global Salary"}
                          </label>
                          <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                            {employee.globalSalary.toLocaleString()} {t("employees.currency") || "ILS"}
                          </p>
                        </div>
                        {employee.expectedHours && (
                          <div>
                            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {t("employees.expected_hours") || "Expected Hours"}
                            </label>
                            <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                              {employee.expectedHours} {t("employees.hours") || "hours"}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Vacation & Sick Days */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl shadow-md border overflow-hidden"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                  {t("employees.leave_balance") || "Leave Balance"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays size={20} style={{ color: 'var(--color-primary)' }} />
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.vacation_balance") || "Vacation Balance"}
                      </label>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                      {employee.vacationBalance || 0} {t("employees.days") || "days"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {t("employees.sick_balance") || "Sick Balance"}
                      </label>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                      {employee.sickBalance || 0} {t("employees.days") || "days"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bank Details */}
            {employee.bankDetails && (employee.bankDetails.accountNumber || employee.bankDetails.bankNumber) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl shadow-md border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                    {t("employees.bank_details") || "Bank Details"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.bankDetails.accountNumber && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {t("employees.account_number") || "Account Number"}
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                          {employee.bankDetails.accountNumber}
                        </p>
                      </div>
                    )}
                    {employee.bankDetails.bankNumber && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {t("employees.bank_number") || "Bank Number"}
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                          {employee.bankDetails.bankNumber}
                        </p>
                      </div>
                    )}
                    {employee.bankDetails.branchCode && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {t("employees.branch_code") || "Branch Code"}
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-color)' }}>
                          {employee.bankDetails.branchCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeDetails;

