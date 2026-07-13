import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Users,
  Briefcase,
  Filter,
  Search,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  User,
  BarChart3,
  RefreshCw,
} from "lucide-react";

const ProjectResourcesAllocation = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid, list, chart

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading, isError: projectsError, error: projectsErrorMsg } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/projects");
        return res.data?.data || res.data || [];
      } catch (err) {
        console.error("Error fetching projects:", err);
        return [];
      }
    },
  });

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/employees");
        return res.data?.data || res.data || [];
      } catch (err) {
        console.error("Error fetching employees:", err);
        return [];
      }
    },
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/departments");
        return res.data?.data || res.data || [];
      } catch (err) {
        console.error("Error fetching departments:", err);
        return [];
      }
    },
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/tasks");
        return res.data?.data || res.data || [];
      } catch (err) {
        console.error("Error fetching tasks:", err);
        return [];
      }
    },
  });

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (selectedProject) {
      filtered = filtered.filter((p) => p._id === selectedProject);
    }
    return filtered;
  }, [projects, selectedProject]);

  const getResourceAllocation = () => {
    const allocation = [];

    filteredProjects.forEach((project) => {
      // Get team members
      const teamMembers = project.teamMembers || [];
      const memberIds = teamMembers.map((m) => {
        const id = m.employeeId?._id || m.employeeId;
        return id?.toString ? id.toString() : id;
      });

      // Get ALL tasks for this project (not just those assigned to team members)
      const projectTasks = tasks.filter((task) => {
        const taskProjectId = task.projectId?._id || task.projectId;
        return taskProjectId?.toString() === project._id?.toString() || taskProjectId === project._id;
      });

      // Helper function to check if an employee is assigned to a task
      const isEmployeeAssignedToTask = (task, employeeId) => {
        if (!task.assignedTo) return false;
        const employeeIdStr = employeeId?.toString ? employeeId.toString() : employeeId;
        
        // Handle assignedTo as array
        if (Array.isArray(task.assignedTo)) {
          return task.assignedTo.some((assigned) => {
            const assignedId = assigned?._id || assigned;
            const assignedIdStr = assignedId?.toString ? assignedId.toString() : assignedId;
            return assignedIdStr === employeeIdStr;
          });
        }
        
        // Handle assignedTo as single value
        const assignedId = task.assignedTo?._id || task.assignedTo;
        const assignedIdStr = assignedId?.toString ? assignedId.toString() : assignedId;
        return assignedIdStr === employeeIdStr;
      };

      // Calculate workload per employee
      const employeeWorkload = {};
      memberIds.forEach((employeeId) => {
        const employee = employees.find((e) => {
          const eId = e._id?.toString ? e._id.toString() : e._id;
          const empIdStr = employeeId?.toString ? employeeId.toString() : employeeId;
          return eId === empIdStr;
        });
        if (employee) {
          const assignedTasks = projectTasks.filter((task) => isEmployeeAssignedToTask(task, employeeId));
          const totalHours = assignedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
          const completedHours = assignedTasks
            .filter((task) => task.status === "completed")
            .reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

          employeeWorkload[employeeId] = {
            employee,
            totalHours,
            completedHours,
            remainingHours: totalHours - completedHours,
            taskCount: assignedTasks.length,
            completedTasks: assignedTasks.filter((task) => task.status === "completed").length,
          };
        }
      });

      // Calculate project-level statistics (all tasks, not just assigned to team members)
      const allProjectTasks = projectTasks.length;
      const completedProjectTasks = projectTasks.filter((task) => task.status === "completed").length;
      const totalProjectHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
      const completedProjectHours = projectTasks
        .filter((task) => task.status === "completed")
        .reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

      allocation.push({
        project,
        teamMembers: memberIds.map((id) => {
          const employee = employees.find((e) => {
            const eId = e._id?.toString ? e._id.toString() : e._id;
            const empIdStr = id?.toString ? id.toString() : id;
            return eId === empIdStr;
          });
          return {
            employee,
            workload: employeeWorkload[id] || {
              totalHours: 0,
              completedHours: 0,
              remainingHours: 0,
              taskCount: 0,
              completedTasks: 0,
            },
          };
        }),
        totalMembers: memberIds.length,
        totalHours: Object.values(employeeWorkload).reduce((sum, w) => sum + w.totalHours, 0),
        completedHours: Object.values(employeeWorkload).reduce((sum, w) => sum + w.completedHours, 0),
        // Add project-level task statistics
        totalTasks: allProjectTasks,
        completedTasks: completedProjectTasks,
        totalProjectHours: totalProjectHours,
        completedProjectHours: completedProjectHours,
      });
    });

    return allocation;
  };

  const getDepartmentStats = () => {
    const stats = {};
    filteredProjects.forEach((project) => {
      const deptId = project.departmentId?._id || project.departmentId;
      if (!deptId) return;

      if (!stats[deptId]) {
        const dept = departments.find((d) => d._id === deptId);
        stats[deptId] = {
          department: dept,
          projects: 0,
          members: new Set(),
          totalHours: 0,
        };
      }

      stats[deptId].projects++;
      project.teamMembers?.forEach((m) => {
        stats[deptId].members.add(m.employeeId?._id || m.employeeId);
      });
    });

    return Object.values(stats).map((stat) => ({
      ...stat,
      members: stat.members.size,
    }));
  };

  const resourceAllocation = getResourceAllocation();
  const departmentStats = getDepartmentStats();

  if (projectsLoading || employeesLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t("projects.loading")}</p>
        </div>
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center">
          <AlertTriangle className="size-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">{t("projects.error_loading")}</p>
          <p className="text-gray-500 text-sm mt-2">{projectsErrorMsg?.message || ""}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-teal-600">
              <Users size={28} color="white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("projects.resources_allocation")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("projects.resources_subtitle", {
                })}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-2xl shadow-lg p-6 mb-6 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Project Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("projects.select_project")}
                </label>
                <select
                  value={selectedProject || ""}
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                  className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 transition-all duration-200"
                  style={{ 
                    borderColor: 'var(--border-color)', 
                    backgroundColor: 'var(--bg-color)', 
                    color: 'var(--text-color)',
                    '--tw-ring-color': 'var(--color-primary)'
                  }}
                >
                  <option value="">{t("projects.all_projects")}</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("projects.department")}
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 transition-all duration-200"
                  style={{ 
                    borderColor: 'var(--border-color)', 
                    backgroundColor: 'var(--bg-color)', 
                    color: 'var(--text-color)',
                    '--tw-ring-color': 'var(--color-primary)'
                  }}
                >
                  <option value="all">{t("projects.all_departments")}</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "grid" ? "" : ""
                  }`}
                  style={viewMode === "grid" 
                    ? { backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }
                    : { backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }
                  }
                >
                  {t("projects.grid")}
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "list" ? "" : ""
                  }`}
                  style={viewMode === "list" 
                    ? { backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }
                    : { backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }
                  }
                >
                  {t("projects.list")}
                </button>
                <button
                  onClick={() => setViewMode("chart")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "chart" ? "" : ""
                  }`}
                  style={viewMode === "chart" 
                    ? { backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }
                    : { backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }
                  }
                >
                  {t("projects.chart")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border"
            style={{ 
              backgroundColor: 'var(--bg-color)', 
              borderColor: 'var(--color-primary)',
              borderRightColor: 'var(--color-primary)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("projects.total_projects")}
                </p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>{filteredProjects.length}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)' || 'var(--border-color)' }}>
                <Briefcase size={24} style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border"
            style={{ 
              backgroundColor: 'var(--bg-color)', 
              borderColor: 'var(--color-accent)',
              borderRightColor: 'var(--color-accent)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("projects.total_resources")}
                </p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {resourceAllocation.reduce((sum, a) => sum + a.totalMembers, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)' || 'var(--border-color)' }}>
                <Users size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4"
            style={{ 
              backgroundColor: 'var(--bg-color)', 
              borderRightColor: '#f59e0b',
              borderColor: '#f59e0b'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("projects.total_hours")}
                </p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {resourceAllocation.reduce((sum, a) => sum + a.totalHours, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Clock size={24} style={{ color: '#f59e0b' }} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4"
            style={{ 
              backgroundColor: 'var(--bg-color)', 
              borderRightColor: '#a855f7',
              borderColor: '#a855f7'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("projects.completion_rate")}
                </p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {resourceAllocation.reduce((sum, a) => sum + a.totalHours, 0) > 0
                    ? Math.round(
                        (resourceAllocation.reduce((sum, a) => sum + a.completedHours, 0) /
                          resourceAllocation.reduce((sum, a) => sum + a.totalHours, 0)) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                <TrendingUp size={24} style={{ color: '#a855f7' }} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Resource Allocation */}
        {resourceAllocation.length === 0 ? (
          <div className="rounded-2xl shadow-lg p-12 text-center border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <Users className="size-12 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-lg" style={{ color: 'var(--text-color)' }}>
              {t("projects.no_projects")}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-secondary)' }}>
              {t("projects.create_project_first")}
            </p>
          </div>
        ) : (
          <>
            {viewMode === "grid" && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {resourceAllocation.map((allocation) => (
              <motion.div
                key={allocation.project._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)' || 'var(--border-color)' }}>
                    <Briefcase size={20} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>{allocation.project.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                      {allocation.totalMembers} {t("projects.members")}
                      {" • "}
                      {allocation.completedTasks || 0}/{allocation.totalTasks || 0}{" "}
                      {t("projects.tasks")}
                    </p>
                  </div>
                </div>

                {/* Project-level task statistics */}
                <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: 'var(--footer-bg)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                      {t("projects.project_tasks")}:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {allocation.completedTasks || 0}/{allocation.totalTasks || 0}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {allocation.teamMembers.map((member) => {
                    if (!member.employee) return null;
                    const progress =
                      member.workload.totalHours > 0
                        ? (member.workload.completedHours / member.workload.totalHours) * 100
                        : 0;

                    return (
                      <div key={member.employee._id} className="border rounded-lg p-3" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                              <User className="size-4" style={{ color: 'var(--text-color)' }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                              {member.employee.name} {member.employee.lastName}
                            </span>
                          </div>
                          <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                            {member.workload.completedTasks}/{member.workload.taskCount}{" "}
                            {t("projects.tasks")}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>
                            <span>
                              {member.workload.completedHours}h / {member.workload.totalHours}h
                            </span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                            <div
                              className="h-full transition-all"
                              style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
                ))}
              </div>
            )}

            {viewMode === "list" && (
          <div className="rounded-2xl shadow-lg overflow-hidden border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--footer-bg)' }}>
                  <tr>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("projects.project")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("projects.resource")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("projects.tasks")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("projects.hours")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                      {t("projects.progress")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                  {resourceAllocation.map((allocation) =>
                    allocation.teamMembers.map((member) => {
                      if (!member.employee) return null;
                      const progress =
                        member.workload.totalHours > 0
                          ? (member.workload.completedHours / member.workload.totalHours) * 100
                          : 0;

                      return (
                        <tr key={`${allocation.project._id}-${member.employee._id}`} style={{ borderColor: 'var(--border-color)' }} className="hover:opacity-80">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Briefcase className="size-4" style={{ color: 'var(--color-primary)' }} />
                              <span className="font-medium" style={{ color: 'var(--text-color)' }}>{allocation.project.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="size-4" style={{ color: 'var(--color-secondary)' }} />
                              <span style={{ color: 'var(--text-color)' }}>
                                {member.employee.name} {member.employee.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4" style={{ color: 'var(--text-color)' }}>
                            {member.workload.completedTasks}/{member.workload.taskCount}
                          </td>
                          <td className="px-6 py-4" style={{ color: 'var(--text-color)' }}>
                            {member.workload.completedHours}h / {member.workload.totalHours}h
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                                <div
                                  className="h-full transition-all"
                                  style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }}
                                />
                              </div>
                              <span className="text-sm w-12" style={{ color: 'var(--text-color)' }}>{Math.round(progress)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
            )}

            {viewMode === "chart" && (
          <div className="rounded-2xl shadow-lg p-6 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-color)' }}>
              {t("projects.department_allocation")}
            </h2>
            <div className="space-y-4">
              {departmentStats.map((stat) => (
                <div key={stat.department?._id} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>{stat.department?.name || "Unknown"}</h3>
                    <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                      {stat.projects} {t("projects.projects")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4" style={{ color: 'var(--color-secondary)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                      {stat.members} {t("projects.members")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectResourcesAllocation;

