import { useState, useEffect } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  User,
  Edit,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  X,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Deterministic color generator
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

const EditDepartmentModal = ({ department, isOpen, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentManager: "",
    teamMembers: [],
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (department && isOpen) {
      setFormData({
        name: department.name || "",
        description: department.description || "",
        departmentManager:
          department.departmentManager?._id ||
          department.departmentManager ||
          "",
        teamMembers:
          department.teamMembers?.map(
            (m) => m.employeeId?._id || m.employeeId
          ) || [],
      });
    }
  }, [department, isOpen]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        setEmployees(response.data.data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    if (isOpen) fetchEmployees();
  }, [isOpen]);

  const updateDepartmentMutation = useMutation({
    mutationFn: (data) =>
      axiosInstance.put(`/departments/${department._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast.success(t("departments.updated"));
      onClose();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("departments.error_updating")
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeamMembersChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, teamMembers: selectedOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      teamMembers: formData.teamMembers.map((id) => ({ employeeId: id })),
    };
    updateDepartmentMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        className="rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border"
        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
            {t("departments.edit_department")}
        </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:scale-110 transition-all"
            style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              <Building2 className="inline mr-2" size={16} />
              {t("departments.name")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
              {t("departments.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
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
              <User className="inline mr-2" size={16} />
              {t("departments.manager")}
            </label>
            <select
              name="departmentManager"
              value={formData.departmentManager}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="">{t("departments.select_manager")}</option>
              {employees
                .filter((emp) => emp.role === "Manager")
                .map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} {emp.lastName}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              <Users className="inline mr-2" size={16} />
              {t("departments.team_members")}
            </label>
            <select
              name="teamMembers"
              multiple
              value={formData.teamMembers}
              onChange={handleTeamMembersChange}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 h-40"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.lastName} - {emp.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
            >
              {t("departments.cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {t("departments.save")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DepartmentList = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [editDepartment, setEditDepartment] = useState(null);

  const {
    data: departments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/departments");
        return response.data.data;
      } catch (err) {
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (departmentId) =>
      axiosInstance.delete(`/departments/${departmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast.success(t("departments.deleted"));
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("departments.error_deleting")
      );
    },
  });

  const filteredDepartments = departments.filter((dept) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const searchableString = [
      dept.name || "",
      dept.description || "",
      dept.departmentManager?.name || dept.departmentManager?.toString() || "",
      dept.teamMembers
        ?.map(
          (member) =>
            `${member.employeeId?.name} ${member.employeeId?.lastName}`
        )
        .join(" ") || "",
      dept.projects
        ?.map((proj) => proj.projectId?.name || "")
        .filter(Boolean)
        .join(" ") || "",
    ]
      .join(" ")
      .toLowerCase();
    return searchableString.includes(searchLower);
  });

  const stats = {
    total: departments.length,
    withManager: departments.filter((d) => d.departmentManager).length,
    totalMembers: departments.reduce((sum, d) => sum + (d.teamMembers?.length || 0), 0),
    totalProjects: departments.reduce((sum, d) => sum + (d.projects?.length || 0), 0),
  };

  const handleRowClick = (dept) => {
    setSelectedRow(selectedRow === dept._id ? null : dept._id);
  };

  const handleDelete = (departmentId) => {
    if (window.confirm(t("departments.confirm_delete"))) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  const handleEdit = (dept) => {
    setEditDepartment(dept);
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
          <p style={{ color: 'var(--text-color)' }}>{t("departments.loading")}</p>
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
            {error?.message || t("departments.failed_to_load_departments")}
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Building2 size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
        {t("departments.department_list")}
      </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("departments.manage_all_departments")}
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
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("departments.total_departments")}
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
                  <User size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("departments.with_manager")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.withManager}
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                  <Users size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("departments.total_members")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.totalMembers}
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                  <Briefcase size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("departments.total_projects")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.totalProjects}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-secondary)' }}
            />
          <input
            type="text"
            placeholder={t("departments.search_placeholder")}
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
        </motion.div>

        {/* Table */}
        <motion.div
          className="rounded-2xl shadow-lg border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("departments.name")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("departments.description")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("departments.manager")}
                </th>
                  <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("departments.team_members")}
                </th>
                  <th className="px-4 py-4 text-center font-bold" style={{ color: 'var(--button-text)' }}>
                  {t("departments.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-4 py-16 text-center">
                      <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                      <p style={{ color: 'var(--color-secondary)' }}>
                    {searchTerm
                      ? t("departments.no_departments_match")
                      : t("departments.no_departments")}
                      </p>
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept, index) => {
                  const initial = (dept.name || "D")[0].toUpperCase();
                    const backgroundColor = colorFromString(dept._id || dept.name || "d");

                  return (
                    <React.Fragment key={dept._id}>
                        <motion.tr
                          className="border-b hover:bg-opacity-50 transition-all cursor-pointer"
                          style={{ borderColor: 'var(--border-color)' }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ backgroundColor: 'var(--border-color)' }}
                        onClick={() => handleRowClick(dept)}
                      >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
                            style={{ backgroundColor }}
                          >
                            {initial}
                          </div>
                              <span className="font-bold" style={{ color: 'var(--text-color)' }}>
                            {dept.name || "-"}
                          </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            <p className="truncate" style={{ color: 'var(--text-color)' }}>
                              {dept.description || "-"}
                            </p>
                        </td>
                          <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                          {dept.departmentManager
                            ? `${dept.departmentManager.name} ${dept.departmentManager.lastName}`
                            : "-"}
                        </td>
                          <td className="px-4 py-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"
                            >
                              {dept.teamMembers?.length || 0} {t("departments.members")}
                            </span>
                        </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(dept);
                            }}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                            title={t("departments.edit")}
                          >
                                <Edit size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(dept._id);
                            }}
                                className="p-2 bg-red-500 text-white rounded-lg transition-all hover:scale-110 hover:bg-red-600"
                            title={t("departments.delete")}
                          >
                                <Trash2 size={18} />
                          </button>
                            </div>
                        </td>
                        </motion.tr>

                        {/* Expandable Row */}
                        <AnimatePresence>
                      {selectedRow === dept._id && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ backgroundColor: 'var(--border-color)' }}
                            >
                              <td colSpan="5" className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Team Members */}
                                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-color)' }}>
                                    <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                                      <Users size={18} style={{ color: 'var(--color-primary)' }} />
                                      {t("departments.team_members")}:
                                    </h4>
                                    {dept.teamMembers && dept.teamMembers.length > 0 ? (
                                      <ul className="space-y-1 text-sm">
                                        {dept.teamMembers.map((member, idx) => (
                                          <li key={idx} style={{ color: 'var(--text-color)' }}>
                                            • {member.employeeId?.name || ""}{" "}
                                            {member.employeeId?.lastName || ""} -{" "}
                                            {member.employeeId?.role || "-"}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                                        {t("departments.no_team_members")}
                                      </p>
                                    )}
                                  </div>

                                  {/* Projects */}
                                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-color)' }}>
                                    <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                                      <Briefcase size={18} style={{ color: 'var(--color-primary)' }} />
                                  {t("departments.projects")}:
                                    </h4>
                                {dept.projects && dept.projects.length > 0 ? (
                                      <ul className="space-y-1 text-sm">
                                    {dept.projects.map((proj, idx) => (
                                          <li key={idx} style={{ color: 'var(--text-color)' }}>
                                            • {proj.projectId?.name || "-"}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                      <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                                        {t("departments.no_projects")}
                                      </p>
                                )}
                              </div>
                            </div>
                          </td>
                            </motion.tr>
                      )}
                        </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </motion.div>

      <EditDepartmentModal
        department={editDepartment}
        isOpen={!!editDepartment}
        onClose={() => setEditDepartment(null)}
      />
      </div>
    </div>
  );
};

export default DepartmentList;
