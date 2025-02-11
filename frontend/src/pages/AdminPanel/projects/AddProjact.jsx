// src/pages/procurement/AddProject.jsx
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { axiosInstance } from "../../../lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Add_Department from "../departments/Add_Department"; // ודא שהנתיב נכון

const AddProject = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  // נתוני המשתמש המאומת
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },
  });
  const authUser = authData?.user;

  // קבלת רשימת העובדים
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data || [];
    },
  });

  // קבלת רשימת המחלקות (כולל populated ב-teamMembers)
  const { data: departments = [], refetch: refetchDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data.data || [];
    },
    onError: (error) => {
      toast.error("Error fetching departments: " + error);
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
      teamMembers: [], // מערך מזהי עובדים
      departmentId: "", // מזהה המחלקה
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t("Project name is required")),
      startDate: Yup.date()
        .required(t("Start date is required"))
        .typeError(t("Start date must be a valid date")),
      endDate: Yup.date()
        .required(t("End date is required"))
        .min(Yup.ref("startDate"), t("End date must be after start date"))
        .typeError(t("End date must be a valid date")),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const tagsArray = values.tags
          ? values.tags.split(",").map((tag) => tag.trim())
          : [];
        const projectData = { ...values, tags: tagsArray };

        if (!projectData.departmentId) {
          toast.error(t("Please select a department"));
          setLoading(false);
          return;
        }

        const response = await axiosInstance.post("/projects", projectData);
        if (response.data.data) {
          toast.success(t("Project created successfully"));
          formik.resetForm();
          queryClient.invalidateQueries(["projects"]);
        } else {
          toast.error(response.data.message || t("Failed to create project"));
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || t("Failed to create project")
        );
      } finally {
        setLoading(false);
      }
    },
  });

  // Handler לעדכון בחירת עובדים (Team Members)
  const handleTeamMembersChange = (e) => {
    const selectedTeamMembers = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    formik.setFieldValue("teamMembers", selectedTeamMembers);
  };

  // Handler להסרת עובד מהרשימה
  const removeTeamMember = (empId) => {
    const updated = formik.values.teamMembers.filter((id) => id !== empId);
    formik.setFieldValue("teamMembers", updated);
  };

  // מציאת המחלקה הנבחרת (לפי departmentId)
  const selectedDepartment = departments.find(
    (dept) => dept._id === formik.values.departmentId
  );

  // הפקת מערך מזהי העובדים מהמחלקה – המרת כל מזהה למחרוזת
  const departmentEmployeeIds =
    selectedDepartment?.teamMembers?.map((member) => {
      if (typeof member.employeeId === "object" && member.employeeId !== null) {
        return member.employeeId._id.toString();
      }
      return member.employeeId.toString();
    }) || [];

  // סינון העובדים כך שיופיעו רק העובדים השייכים למחלקה
  const departmentEmployees = employees.filter((emp) =>
    departmentEmployeeIds.includes(emp._id.toString())
  );

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-bg p-6 rounded shadow-md w-full max-w-lg text-text">
        <h1 className="text-2xl font-bold mb-4 text-primary">
          {t("Create New Project")}
        </h1>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block mb-1 text-text">{t("Project Name")}</label>
            <input
              type="text"
              name="name"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-red-500 text-sm">{formik.errors.name}</div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-text">{t("Description")}</label>
            <textarea
              name="description"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.description}
            ></textarea>
          </div>

          {/* Dates */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block mb-1 text-text">{t("Start Date")}</label>
              <input
                type="date"
                name="startDate"
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.startDate}
              />
              {formik.touched.startDate && formik.errors.startDate && (
                <div className="text-red-500 text-sm">
                  {formik.errors.startDate}
                </div>
              )}
            </div>
            <div className="w-1/2">
              <label className="block mb-1 text-text">{t("End Date")}</label>
              <input
                type="date"
                name="endDate"
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.endDate}
              />
              {formik.touched.endDate && formik.errors.endDate && (
                <div className="text-red-500 text-sm">
                  {formik.errors.endDate}
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block mb-1 text-text">{t("Priority")}</label>
              <select
                name="priority"
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.priority}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block mb-1 text-text">{t("Budget")}</label>
            <input
              type="number"
              name="budget"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.budget}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block mb-1 text-text">
              {t("Tags (comma separated)")}
            </label>
            <input
              type="text"
              name="tags"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.tags}
            />
          </div>

          {/* Progress */}
          <div>
            <label className="block mb-1 text-text">{t("Progress (%)")}</label>
            <input
              type="number"
              name="progress"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.progress}
              min="0"
              max="100"
            />
          </div>

          {/* Department Field with Add button */}
          <div>
            <label className="block mb-1 text-text">{t("Department")}</label>
            <div className="flex items-center space-x-2">
              <select
                name="departmentId"
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.departmentId}
              >
                <option value="">{t("Select Department")}</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowDepartmentModal(true)}
                className="bg-button-bg text-button-text px-3 py-2 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* שדה בחירת העובדים – יוצג רק לאחר בחירת מחלקה */}
          {formik.values.departmentId ? (
            <div>
              <label className="block mb-1 text-text">
                {t("Team Members")}
              </label>
              <select
                multiple
                name="teamMembers"
                value={formik.values.teamMembers}
                onChange={handleTeamMembersChange}
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
              >
                {isLoadingEmployees ? (
                  <option disabled>{t("Loading...")}</option>
                ) : departmentEmployees.length > 0 ? (
                  departmentEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.lastName}
                    </option>
                  ))
                ) : (
                  <option disabled>
                    {t("No employees found in this department")}
                  </option>
                )}
              </select>
              {formik.values.teamMembers &&
                formik.values.teamMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formik.values.teamMembers.map((empId) => {
                      const employee = employees.find((e) => e._id === empId);
                      if (!employee) return null;
                      return (
                        <div
                          key={empId}
                          className="flex items-center gap-1 bg-accent text-button-text px-2 py-1 rounded"
                        >
                          <span>
                            {employee.name} {employee.lastName}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTeamMember(empId)}
                            className="text-red-600"
                          >
                            x
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          ) : (
            <p className="text-gray-600">
              {t("Please select a department to view its employees.")}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-button-bg text-button-text rounded-md hover:opacity-90 transition"
          >
            {loading ? t("Creating...") : t("Create Project")}
          </button>
        </form>
      </div>

      {/* Modal for adding a Department */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowDepartmentModal(false)}
              className="absolute top-2 right-2 text-red-600 font-bold text-xl"
            >
              &times;
            </button>
            <Add_Department
              onClose={() => {
                setShowDepartmentModal(false);
                refetchDepartments(); // רענון רשימת המחלקות לאחר הוספה חדשה
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProject;
