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
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Project Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {t("projects.select_project")}
                </label>
                <select
                  value={selectedProject || ""}
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
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
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {t("projects.department")}
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
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
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("projects.grid")}
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("projects.list")}
                </button>
                <button
                  onClick={() => setViewMode("chart")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "chart"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
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
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("projects.total_projects")}
                </p>
                <p className="text-3xl font-bold text-gray-800">{filteredProjects.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Briefcase className="text-blue-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("projects.total_resources")}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {resourceAllocation.reduce((sum, a) => sum + a.totalMembers, 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("projects.total_hours")}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {resourceAllocation.reduce((sum, a) => sum + a.totalHours, 0)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-r-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t("projects.completion_rate")}
                </p>
                <p className="text-3xl font-bold text-gray-800">
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
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Resource Allocation */}
        {resourceAllocation.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="size-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">
              {t("projects.no_projects")}
            </p>
            <p className="text-gray-500 text-sm mt-2">
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
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Briefcase className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{allocation.project.name}</h3>
                    <p className="text-sm text-gray-500">
                      {allocation.totalMembers} {t("projects.members")}
                      {" • "}
                      {allocation.completedTasks || 0}/{allocation.totalTasks || 0}{" "}
                      {t("projects.tasks")}
                    </p>
                  </div>
                </div>

                {/* Project-level task statistics */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t("projects.project_tasks")}:
                    </span>
                    <span className="text-sm font-semibold text-blue-700">
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
                      <div key={member.employee._id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-1.5 rounded-full">
                              <User className="size-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {member.employee.name} {member.employee.lastName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {member.workload.completedTasks}/{member.workload.taskCount}{" "}
                            {t("projects.tasks")}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>
                              {member.workload.completedHours}h / {member.workload.totalHours}h
                            </span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${progress}%` }}
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("projects.project")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("projects.resource")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("projects.tasks")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("projects.hours")}
                    </th>
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("projects.progress")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resourceAllocation.map((allocation) =>
                    allocation.teamMembers.map((member) => {
                      if (!member.employee) return null;
                      const progress =
                        member.workload.totalHours > 0
                          ? (member.workload.completedHours / member.workload.totalHours) * 100
                          : 0;

                      return (
                        <tr key={`${allocation.project._id}-${member.employee._id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Briefcase className="size-4 text-blue-600" />
                              <span className="font-medium text-gray-800">{allocation.project.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="size-4 text-gray-600" />
                              <span className="text-gray-800">
                                {member.employee.name} {member.employee.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {member.workload.completedTasks}/{member.workload.taskCount}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {member.workload.completedHours}h / {member.workload.totalHours}h
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12">{Math.round(progress)}%</span>
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
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {t("projects.department_allocation")}
            </h2>
            <div className="space-y-4">
              {departmentStats.map((stat) => (
                <div key={stat.department?._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{stat.department?.name || "Unknown"}</h3>
                    <span className="text-sm text-gray-600">
                      {stat.projects} {t("projects.projects")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
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

