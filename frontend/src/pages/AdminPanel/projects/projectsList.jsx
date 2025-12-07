import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Filter,
  Search,
  Edit,
  X,
  Loader2,
  AlertCircle,
  Target,
  Clock,
  CheckCircle,
  Building2,
  User,
  Plus
} from "lucide-react";

const ProjectModal = ({ project, isOpen, onClose, isTeamModal = false }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: 0,
      priority: "Medium",
      tags: "",
      progress: 0,
      projectManager: "",
      departmentId: "",
      teamMembers: [],
    },
  });

  const departmentId = watch("departmentId");

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  useState(() => {
    if (project && isOpen && !isTeamModal) {
      const today = new Date();
      const startDate = new Date(project.startDate || today);
      const status = startDate > today ? "On Hold" : "Active";

      reset({
        name: project.name || "",
        description: project.description || "",
        startDate: project.startDate
          ? format(new Date(project.startDate), "yyyy-MM-dd")
          : "",
        endDate: project.endDate
          ? format(new Date(project.endDate), "yyyy-MM-dd")
          : "",
        status: status,
        budget: project.budget || 0,
        priority: project.priority || "Medium",
        progress: project.progress || 0,
        tags: project.tags?.join(", ") || "",
        projectManager:
          project.projectManager?._id || project.projectManager || "",
        departmentId: project.departmentId?._id || project.departmentId || "",
        teamMembers:
          project.teamMembers?.map((m) => m.employeeId?._id || m.employeeId) ||
          [],
      });
    }
  }, [project, isOpen, isTeamModal, reset]);

  const updateProjectMutation = useMutation({
    mutationFn: (data) => axiosInstance.put(`/projects/${project?._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
      toast.success(t("projects.saved"));
      onClose();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("projects.error_updating")
      );
    },
  });

  const onSubmit = (values) => {
    const today = new Date();
    const startDate = new Date(values.startDate);
    const endDate = new Date(values.endDate);

    if (!values.name) {
      toast.error(t("project.name_required"));
      return;
    }
    if (!values.startDate) {
      toast.error(t("project.start_date_required"));
      return;
    }
    if (!values.endDate) {
      toast.error(t("project.end_date_required"));
      return;
    }
    if (endDate < startDate) {
      toast.error(t("project.end_date_after_start"));
      return;
    }
    if (!values.projectManager) {
      toast.error(t("project.project_manager_required"));
      return;
    }
    if (!values.departmentId) {
      toast.error(t("project.department_required"));
      return;
    }

    const updatedData = {
      ...values,
      status: startDate > today ? "On Hold" : "Active",
      tags: values.tags ? values.tags.split(",").map((tag) => tag.trim()) : [],
      teamMembers: values.teamMembers.map((id) => ({ employeeId: id })),
    };
    updateProjectMutation.mutate(updatedData);
  };

  const selectedDepartment = departments.find(
    (dept) => dept._id === departmentId
  );
  const departmentEmployeeIds =
    selectedDepartment?.teamMembers?.map((member) =>
      typeof member.employeeId === "object"
        ? member.employeeId?._id?.toString()
        : member.employeeId?.toString()
    ) || [];
  const departmentEmployees = employees.filter((emp) =>
    departmentEmployeeIds.includes(emp._id?.toString())
  );
  const projectManagers = departmentEmployees.filter(
    (emp) => emp.role && emp.role.toLowerCase() === "manager"
  );

  const handleTeamMembersChange = (e) => {
    const selectedTeamMembers = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    return selectedTeamMembers;
  };

  if (!isOpen || !project) return null;

  if (employeesLoading || departmentsLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <motion.div
          className="rounded-2xl p-8 shadow-2xl"
          style={{ backgroundColor: 'var(--bg-color)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Loader2 size={48} className="animate-spin mx-auto" style={{ color: 'var(--color-primary)' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <motion.div
        className="rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border"
        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
            {isTeamModal ? (
              <span className="flex items-center gap-2">
                <Users size={28} style={{ color: 'var(--color-primary)' }} />
                {t("projects.team_members")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Edit size={28} style={{ color: 'var(--color-primary)' }} />
                {t("projects.edit_project")}
              </span>
            )}
        </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:scale-110 transition-all"
            style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
          >
            <X size={20} />
          </button>
        </div>

        {isTeamModal ? (
          <div className="space-y-3">
            {project.teamMembers?.length > 0 ? (
              <motion.div className="grid gap-3">
                {project.teamMembers.map((member, idx) => (
                  <motion.div
                    key={idx}
                    className="flex justify-between items-center p-4 rounded-xl border"
                    style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                        <User size={20} color="white" />
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                      {member.employeeId?.name || t("projects.not_available")}{" "}
                      {member.employeeId?.lastName || ""}
                    </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                <p style={{ color: 'var(--color-secondary)' }}>
                {t("projects.no_team_members")}
              </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("projects.name")}
              </label>
              <input
                {...register("name", { required: true })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)',
                  '--tw-ring-color': 'var(--color-primary)'
                }}
              />
              {errors.name && (
                <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {t("project.name_required")}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("projects.description")}
              </label>
              <textarea
                {...register("description")}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={16} />
                  {t("projects.start")}
                </label>
                <input
                  type="date"
                  {...register("startDate", { required: true })}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
                {errors.startDate && (
                  <div className="text-red-500 text-sm mt-1">{t("project.start_date_required")}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={16} />
                  {t("projects.end")}
                </label>
                <input
                  type="date"
                  {...register("endDate", { required: true })}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
                {errors.endDate && (
                  <div className="text-red-500 text-sm mt-1">{t("project.end_date_required")}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <DollarSign className="inline mr-2" size={16} />
                {t("projects.budget")}
              </label>
              <input
                type="number"
                {...register("budget", { min: 0 })}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Target className="inline mr-2" size={16} />
                {t("projects.priority")}
              </label>
              <select
                {...register("priority")}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="Low">{t("project.priority_low")}</option>
                <option value="Medium">{t("project.priority_medium")}</option>
                <option value="High">{t("project.priority_high")}</option>
              </select>
            </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <TrendingUp className="inline mr-2" size={16} />
                {t("projects.progress")} ({watch("progress")}%)
              </label>
              <input
                type="range"
                {...register("progress", { min: 0, max: 100 })}
                className="w-full"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("projects.tags")}
              </label>
              <input
                {...register("tags")}
                placeholder={t("projects.tags_placeholder")}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.tags_hint")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Building2 className="inline mr-2" size={16} />
                {t("projects.department")}
              </label>
              <select
                {...register("departmentId", { required: true })}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="">{t("project.select_department")}</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <div className="text-red-500 text-sm mt-1">{t("project.department_required")}</div>
              )}
            </div>

            {departmentId && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <User className="inline mr-2" size={16} />
                    {t("projects.project_manager")}
                  </label>
                  <select
                    {...register("projectManager", { required: true })}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  >
                    <option value="">
                      {t("project.select_project_manager")}
                    </option>
                    {projectManagers.length > 0 ? (
                      projectManagers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name} {manager.lastName || ""}
                        </option>
                      ))
                    ) : (
                      <option disabled>
                        {t("project.no_project_managers")}
                      </option>
                    )}
                  </select>
                  {errors.projectManager && (
                    <div className="text-red-500 text-sm mt-1">
                      {t("project.project_manager_required")}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Users className="inline mr-2" size={16} />
                    {t("projects.team_members")}
                  </label>
                  <Controller
                    name="teamMembers"
                    control={control}
                    render={({ field }) => (
                      <select
                        multiple
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(handleTeamMembersChange(e))
                        }
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 h-32"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      >
                        {departmentEmployees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} {emp.lastName || ""} - {emp.role || t("projects.not_available")}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                    {t("projects.team_members_hint")}
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
              >
                {t("projects.close")}
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
              >
                {t("projects.save")}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const ProjectsList = () => {
  const { t, i18n } = useTranslation();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");


  // Helper function to translate status
  const translateStatus = (status) => {
    if (!status) return "";
    const statusMap = {
      "Active": t("projects.active"),
      "On Hold": t("projects.on_hold"),
      "Completed": t("projects.completed"),
      "Cancelled": t("projects.cancelled"),
    };
    return statusMap[status] || status;
  };

  // Helper function to translate priority
  const translatePriority = (priority) => {
    if (!priority) return "";
    const priorityMap = {
      "Low": t("project.priority_low"),
      "Medium": t("project.priority_medium"),
      "High": t("project.priority_high"),
    };
    return priorityMap[priority] || priority;
  };

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosInstance.get("/projects");
      return res.data.data.map((project) => {
        const today = new Date();
        const startDate = new Date(project.startDate || today);
        return {
          ...project,
          status: startDate > today ? "On Hold" : "Active",
        };
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("projects.error_fetch"));
    },
  });

  const filteredProjects = (projects || []).filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesPriority = filterPriority === "all" || project.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "Active").length,
    onHold: projects.filter((p) => p.status === "On Hold").length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
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
          <p style={{ color: 'var(--text-color)' }}>{t("projects.loading")}</p>
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
          {t("projects.error_loading")}
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Briefcase size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("projects.title")}
        </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.manage_all_projects")}
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <Briefcase size={24} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>{t("projects.total_projects")}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>{stats.total}</p>
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
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>{t("projects.active")}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>{stats.active}</p>
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
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>{t("projects.on_hold")}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>{stats.onHold}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <DollarSign size={24} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>{t("projects.total_budget")}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    ${stats.totalBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-secondary)' }} />
                <input
                  type="text"
                  placeholder={t("projects.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("projects.all_status")}</option>
              <option value="Active">{t("projects.active")}</option>
              <option value="On Hold">{t("projects.on_hold")}</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("projects.all_priorities")}</option>
              <option value="Low">{t("project.priority_low")}</option>
              <option value="Medium">{t("project.priority_medium")}</option>
              <option value="High">{t("project.priority_high")}</option>
            </select>
          </div>
        </motion.div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl" style={{ color: 'var(--color-secondary)' }}>
            {t("projects.no_projects")}
          </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProjects.map((project, index) => (
                <motion.div
                key={project._id}
                  className="rounded-2xl shadow-lg border overflow-hidden flex flex-col"
                  style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, translateY: -5 }}
                >
                  {/* Header */}
                  <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold truncate" style={{ color: 'var(--text-color)' }}>
                    {project.name || t("projects.unnamed_project")}
                  </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        project.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {translateStatus(project.status)}
                      </span>
                </div>
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--color-secondary)' }}>
                    {project.description || t("projects.no_description")}
                  </p>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-grow space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
                      <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                        {project.departmentId?.name || t("projects.not_available")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ color: 'var(--text-color)' }}>
                        {project.projectManager?.name
                          ? `${project.projectManager.name} ${project.projectManager.lastName || ""}`
                          : t("projects.not_available")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>
                        {project.startDate
                          ? format(new Date(project.startDate), "MMM d, yyyy")
                          : t("projects.not_available")}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        project.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : project.priority === "Medium"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {translatePriority(project.priority)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                          {t("projects.progress")}
                        </span>
                        <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                          {project.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress || 0}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} style={{ color: 'var(--color-primary)' }} />
                        <span className="font-bold" style={{ color: 'var(--text-color)' }}>
                          ${(project.budget || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>
                          {project.teamMembers?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowTeamModal(true);
                    }}
                      className="flex-1 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                    >
                      <Users size={18} />
                      {t("projects.team")}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowTeamModal(false);
                    }}
                      className="flex-1 py-2 rounded-xl font-medium shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                  >
                      <Edit size={18} />
                    {t("projects.edit")}
                  </button>
                </div>
                </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}

        <ProjectModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => {
            setSelectedProject(null);
            setShowTeamModal(false);
          }}
          isTeamModal={showTeamModal}
        />
      </div>
    </div>
  );
};

export default ProjectsList;
