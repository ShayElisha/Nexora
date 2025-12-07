import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axiosInstance from "../../../lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Add_Department from "../departments/Add_Department";
import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Tag,
  FileText,
  Building2,
  User,
  Plus,
  X,
  Loader2,
  CheckCircle
} from "lucide-react";

const AddProject = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  const { data: authData } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },
  });
  const authUser = authData?.user;

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data || [];
    },
  });

  const { data: departments = [], refetch: refetchDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data.data || [];
    },
    onError: (error) => {
      toast.error(t("project.error_fetch_departments") + error);
    },
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: 0,
      priority: "Medium",
      tags: "",
      progress: 0,
      teamMembers: [],
      departmentId: "",
      projectManager: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t("project.name_required")),
      startDate: Yup.date()
        .required(t("project.start_date_required"))
        .typeError(t("project.start_date_invalid")),
      endDate: Yup.date()
        .required(t("project.end_date_required"))
        .min(Yup.ref("startDate"), t("project.end_date_after_start"))
        .typeError(t("project.end_date_invalid")),
      projectManager: Yup.string().required(
        t("project.project_manager_required")
      ),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const tagsArray = values.tags
          ? values.tags.split(",").map((tag) => tag.trim())
          : [];
        const projectData = { ...values, tags: tagsArray };

        if (!projectData.departmentId) {
          toast.error(t("project.department_required"));
          setLoading(false);
          return;
        }

        const response = await axiosInstance.post("/projects", projectData);
        if (response.data.data) {
          toast.success(t("project.success_create"));
          formik.resetForm();
          queryClient.invalidateQueries(["projects"]);
        } else {
          toast.error(response.data.message || t("project.error_create"));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || t("project.error_create"));
      } finally {
        setLoading(false);
      }
    },
  });

  const handleTeamMembersChange = (e) => {
    const selectedTeamMembers = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    formik.setFieldValue("teamMembers", selectedTeamMembers);
  };

  const removeTeamMember = (empId) => {
    const updated = formik.values.teamMembers.filter((id) => id !== empId);
    formik.setFieldValue("teamMembers", updated);
  };

  const selectedDepartment = departments.find(
    (dept) => dept._id === formik.values.departmentId
  );

  const departmentEmployeeIds =
    selectedDepartment?.teamMembers?.map((member) => {
      if (typeof member.employeeId === "object" && member.employeeId !== null) {
        return member.employeeId._id.toString();
      }
      return member.employeeId.toString();
    }) || [];

  const departmentEmployees = employees.filter((emp) =>
    departmentEmployeeIds.includes(emp._id.toString())
  );

  const projectManagers = departmentEmployees.filter(
    (emp) => emp.role && ["manager", "admin"].includes(emp.role.toLowerCase())
  );

  const progressPercentage = () => {
    const totalFields = 9;
    let filledFields = 0;
    if (formik.values.name) filledFields++;
    if (formik.values.description) filledFields++;
    if (formik.values.startDate) filledFields++;
    if (formik.values.endDate) filledFields++;
    if (formik.values.budget > 0) filledFields++;
    if (formik.values.priority) filledFields++;
    if (formik.values.departmentId) filledFields++;
    if (formik.values.projectManager) filledFields++;
    if (formik.values.teamMembers.length > 0) filledFields++;
    return Math.round((filledFields / totalFields) * 100);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Plus size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("project.create_title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("project.create_new_project")}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: 'var(--text-color)' }}>
                {t("project.form_progress")}
              </span>
              <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                {progressPercentage()}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 lg:p-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Briefcase className="inline mr-2" size={16} />
                {t("project.name")} *
              </label>
              <input
                type="text"
                name="name"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                placeholder={t("project.enter_project_name")}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <FileText className="inline mr-2" size={16} />
                {t("project.description")}
              </label>
              <textarea
                name="description"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.description}
                rows="4"
                placeholder={t("project.enter_description")}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={16} />
                  {t("project.start_date")} *
                </label>
                <input
                  type="date"
                  name="startDate"
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.startDate}
                />
                {formik.touched.startDate && formik.errors.startDate && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.startDate}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={16} />
                  {t("project.end_date")} *
                </label>
                <input
                  type="date"
                  name="endDate"
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.endDate}
                />
                {formik.touched.endDate && formik.errors.endDate && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.endDate}
                  </div>
                )}
              </div>
            </div>

            {/* Priority & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Target className="inline mr-2" size={16} />
                  {t("project.priority")}
                </label>
                <select
                  name="priority"
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.priority}
                >
                  <option value="Low">{t("project.priority_low")}</option>
                  <option value="Medium">{t("project.priority_medium")}</option>
                  <option value="High">{t("project.priority_high")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <DollarSign className="inline mr-2" size={16} />
                  {t("project.budget")}
                </label>
                <input
                  type="number"
                  name="budget"
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.budget}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Tags & Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Tag className="inline mr-2" size={16} />
                  {t("project.tags")}
                </label>
                <input
                  type="text"
                  name="tags"
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.tags}
                  placeholder={t("project.tags_placeholder")}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("project.tags_hint")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <TrendingUp className="inline mr-2" size={16} />
                  {t("project.progress")} ({formik.values.progress}%)
                </label>
                <input
                  type="range"
                  name="progress"
                  className="w-full"
                  style={{ accentColor: 'var(--color-primary)' }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.progress}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Building2 className="inline mr-2" size={16} />
                {t("project.department")} *
              </label>
              <div className="flex items-center gap-2">
                <select
                  name="departmentId"
                  className="flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.departmentId}
                >
                  <option value="">{t("project.select_department")}</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowDepartmentModal(true)}
                  className="p-3 rounded-xl font-bold transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                  title={t("project.add_department")}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Project Manager */}
            {formik.values.departmentId && (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <User className="inline mr-2" size={16} />
                  {t("project.project_manager")} *
                </label>
                <select
                  name="projectManager"
                  value={formik.values.projectManager}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                  <option value="">
                    {t("project.select_project_manager")}
                  </option>
                  {projectManagers.length > 0 ? (
                    projectManagers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name} {manager.lastName}
                      </option>
                    ))
                  ) : (
                    <option disabled>
                      {t("project.no_project_managers")}
                    </option>
                  )}
                </select>
                {formik.touched.projectManager && formik.errors.projectManager && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.projectManager}
                  </div>
                )}
              </div>
            )}

            {/* Team Members */}
            {formik.values.departmentId ? (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Users className="inline mr-2" size={16} />
                  {t("project.team_members")}
                </label>
                <select
                  multiple
                  name="teamMembers"
                  value={formik.values.teamMembers}
                  onChange={handleTeamMembersChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 h-32"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                  {isLoadingEmployees ? (
                    <option disabled>{t("project.loading_employees")}</option>
                  ) : departmentEmployees.length > 0 ? (
                    departmentEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.lastName} - {emp.role}
                      </option>
                    ))
                  ) : (
                    <option disabled>{t("project.no_employees_found")}</option>
                  )}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("project.team_members_hint")}
                </p>
                {formik.values.teamMembers && formik.values.teamMembers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formik.values.teamMembers.map((empId) => {
                      const employee = employees.find((e) => e._id === empId);
                      if (!employee) return null;
                      return (
                        <motion.div
                          key={empId}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <span className="text-sm font-medium">
                            {employee.name} {employee.lastName} - {employee.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTeamMember(empId)}
                            className="hover:scale-110 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                <Building2 size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                <p style={{ color: 'var(--color-secondary)' }}>
                  {t("project.please_select_department")}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  {t("project.creating")}
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  {t("project.submit")}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Department Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <motion.div
            className="rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-color)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <button
              type="button"
              onClick={() => setShowDepartmentModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:scale-110 transition-all"
              style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
            >
              <X size={20} />
            </button>
            <Add_Department
              onClose={() => {
                setShowDepartmentModal(false);
                refetchDepartments();
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AddProject;
