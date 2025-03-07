import  { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";

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

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data;
    },
    enabled: isOpen,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (project && isOpen && !isTeamModal) {
      const today = new Date();
      const startDate = new Date(project.startDate);
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
          project.teamMembers?.map((m) => m.employeeId._id || m.employeeId) ||
          [],
      });
    }
  }, [project, isOpen, isTeamModal, reset]);

  const updateProjectMutation = useMutation({
    mutationFn: (data) => axiosInstance.put(`/projects/${project._id}`, data),
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

    // Manual validation
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
        ? member.employeeId._id.toString()
        : member.employeeId.toString()
    ) || [];
  const departmentEmployees = employees.filter((emp) =>
    departmentEmployeeIds.includes(emp._id.toString())
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-xl">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {isTeamModal
            ? t("projects.team_members")
            : t("projects.edit_project")}
        </h2>
        {isTeamModal ? (
          <div className="space-y-4">
            {project.teamMembers?.length > 0 ? (
              <ul className="space-y-3">
                {project.teamMembers.map((member, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <span>
                      {member.employeeId.name} {member.employeeId.lastName}
                    </span>
                    <button
                      onClick={() => {
                        toast.success(
                          t("projects.member_removed", {
                            name: `${member.employeeId.name} ${member.employeeId.lastName}`,
                          })
                        );
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      {t("projects.remove")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">{t("projects.no_team_members")}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text">
                {t("projects.name")}
              </label>
              <input
                {...register("name", { required: true })}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
              {errors.name && (
                <div className="text-red-500 text-sm">
                  {t("project.name_required")}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("projects.description")}
              </label>
              <textarea
                {...register("description")}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("projects.start")}
                </label>
                <input
                  type="date"
                  {...register("startDate", { required: true })}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.startDate && (
                  <div className="text-red-500 text-sm">
                    {t("project.start_date_required")}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text">
                  {t("projects.end")}
                </label>
                <input
                  type="date"
                  {...register("endDate", { required: true })}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.endDate && (
                  <div className="text-red-500 text-sm">
                    {t("project.end_date_required")}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("projects.budget")}
              </label>
              <input
                type="number"
                {...register("budget", { min: 0 })}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("projects.priority")}
              </label>
              <select
                {...register("priority")}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="Low">{t("project.priority_low")}</option>
                <option value="Medium">{t("project.priority_medium")}</option>
                <option value="High">{t("project.priority_high")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("projects.progress")}
              </label>
              <input
                type="number"
                {...register("progress", { min: 0, max: 100 })}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("projects.tags")}
              </label>
              <input
                {...register("tags")}
                placeholder={t("projects.tags_placeholder")}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("projects.tags_hint")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                {t("projects.department")}
              </label>
              <select
                {...register("departmentId", { required: true })}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">{t("project.select_department")}</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <div className="text-red-500 text-sm">
                  {t("project.department_required")}
                </div>
              )}
            </div>
            {departmentId ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-text">
                    {t("projects.project_manager")}
                  </label>
                  <select
                    {...register("projectManager", { required: true })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
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
                    <div className="text-red-500 text-sm">
                      {t("project.project_manager_required")}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text">
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
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none h-32"
                      >
                        {departmentEmployees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} {emp.lastName || ""} - {emp.role}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("projects.team_members_hint")}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-600">
                {t("project.please_select_department")}
              </p>
            )}
            <div className="space-y-2">
              <p className="text-sm">
                <strong>{t("projects.company")}:</strong>{" "}
                {project.companyId?.name || project.companyId}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
              >
                {t("projects.close")}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
              >
                {t("projects.save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ProjectsList = () => {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

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
        const startDate = new Date(project.startDate);
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

  if (isLoading)
    return (
      <div className="text-center p-6 text-text animate-pulse">
        {t("projects.loading")}
      </div>
    );
  if (isError)
    return (
      <div className="text-center p-6 text-red-500 font-medium">
        {t("projects.error_loading")}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-b from-gray-50 to-white text-gray-800">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-600">
        {t("projects.title")}
      </h1>
      {projects.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          {t("projects.no_projects")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project._id}
              className="rounded-xl shadow-md overflow-hidden flex flex-col border border-gray-200 bg-white transition-transform hover:scale-105 hover:shadow-lg"
            >
              <div className="p-5 border-b border-gray-200 bg-blue-50">
                <h2 className="text-xl font-semibold text-blue-700">
                  {project.name}
                </h2>
              </div>
              <div className="p-5 flex-grow">
                <p className="mb-3 text-gray-600 line-clamp-2">
                  {project.description || t("projects.no_description")}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p>
                      <strong>{t("projects.company")}:</strong>{" "}
                      {project.companyId?.name || project.companyId}
                    </p>
                    <p>
                      <strong>{t("projects.department")}:</strong>{" "}
                      {project.departmentId?.name ||
                        t("projects.not_available")}
                    </p>
                    <p>
                      <strong>{t("projects.start")}:</strong>{" "}
                      {project.startDate
                        ? format(new Date(project.startDate), "MMM d, yyyy")
                        : t("projects.not_available")}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>{t("projects.project_manager")}:</strong>{" "}
                      {project.projectManager?.name
                        ? `${project.projectManager.name} ${
                            project.projectManager.lastName || ""
                          }`
                        : project.projectManager || t("projects.not_available")}
                    </p>
                    <p>
                      <strong>{t("projects.status")}:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          project.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {project.status}
                      </span>
                    </p>
                    <p>
                      <strong>{t("projects.budget")}:</strong> ${project.budget}
                    </p>
                    <p>
                      <strong>{t("projects.progress")}:</strong>{" "}
                      <span className="relative inline-block w-full h-2 bg-gray-200 rounded">
                        <span
                          className="absolute h-full bg-blue-500 rounded"
                          style={{ width: `${project.progress}%` }}
                        />
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setShowTeamModal(true);
                  }}
                  className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  title={t("projects.view_team")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setShowTeamModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t("projects.edit")}
                </button>
              </div>
            </div>
          ))}
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
  );
};

export default ProjectsList;
