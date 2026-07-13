import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Shield,
  AlertCircle,
  X,
} from "lucide-react";

const ProjectRiskManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRiskLevel, setFilterRiskLevel] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ["projectRisks", selectedProject],
    queryFn: async () => {
      const params = selectedProject !== "All" ? { projectId: selectedProject } : {};
      const res = await axiosInstance.get("/projects/risks", { params });
      return res.data.data || [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosInstance.get("/projects");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/projects/risks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["projectRisks"]);
      toast.success(t("projects.risk_deleted"));
    },
    onError: () => {
      toast.error(t("projects.error_deleting_risk"));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => axiosInstance.post("/projects/risks", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["projectRisks"]);
      toast.success(t("projects.risk_created") || "Risk created successfully");
      setShowCreateModal(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("projects.error_creating_risk") || "Error creating risk");
    },
  });

  const validationSchema = Yup.object({
    title: Yup.string().required(t("projects.title_required") || "Title is required"),
    projectId: Yup.string().required(t("projects.project_required") || "Project is required"),
    description: Yup.string(),
    category: Yup.string().oneOf(["Technical", "Financial", "Schedule", "Resource", "Quality", "External", "Other"]),
    probability: Yup.string().oneOf(["Low", "Medium", "High"]),
    impact: Yup.string().oneOf(["Low", "Medium", "High"]),
    status: Yup.string().oneOf(["Open", "In Progress", "Mitigated", "Resolved", "Closed"]),
  });

  // Calculate risk level automatically based on probability and impact
  const calculateRiskLevel = (probability, impact) => {
    const probabilityMap = { Low: 1, Medium: 2, High: 3 };
    const impactMap = { Low: 1, Medium: 2, High: 3 };
    
    const riskScore = probabilityMap[probability] * impactMap[impact];
    
    if (riskScore <= 2) {
      return "Low";
    } else if (riskScore <= 4) {
      return "Medium";
    } else if (riskScore <= 6) {
      return "High";
    } else {
      return "Critical";
    }
  };

  const formik = useFormik({
    initialValues: {
      title: "",
      projectId: "",
      description: "",
      category: "Other",
      probability: "Medium",
      impact: "Medium",
      status: "Open",
      mitigationPlan: "",
    },
    validationSchema,
    onSubmit: (values) => {
      createMutation.mutate(values);
    },
  });

  // Calculate current risk level based on form values
  const currentRiskLevel = calculateRiskLevel(formik.values.probability, formik.values.impact);

  const filteredRisks = risks.filter((risk) => {
    const matchesSearch =
      !searchTerm ||
      risk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || risk.status === filterStatus;
    const matchesRiskLevel =
      filterRiskLevel === "All" || risk.riskLevel === filterRiskLevel;
    return matchesSearch && matchesStatus && matchesRiskLevel;
  });

  const getRiskLevelColor = (level) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
            {t("projects.risk_management")}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-secondary)' }}>
            {t("projects.risk_management_description")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
        >
          <Plus className="w-5 h-5" />
          {t("projects.add_risk")}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg shadow p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.total_risks")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                {risks.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8" style={{ color: '#ef4444' }} />
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
                {t("projects.critical_risks")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>
                {risks.filter((r) => r.riskLevel === "Critical").length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8" style={{ color: '#ef4444' }} />
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
                {t("projects.open_risks")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>
                {risks.filter((r) => r.status === "Open").length}
              </p>
            </div>
            <Shield className="w-8 h-8" style={{ color: '#f59e0b' }} />
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
                {t("projects.resolved_risks")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
                {risks.filter((r) => r.status === "Resolved").length}
              </p>
            </div>
            <Shield className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="rounded-lg shadow p-4 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder={t("projects.search_risks")}
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
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2"
            style={{ 
              borderColor: 'var(--border-color)', 
              backgroundColor: 'var(--bg-color)', 
              color: 'var(--text-color)',
              '--tw-ring-color': 'var(--color-primary)'
            }}
          >
            <option value="All">{t("projects.all_projects")}</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
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
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={filterRiskLevel}
            onChange={(e) => setFilterRiskLevel(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2"
            style={{ 
              borderColor: 'var(--border-color)', 
              backgroundColor: 'var(--bg-color)', 
              color: 'var(--text-color)',
              '--tw-ring-color': 'var(--color-primary)'
            }}
          >
            <option value="All">{t("projects.all_levels")}</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Risks Table */}
      <div className="rounded-lg shadow overflow-hidden border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--footer-bg)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-color)' }}>
                  {t("projects.risk")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-color)' }}>
                  {t("projects.project")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-color)' }}>
                  {t("projects.category")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-color)' }}>
                  {t("projects.risk_level")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-color)' }}>
                  {t("projects.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-color)' }}>
                  {t("projects.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              {filteredRisks.map((risk) => (
                <tr key={risk._id} style={{ borderColor: 'var(--border-color)' }} className="hover:opacity-80">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                      {risk.title}
                    </div>
                    <div className="text-sm line-clamp-1" style={{ color: 'var(--color-secondary)' }}>
                      {risk.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-color)' }}>
                    {risk.projectId?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-color)' }}>
                    {risk.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(
                        risk.riskLevel
                      )}`}
                    >
                      {risk.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}>
                      {risk.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        style={{ color: 'var(--color-primary)' }}
                        onClick={() => {
                          // TODO: Implement edit risk
                          toast.info(t("projects.edit_risk"));
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        style={{ color: '#ef4444' }}
                        onClick={() => {
                          if (window.confirm(t("projects.confirm_delete_risk"))) {
                            deleteMutation.mutate(risk._id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRisks.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
          <p style={{ color: 'var(--color-secondary)' }}>
            {t("projects.no_risks")}
          </p>
        </div>
      )}

      {/* Create Risk Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
              <div className="sticky top-0 flex items-center justify-between p-6 border-b" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("projects.add_risk")}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    formik.resetForm();
                  }}
                  className="p-2 rounded-lg hover:opacity-80"
                  style={{ color: 'var(--text-color)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("projects.title")} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                    style={{ 
                      borderColor: formik.errors.title && formik.touched.title ? '#ef4444' : 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                  {formik.errors.title && formik.touched.title && (
                    <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{formik.errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("projects.project")} *
                  </label>
                  <select
                    name="projectId"
                    value={formik.values.projectId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                    style={{ 
                      borderColor: formik.errors.projectId && formik.touched.projectId ? '#ef4444' : 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  >
                    <option value="">{t("projects.select_project") || "Select a project"}</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {formik.errors.projectId && formik.touched.projectId && (
                    <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{formik.errors.projectId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("projects.description")}
                  </label>
                  <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("projects.category")}
                    </label>
                    <select
                      name="category"
                      value={formik.values.category}
                      onChange={formik.handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                      style={{ 
                        borderColor: 'var(--border-color)', 
                        backgroundColor: 'var(--bg-color)', 
                        color: 'var(--text-color)',
                        '--tw-ring-color': 'var(--color-primary)'
                      }}
                    >
                      <option value="Technical">Technical</option>
                      <option value="Financial">Financial</option>
                      <option value="Schedule">Schedule</option>
                      <option value="Resource">Resource</option>
                      <option value="Quality">Quality</option>
                      <option value="External">External</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("projects.status")}
                    </label>
                    <select
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                      style={{ 
                        borderColor: 'var(--border-color)', 
                        backgroundColor: 'var(--bg-color)', 
                        color: 'var(--text-color)',
                        '--tw-ring-color': 'var(--color-primary)'
                      }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Mitigated">Mitigated</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("projects.probability") || "Probability"}
                    </label>
                    <select
                      name="probability"
                      value={formik.values.probability}
                      onChange={formik.handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                      style={{ 
                        borderColor: 'var(--border-color)', 
                        backgroundColor: 'var(--bg-color)', 
                        color: 'var(--text-color)',
                        '--tw-ring-color': 'var(--color-primary)'
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("projects.impact") || "Impact"}
                    </label>
                    <select
                      name="impact"
                      value={formik.values.impact}
                      onChange={formik.handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                      style={{ 
                        borderColor: 'var(--border-color)', 
                        backgroundColor: 'var(--bg-color)', 
                        color: 'var(--text-color)',
                        '--tw-ring-color': 'var(--color-primary)'
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Auto-calculated Risk Level Display */}
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--footer-bg)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                        {t("projects.calculated_risk_level") || "Calculated Risk Level"}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                        {t("projects.risk_level_calculated_automatically") || "Risk level is calculated automatically based on probability and impact"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getRiskLevelColor(currentRiskLevel)}`}
                    >
                      {currentRiskLevel}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("projects.mitigation_plan") || "Mitigation Plan"}
                  </label>
                  <textarea
                    name="mitigationPlan"
                    value={formik.values.mitigationPlan}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2"
                    style={{ 
                      borderColor: 'var(--border-color)', 
                      backgroundColor: 'var(--bg-color)', 
                      color: 'var(--text-color)',
                      '--tw-ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      formik.resetForm();
                    }}
                    className="px-4 py-2 rounded-lg transition"
                    style={{ 
                      backgroundColor: 'var(--border-color)', 
                      color: 'var(--text-color)' 
                    }}
                  >
                    {t("projects.cancel") || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading}
                    className="px-4 py-2 rounded-lg transition disabled:opacity-50"
                    style={{ 
                      backgroundColor: 'var(--color-primary)', 
                      color: 'var(--button-text)' 
                    }}
                  >
                    {createMutation.isLoading ? t("projects.creating") || "Creating..." : t("projects.create") || "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectRiskManagement;

