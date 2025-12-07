import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format, differenceInDays, startOfWeek, endOfWeek, addDays } from "date-fns";
import { he } from "date-fns/locale";
import {
  Calendar,
  Briefcase,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const ProjectGanttChart = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState("month"); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoom, setZoom] = useState(1);

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

  // Fetch tasks for selected project
  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const res = await axiosInstance.get(`/tasks?projectId=${selectedProject}`);
      return res.data.data || [];
    },
    enabled: !!selectedProject,
  });

  const filteredProjects = useMemo(() => {
    if (!selectedProject) return projects;
    return projects.filter((p) => p._id === selectedProject);
  }, [projects, selectedProject]);

  const getDateRange = () => {
    if (viewMode === "month") {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start, end };
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end };
    } else {
      // day view
      return { start: currentDate, end: currentDate };
    }
  };

  const getDaysInView = () => {
    const { start, end } = getDateRange();
    const days = [];
    let current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    return days;
  };

  const getTaskPosition = (task) => {
    if (!task.startDate || !task.dueDate) return { left: 0, width: 0 };
    const { start, end } = getDateRange();
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);
    const totalDays = differenceInDays(end, start) + 1;
    const daysFromStart = Math.max(0, differenceInDays(taskStart, start));
    const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
    const dayWidth = 100 / totalDays;
    return {
      left: daysFromStart * dayWidth,
      width: Math.min(taskDuration * dayWidth, 100 - daysFromStart * dayWidth),
    };
  };

  const navigateDate = (direction) => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, direction * 7));
    } else {
      setCurrentDate(addDays(currentDate, direction));
    }
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Calendar size={28} color="white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("projects.gantt_chart")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("projects.gantt_subtitle")}
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

              {/* View Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "day"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("projects.day")}
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "week"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("projects.week")}
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "month"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("projects.month")}
                </button>
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

              {/* Zoom */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                  <ZoomOut className="size-5 text-gray-700" />
                </button>
                <span className="text-sm font-medium text-gray-700">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                  <ZoomIn className="size-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Date Display */}
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-800">
                {format(currentDate, "MMMM yyyy", { locale: isRTL ? he : undefined })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Gantt Chart */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="size-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 text-lg">
                {t("projects.no_projects")}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {t("projects.create_project_first")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className={`px-6 py-4 text-sm font-semibold text-gray-700 border-r border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`} style={{ minWidth: "200px" }}>
                      {t("projects.project_task")}
                    </th>
                    {getDaysInView().map((day, index) => (
                      <th
                        key={index}
                        className="px-4 py-4 text-sm font-semibold text-gray-700 border-r border-gray-200 text-center"
                        style={{ minWidth: `${100 * zoom}px` }}
                      >
                        <div>{format(day, "EEE", { locale: isRTL ? he : undefined })}</div>
                        <div className="text-xs text-gray-500">{format(day, "d/M")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                  <>
                    <tr key={project._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className={`px-6 py-4 font-semibold text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-4 text-blue-600" />
                          {project.name}
                        </div>
                        {project.startDate && project.endDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(project.startDate), "MMM d")} -{" "}
                            {format(new Date(project.endDate), "MMM d, yyyy")}
                          </div>
                        )}
                      </td>
                      {getDaysInView().map((day, index) => (
                        <td key={index} className="px-4 py-4 border-r border-gray-200 relative">
                          <div className="relative h-full" style={{ minHeight: "60px" }}>
                            {project.startDate &&
                              project.endDate &&
                              new Date(day) >= new Date(project.startDate) &&
                              new Date(day) <= new Date(project.endDate) && (
                                <div
                                  className="absolute top-2 bottom-2 rounded-lg bg-blue-500 opacity-20"
                                  style={{
                                    left: "0",
                                    right: "0",
                                  }}
                                />
                              )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {tasks
                      .filter((task) => task.projectId === project._id || task.projectId?._id === project._id)
                      .map((task) => {
                        const position = getTaskPosition(task);
                        return (
                          <tr key={task._id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className={`px-6 py-4 pl-12 text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {task.title || task.name}
                            </td>
                            {getDaysInView().map((day, index) => (
                              <td key={index} className="px-4 py-4 border-r border-gray-200 relative">
                                <div className="relative h-full" style={{ minHeight: "40px" }}>
                                  {index === 0 && position.left >= 0 && (
                                    <div
                                      className="absolute top-1 bottom-1 rounded-lg bg-green-500 text-white text-xs flex items-center justify-center px-2"
                                      style={{
                                        left: `${position.left}%`,
                                        width: `${position.width}%`,
                                        minWidth: "60px",
                                      }}
                                    >
                                      {task.title || task.name}
                                    </div>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                  </>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectGanttChart;

