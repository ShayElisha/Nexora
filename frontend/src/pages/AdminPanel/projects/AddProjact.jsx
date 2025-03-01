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

  // שליפת נתוני המשתמש המאומת
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
      toast.error(t("project.error_fetch_departments") + error);
    },
  });

  // הוספת שדה projectManager לאתחול הטופס
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
      projectManager: "", // מזהה מנהל הפרויקט
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
      // ניתן להוסיף ולוודא גם בחירה של מנהל פרויקט
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

  // סינון מנהלי הפרויקט מתוך העובדים במחלקה – נניח שהערך ב־emp.role הוא "Manager"
  const projectManagers = departmentEmployees.filter(
    (emp) => emp.role && emp.role.toLowerCase() === "manager"
  );
  console.log("projectManagers", projectManagers);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-bg p-6 rounded shadow-md w-full max-w-lg text-text">
        <h1 className="text-2xl font-bold mb-4 text-primary">
          {t("project.create_title")}
        </h1>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* שם הפרויקט */}
          <div>
            <label className="block mb-1 text-text">{t("project.name")}</label>
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

          {/* שדה בחירת מנהל פרויקט – מוצג רק כאשר נבחרה מחלקה */}
          {formik.values.departmentId && (
            <div className="mb-4">
              <label htmlFor="projectManager" className="block mb-1 text-text">
                {t("project.project_manager", "מנהל פרויקט:")}
              </label>
              <select
                id="projectManager"
                name="projectManager"
                value={formik.values.projectManager}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
              >
                <option value="">
                  {t("project.select_project_manager", "בחר מנהל פרויקט")}
                </option>
                {projectManagers.length > 0 ? (
                  projectManagers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.name} {manager.lastName}
                    </option>
                  ))
                ) : (
                  <option disabled>
                    {t(
                      "project.no_project_managers",
                      "אין מנהלי פרויקט זמינים"
                    )}
                  </option>
                )}
              </select>
              {formik.touched.projectManager &&
                formik.errors.projectManager && (
                  <div className="text-red-500 text-sm">
                    {formik.errors.projectManager}
                  </div>
                )}
            </div>
          )}

          {/* תיאור */}
          <div>
            <label className="block mb-1 text-text">
              {t("project.description")}
            </label>
            <textarea
              name="description"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.description}
            ></textarea>
          </div>

          {/* תאריכים */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block mb-1 text-text">
                {t("project.start_date")}
              </label>
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
              <label className="block mb-1 text-text">
                {t("project.end_date")}
              </label>
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

          {/* עדיפות */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block mb-1 text-text">
                {t("project.priority")}
              </label>
              <select
                name="priority"
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.priority}
              >
                <option value="Low">{t("project.priority_low")}</option>
                <option value="Medium">{t("project.priority_medium")}</option>
                <option value="High">{t("project.priority_high")}</option>
              </select>
            </div>
          </div>

          {/* תקציב */}
          <div>
            <label className="block mb-1 text-text">
              {t("project.budget")}
            </label>
            <input
              type="number"
              name="budget"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.budget}
            />
          </div>

          {/* תגיות */}
          <div>
            <label className="block mb-1 text-text">{t("project.tags")}</label>
            <input
              type="text"
              name="tags"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.tags}
            />
          </div>

          {/* התקדמות */}
          <div>
            <label className="block mb-1 text-text">
              {t("project.progress")}
            </label>
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

          {/* שדה מחלקה עם כפתור הוספה */}
          <div>
            <label className="block mb-1 text-text">
              {t("project.department")}
            </label>
            <div className="flex items-center space-x-2">
              <select
                name="departmentId"
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
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
                className="bg-button-bg text-button-text px-3 py-2 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* שדה בחירת עובדים – יוצג רק לאחר בחירת מחלקה */}
          {formik.values.departmentId ? (
            <div>
              <label className="block mb-1 text-text">
                {t("project.team_members")}
              </label>
              <select
                multiple
                name="teamMembers"
                value={formik.values.teamMembers}
                onChange={handleTeamMembersChange}
                className="w-full border border-border-color p-2 rounded bg-bg text-text"
              >
                {isLoadingEmployees ? (
                  <option disabled>{t("project.loading_employees")}</option>
                ) : departmentEmployees.length > 0 ? (
                  departmentEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.lastName}-{emp.role}
                    </option>
                  ))
                ) : (
                  <option disabled>{t("project.no_employees_found")}</option>
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
                            {employee.name} {employee.lastName}-{employee.role}
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
              {t("project.please_select_department")}
            </p>
          )}

          {/* כפתור שליחה */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-button-bg text-button-text rounded-md hover:opacity-90 transition"
          >
            {loading ? t("project.creating") : t("project.submit")}
          </button>
        </form>
      </div>

      {/* מודל להוספת מחלקה */}
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
