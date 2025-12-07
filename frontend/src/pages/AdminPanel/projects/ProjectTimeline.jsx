import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { he } from "date-fns/locale";
import {
  Clock,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlayCircle,
} from "lucide-react";

const ProjectTimeline = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewRange, setViewRange] = useState(30); // days

  // Fetch projects
  const { data: projects = [], isLoading, isError, error } = useQuery({
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
    if (filterStatus !== "all") {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }
    return filtered;
  }, [projects, selectedProject, filterStatus]);

  const getTimelineEvents = () => {
    const events = [];
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - viewRange / 2);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + viewRange / 2);

    // Add project events
    filteredProjects.forEach((project) => {
      if (project.startDate) {
        events.push({
          id: `project-start-${project._id}`,
          type: "project-start",
          date: new Date(project.startDate),
          project,
          label: t("projects.project_start"),
          color: "blue",
        });
      }
      if (project.endDate) {
        events.push({
          id: `project-end-${project._id}`,
          type: "project-end",
          date: new Date(project.endDate),
          project,
          label: t("projects.project_end"),
          color: "green",
        });
      }
    });

    // Add task events
    tasks.forEach((task) => {
      if (task.dueDate) {
        const taskProject = projects.find(
          (p) => p._id === task.projectId || p._id === task.projectId?._id
        );
        if (taskProject && (!selectedProject || taskProject._id === selectedProject)) {
          events.push({
            id: `task-${task._id}`,
            type: "task",
            date: new Date(task.dueDate),
            task,
            project: taskProject,
            label: task.title || task.name,
            color: task.status === "completed" ? "green" : task.status === "in progress" ? "yellow" : "red",
          });
        }
      }
    });

    return events.filter((event) => event.date >= startDate && event.date <= endDate).sort((a, b) => a.date - b.date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "completed":
        return "bg-green-500";
      case "On Hold":
      case "pending":
        return "bg-yellow-500";
      case "Cancelled":
      case "cancelled":
        return "bg-red-500";
      case "in progress":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Active":
      case "completed":
        return <CheckCircle className="size-4" />;
      case "On Hold":
      case "pending":
        return <AlertCircle className="size-4" />;
      case "Cancelled":
      case "cancelled":
        return <XCircle className="size-4" />;
      case "in progress":
        return <PlayCircle className="size-4" />;
      default:
        return <Clock className="size-4" />;
    }
  };

  const navigateDate = (direction) => {
    setCurrentDate(new Date(currentDate.getTime() + direction * viewRange * 24 * 60 * 60 * 1000));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t("projects.loading")}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center">
          <AlertCircle className="size-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">{t("projects.error_loading")}</p>
          <p className="text-gray-500 text-sm mt-2">{error?.message || ""}</p>
        </div>
      </div>
    );
  }

  const timelineEvents = getTimelineEvents();
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - viewRange / 2);
  const endDate = new Date(currentDate);
  endDate.setDate(endDate.getDate() + viewRange / 2);

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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Clock size={28} color="white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("projects.timeline")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("projects.timeline_subtitle")}
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

              {/* Status Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {t("projects.status")}
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
                >
                  <option value="all">{t("projects.all_status")}</option>
                  <option value="Active">{t("projects.active")}</option>
                  <option value="On Hold">{t("projects.on_hold")}</option>
                  <option value="Completed">{t("projects.completed")}</option>
                  <option value="Cancelled">{t("projects.cancelled")}</option>
                </select>
              </div>

              {/* View Range */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {t("projects.view_range")}
                </label>
                <select
                  value={viewRange}
                  onChange={(e) => setViewRange(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-800"
                >
                  <option value={7}>{t("projects.week")}</option>
                  <option value={30}>{t("projects.month")}</option>
                  <option value={90}>{t("projects.quarter")}</option>
                  <option value={365}>{t("projects.year")}</option>
                </select>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                  <ChevronLeft className="size-5 text-gray-700" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  {t("projects.today")}
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                  <ChevronRight className="size-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Date Range Display */}
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-800">
                {format(startDate, "MMM d", { locale: isRTL ? he : undefined })} -{" "}
                {format(endDate, "MMM d, yyyy", { locale: isRTL ? he : undefined })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {timelineEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="size-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">{t("projects.no_events")}</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-300" />

              {/* Events */}
              <div className="space-y-8">
                {timelineEvents.map((event, index) => {
                  const daysFromStart = differenceInDays(event.date, startDate);
                  const position = (daysFromStart / viewRange) * 100;
                  const isLeft = index % 2 === 0;

                  return (
                    <div key={event.id} className="relative">
                      <div
                        className={`flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}
                        style={{ marginLeft: isLeft ? `${position}%` : "auto", marginRight: !isLeft ? `${100 - position}%` : "auto" }}
                      >
                        <div className={`flex-1 ${isLeft ? "text-right pr-4" : "text-left pl-4"}`}>
                          <div className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{ borderColor: event.color === "blue" ? "#3b82f6" : event.color === "green" ? "#10b981" : event.color === "yellow" ? "#f59e0b" : "#ef4444" }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-2 rounded-lg ${getStatusColor(event.project?.status || event.task?.status)} text-white`}>
                                {getStatusIcon(event.project?.status || event.task?.status)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{event.label}</h3>
                                {event.project && (
                                  <p className="text-sm text-gray-600">{event.project.name}</p>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {format(event.date, "MMM d, yyyy 'at' HH:mm", {
                                locale: isRTL ? he : undefined,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="relative z-10">
                          <div
                            className={`w-4 h-4 rounded-full border-4 border-white shadow-lg ${
                              event.color === "blue"
                                ? "bg-blue-500"
                                : event.color === "green"
                                ? "bg-green-500"
                                : event.color === "yellow"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;

