import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Pie, Line } from "react-chartjs-2";
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Filter,
  Search,
  Calendar,
  Target,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const ProjectPortfolio = () => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["projectPortfolio"],
    queryFn: async () => {
      const res = await axiosInstance.get("/projects/portfolio/overview");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--bg-color)', color: '#ef4444' }}>
        {t("projects.error_loading")}
      </div>
    );
  }

  const { projects = [], statistics = {} } = data || {};

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesStatus =
      filterStatus === "All" || project.status === filterStatus;
    const matchesPriority =
      filterPriority === "All" || project.priority === filterPriority;
    const matchesSearch =
      !searchTerm ||
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Chart data
  const statusChartData = {
    labels: ["Active", "Completed", "On Hold", "Cancelled"],
    datasets: [
      {
        label: t("projects.projects_count"),
        data: [
          statistics.activeProjects || 0,
          statistics.completedProjects || 0,
          statistics.onHoldProjects || 0,
          statistics.cancelledProjects || 0,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.7)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(251, 191, 36, 0.7)",
          "rgba(239, 68, 68, 0.7)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const priorityChartData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        label: t("projects.projects_count"),
        data: [
          statistics.projectsByPriority?.High || 0,
          statistics.projectsByPriority?.Medium || 0,
          statistics.projectsByPriority?.Low || 0,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.7)",
          "rgba(251, 191, 36, 0.7)",
          "rgba(34, 197, 94, 0.7)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const departmentChartData = {
    labels: Object.keys(statistics.projectsByDepartment || {}),
    datasets: [
      {
        label: t("projects.projects_count"),
        data: Object.values(statistics.projectsByDepartment || {}),
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(168, 85, 247, 0.7)",
          "rgba(236, 72, 153, 0.7)",
          "rgba(251, 191, 36, 0.7)",
          "rgba(34, 197, 94, 0.7)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
    },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
            {t("projects.portfolio")}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-secondary)' }}>
            {t("projects.portfolio_description")}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg shadow p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.total_projects")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                {statistics.totalProjects || 0}
              </p>
            </div>
            <Briefcase className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg shadow p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.active_projects")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
                {statistics.activeProjects || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg shadow p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.total_budget")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                ${(statistics.totalBudget || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8" style={{ color: '#f59e0b' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg shadow p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.average_progress")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                {statistics.averageProgress || 0}%
              </p>
            </div>
            <Target className="w-8 h-8" style={{ color: '#a855f7' }} />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg shadow p-6 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
            {t("projects.projects_by_status")}
          </h3>
          <div className="h-64">
            <Doughnut data={statusChartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-lg shadow p-6 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
            {t("projects.projects_by_priority")}
          </h3>
          <div className="h-64">
            <Pie data={priorityChartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-lg shadow p-6 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
            {t("projects.projects_by_department")}
          </h3>
          <div className="h-64">
            <Bar data={departmentChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg shadow p-4 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder={t("projects.search_projects")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)',
                  '--tw-ring-color': 'var(--color-primary)'
                }}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2"
              style={{ 
                borderColor: 'var(--border-color)', 
                backgroundColor: 'var(--bg-color)', 
                color: 'var(--text-color)',
                '--tw-ring-color': 'var(--color-primary)'
              }}
            >
              <option value="All">{t("projects.all_statuses")}</option>
              <option value="Active">{t("projects.active")}</option>
              <option value="Completed">{t("projects.completed")}</option>
              <option value="On Hold">{t("projects.on_hold")}</option>
              <option value="Cancelled">{t("projects.cancelled")}</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2"
              style={{ 
                borderColor: 'var(--border-color)', 
                backgroundColor: 'var(--bg-color)', 
                color: 'var(--text-color)',
                '--tw-ring-color': 'var(--color-primary)'
              }}
            >
              <option value="All">{t("projects.all_priorities")}</option>
              <option value="High">{t("projects.high")}</option>
              <option value="Medium">{t("projects.medium")}</option>
              <option value="Low">{t("projects.low")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-lg shadow overflow-hidden border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--footer-bg)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-color)' }}>
                  {t("projects.name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-color)' }}>
                  {t("projects.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-color)' }}>
                  {t("projects.priority")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-color)' }}>
                  {t("projects.progress")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-color)' }}>
                  {t("projects.budget")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-color)' }}>
                  {t("projects.department")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              {filteredProjects.map((project) => (
                <tr key={project._id} style={{ borderColor: 'var(--border-color)' }} className="hover:opacity-80">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                      {project.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === "Active"
                          ? ""
                          : project.status === "Completed"
                          ? ""
                          : project.status === "On Hold"
                          ? ""
                          : ""
                      }`}
                      style={
                        project.status === "Active"
                          ? { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }
                          : project.status === "Completed"
                          ? { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }
                          : project.status === "On Hold"
                          ? { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }
                          : { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                      }
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.priority === "High"
                          ? ""
                          : project.priority === "Medium"
                          ? ""
                          : ""
                      }`}
                      style={
                        project.priority === "High"
                          ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                          : project.priority === "Medium"
                          ? { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }
                          : { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }
                      }
                    >
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full rounded-full h-2 mr-2" style={{ backgroundColor: 'var(--border-color)' }}>
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${project.progress || 0}%`, backgroundColor: 'var(--color-primary)' }}
                        ></div>
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                        {project.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-color)' }}>
                    ${(project.budget || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-color)' }}>
                    {project.departmentId?.name || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectPortfolio;

