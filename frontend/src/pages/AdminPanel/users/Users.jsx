import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllRoles, assignRoleToEmployee } from "../../../api/rolesApi";
import {
  Users as UsersIcon,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  User,
  X,
  Loader2,
  Check,
  AlertCircle,
  CreditCard,
  Building2,
  UserCheck,
  UserX,
  UserMinus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Deterministic color generator from a string (stable per user)
const colorFromString = (input) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash;
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
};

const EmployeeCard = ({ user, onEdit, onDelete, onStatusChange }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  
  const initial = (user.name || user.lastName || "U")[0].toUpperCase();
  const backgroundColor = colorFromString(user._id || user.email || user.name || "u");

  return (
    <motion.div
      className="rounded-2xl shadow-lg border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, translateY: -5 }}
      transition={{ duration: 0.2 }}
    >
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={`${user.name} ${user.lastName}`}
              className="w-16 h-16 rounded-full object-cover border-4"
              style={{ borderColor: 'var(--color-primary)' }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4"
              style={{ backgroundColor, borderColor: 'var(--color-primary)' }}
            >
              {initial}
        </div>
          )}

          {/* Name and Role */}
          <div className="flex-1">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
              {user.name} {user.lastName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Briefcase size={14} style={{ color: 'var(--color-secondary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {user.role || t("users.no_role")}
              </span>
        </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-4 py-2 rounded-full text-xs font-bold ${
              user.status === "active"
                ? "bg-green-100 text-green-700"
                : user.status === "inactive"
                ? "bg-gray-100 text-gray-700"
                : user.status === "suspended"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {user.status === "active" && <UserCheck className="inline mr-1" size={14} />}
            {user.status === "inactive" && <UserX className="inline mr-1" size={14} />}
            {user.status === "suspended" && <UserMinus className="inline mr-1" size={14} />}
            {t(`users.${user.status}`)}
          </span>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--text-color)' }}>{user.email || "-"}</span>
        </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--text-color)' }}>{user.phone || "-"}</span>
        </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--text-color)' }}>
              {user.address?.city || "-"}
            </span>
        </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--text-color)' }}>
              {user.paymentType === "Hourly" && user.hourlySalary
                ? `${user.hourlySalary} ${t("users.hourly")}`
                : user.paymentType === "Global" && user.globalSalary
                ? `${user.globalSalary} ${t("users.global")}`
                : t("users.not_set")}
            </span>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {expanded ? t("users.hide_details") : t("users.show_details")}
          </button>
          <button
            onClick={() => onEdit(user)}
            className="px-4 py-2 rounded-xl font-medium shadow-md transition-all hover:scale-105 flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
          >
            <Edit size={18} />
            {t("users.edit")}
          </button>
          <button
            onClick={() => onDelete(user._id)}
            className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium shadow-md transition-all hover:scale-105 hover:bg-red-600 flex items-center gap-2"
          >
            <Trash2 size={18} />
          </button>
        </div>
        </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="px-6 pb-6 pt-2 border-t"
            style={{ borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Personal Details */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <User size={18} style={{ color: 'var(--color-primary)' }} />
                  {t("users.personal_details")}
                </h4>
                <div className="space-y-2 text-sm">
                  <p style={{ color: 'var(--text-color)' }}>
                    <strong>{t("users.identity")}:</strong> {user.identity || "-"}
                  </p>
                  <p style={{ color: 'var(--text-color)' }}>
                    <strong>{t("users.address")}:</strong>{" "}
                    {user.address
                      ? `${user.address.street || ""}, ${user.address.city || ""}, ${user.address.country || ""}`
                      : "-"}
                  </p>
                  <p style={{ color: 'var(--text-color)' }}>
                    <strong>{t("users.postal_code")}:</strong> {user.address?.postalCode || "-"}
                  </p>
        </div>
        </div>

              {/* Payment Details */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <CreditCard size={18} style={{ color: 'var(--color-primary)' }} />
                  {t("users.payment_details")}
                </h4>
                <div className="space-y-2 text-sm">
                  <p style={{ color: 'var(--text-color)' }}>
                    <strong>{t("users.payment_type")}:</strong> {user.paymentType || "-"}
                  </p>
                  {user.paymentType === "Hourly" && (
                    <p style={{ color: 'var(--text-color)' }}>
                      <strong>{t("users.hourly_salary")}:</strong> {user.hourlySalary || "-"}
                    </p>
                  )}
                  {user.paymentType === "Global" && (
                    <>
                      <p style={{ color: 'var(--text-color)' }}>
                        <strong>{t("users.global_salary")}:</strong> {user.globalSalary || "-"}
                      </p>
                      <p style={{ color: 'var(--text-color)' }}>
                        <strong>{t("users.expected_hours")}:</strong> {user.expectedHours || "-"}
                      </p>
                    </>
                  )}
        </div>
        </div>

              {/* Vacation & Sick */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                  {t("users.vacation_sick")}
                </h4>
                <div className="space-y-2 text-sm">
                  <p style={{ color: 'var(--text-color)' }}>
                    <strong>{t("users.vacation_balance")}:</strong> {user.vacationBalance ?? "-"}
                  </p>
                  <p style={{ color: 'var(--text-color)' }}>
                    <strong>{t("users.sick_balance")}:</strong> {user.sickBalance ?? "-"}
                  </p>
        </div>
        </div>

              {/* Projects */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
                  {t("users.projects")}
                </h4>
                {user.projects && user.projects.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {user.projects.map((proj, idx) => (
                      <li key={idx} style={{ color: 'var(--text-color)' }}>
                        • {proj.projectId?.name || "-"} ({proj.role || "-"})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("users.no_projects")}
                  </p>
                )}
        </div>
        </div>

            {/* Status Change */}
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("users.change_status")}:
          </label>
          <select
                value={user.status || "active"}
                onChange={(e) => onStatusChange(user._id, e.target.value)}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              >
                <option value="active">{t("users.active")}</option>
                <option value="inactive">{t("users.inactive")}</option>
                <option value="suspended">{t("users.suspended")}</option>
                <option value="deleted">{t("users.deleted")}</option>
          </select>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Users = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const usersPerPage = 9;
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

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data?.data || [];
    },
  });

  // Fetch all roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      try {
        return await fetchAllRoles(true); // Include defaults
      } catch (error) {
        console.error("Error loading roles:", error);
        return [];
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
    mutationFn: ({ employeeId, data }) =>
      axiosInstance.put(`/employees/${employeeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t("users.updated"));
      setEditModal(false);
      setEditUser(null);
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

  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter((user) => {
      const searchableString = [
        user.name || "",
        user.lastName || "",
        user.email || "",
        user.phone || "",
        user.role || "",
        user.identity || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchableString.includes(searchLower);
    });
    }

    if (statusFilter !== "all") {
      result = result.filter((user) => user.status === statusFilter);
    }

    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    return result;
  }, [users, searchTerm, statusFilter, roleFilter]);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = useMemo(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  }, [filteredUsers, currentPage, usersPerPage]);

  const handleDelete = (employeeId) => {
    if (window.confirm(t("users.confirm_delete"))) {
      deleteEmployeeMutation.mutate(employeeId);
    }
  };

  const handleStatusChange = (employeeId, status) => {
    updateEmployeeStatusMutation.mutate({ employeeId, status });
  };

  const openEditModal = (user) => {
    setEditUser({
      _id: user._id,
      name: user.name || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      roleId: user.roleId?._id || user.roleId || "",
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

  // Mutation for assigning role to employee
  const assignRoleMutation = useMutation({
    mutationFn: ({ employeeId, roleId }) => assignRoleToEmployee(employeeId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("users.role_assigned_successfully") || "תפקיד הוקצה בהצלחה");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("users.error_assigning_role") || "שגיאה בהקצאת תפקיד");
    },
  });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // If roleId is changed, assign it first
    if (editUser.roleId !== undefined) {
      assignRoleMutation.mutate({ 
        employeeId: editUser._id, 
        roleId: editUser.roleId || null
      });
    }
    
    // Prepare employee update data (without roleId, as it's handled separately)
    const updateData = {
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
        editUser.paymentType === "Global"
          ? editUser.expectedHours
          : undefined,
      address: editUser.address,
      bankDetails: editUser.bankDetails,
    };
    
    // Update employee (onSuccess and onError are handled by the mutation)
    updateEmployeeMutation.mutate({
      employeeId: editUser._id,
      data: updateData,
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("users.loading")}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
  return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <div className="text-red-500 font-medium text-lg">
            {error?.message || t("users.failed_to_load_users")}
        </div>
          </div>
          </div>
    );
  }

                      return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <UsersIcon size={28} color="white" />
                                </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("users.users_list")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("users.manage_employees")}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <UsersIcon size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("users.total_employees")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <UserCheck size={24} className="text-green-600" />
                                  </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("users.active")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.active}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
                  <UserX size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("users.inactive")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.inactive}
                  </p>
                                  </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <UserMinus size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("users.suspended")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.suspended}
                  </p>
                </div>
              </div>
            </motion.div>
                                  </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-secondary)' }}
              />
              <input
                type="text"
                placeholder={t("users.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              />
                                  </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="all">{t("users.all_statuses")}</option>
              <option value="active">{t("users.active")}</option>
              <option value="inactive">{t("users.inactive")}</option>
              <option value="suspended">{t("users.suspended")}</option>
              <option value="deleted">{t("users.deleted")}</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="all">{t("users.all_roles")}</option>
              <option value="Admin">{t("users.admin")}</option>
              <option value="Manager">{t("users.manager")}</option>
              <option value="Employee">{t("users.employee")}</option>
            </select>
                                  </div>
        </motion.div>

        {/* Employee Cards Grid */}
        {filteredUsers.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl" style={{ color: 'var(--color-secondary)' }}>
              {searchTerm ? t("users.no_users_match") : t("users.no_users")}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentUsers.map((user, index) => (
                <EmployeeCard
                  key={user._id || `${user.email}-${index}`}
                  user={user}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
                                  </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentPage === 1 ? 'var(--border-color)' : 'var(--color-primary)',
                    color: currentPage === 1 ? 'var(--text-color)' : 'var(--button-text)',
                  }}
                >
                  ←
                </button>
                <span style={{ color: 'var(--text-color)' }}>
                  {t("users.page")} {currentPage} {t("users.of")} {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor:
                      currentPage === totalPages ? 'var(--border-color)' : 'var(--color-primary)',
                    color:
                      currentPage === totalPages ? 'var(--text-color)' : 'var(--button-text)',
                  }}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}

        {/* Edit Modal */}
        {editModal && editUser && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={closeEditModal}
          >
            <motion.div
              className="rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("users.edit_user")}
              </h2>
                <button
                  onClick={closeEditModal}
                  className="p-2 rounded-full hover:scale-110 transition-all"
                  style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.name")}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editUser.name}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.last_name")}
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={editUser.lastName}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.email")}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editUser.email}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.phone")}
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editUser.phone}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.role")} (מערכת ישנה)
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={editUser.role}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                      placeholder="Admin, Manager, Employee"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.role_assignment") || "הקצאת תפקיד (מערכת חדשה)"}
                    </label>
                    <select
                      name="roleId"
                      value={editUser.roleId || ""}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                    >
                      <option value="">{t("users.no_role_assigned") || "ללא הקצאה"}</option>
                      {isLoadingRoles ? (
                        <option disabled>{t("loading") || "טוען..."}</option>
                      ) : (
                        roles.map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.name}
                            {role.isDefault && ` (${t("roles.default") || "ברירת מחדל"})`}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--text-color)' }}>
                      {t("users.role_assignment_hint") || "בחר תפקיד מהמערכת החדשה לניהול הרשאות"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.department")}
                    </label>
                    <select
                      name="department"
                      value={editUser.department}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
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
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("users.payment_type")}
                    </label>
                    <select
                      name="paymentType"
                      value={editUser.paymentType}
                      onChange={handleEditChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                      }}
                    >
                      <option value="">{t("users.select_payment_type")}</option>
                      <option value="Hourly">{t("users.hourly")}</option>
                      <option value="Global">{t("users.global")}</option>
                    </select>
                  </div>
                  {editUser.paymentType === "Hourly" && (
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                        {t("users.hourly_salary")}
                      </label>
                      <input
                        type="number"
                        name="hourlySalary"
                        value={editUser.hourlySalary}
                        onChange={handleEditChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: 'var(--border-color)',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                        }}
                      />
                    </div>
                  )}
                  {editUser.paymentType === "Global" && (
                    <>
                      <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                          {t("users.global_salary")}
                        </label>
                        <input
                          type="number"
                          name="globalSalary"
                          value={editUser.globalSalary}
                          onChange={handleEditChange}
                          className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                          style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                          {t("users.expected_hours")}
                        </label>
                        <input
                          type="number"
                          name="expectedHours"
                          value={editUser.expectedHours}
                          onChange={handleEditChange}
                          className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                          style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                          }}
                        />
                      </div>
                    </>
                  )}
                  </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  >
                    {t("users.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                  >
                    {t("users.save")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
