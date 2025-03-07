import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa"; // Added FaTrash for delete icon

// Function to generate a random color
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Edit Department Modal Component
const EditDepartmentModal = ({ department, isOpen, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentManager: "",
    teamMembers: [],
  });
  const [employees, setEmployees] = useState([]);

  // Pre-fill form data when department changes
  useEffect(() => {
    if (department && isOpen) {
      setFormData({
        name: department.name || "",
        description: department.description || "",
        departmentManager:
          department.departmentManager?._id ||
          department.departmentManager ||
          "", // Handle both populated and non-populated cases
        teamMembers:
          department.teamMembers?.map(
            (m) => m.employeeId?._id || m.employeeId
          ) || [],
      });
    }
  }, [department, isOpen]);

  // Fetch employees for dropdowns
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        setEmployees(response.data.data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    if (isOpen) fetchEmployees();
  }, [isOpen]);

  const updateDepartmentMutation = useMutation({
    mutationFn: (data) =>
      axiosInstance.put(`/departments/${department._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast.success(t("departments.updated"));
      onClose();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("departments.error_updating")
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeamMembersChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, teamMembers: selectedOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      teamMembers: formData.teamMembers.map((id) => ({ employeeId: id })),
    };
    updateDepartmentMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">
          {t("departments.edit_department", { name: department.name })}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("departments.name")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("departments.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("departments.manager")}
            </label>
            <select
              name="departmentManager"
              value={formData.departmentManager}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">{t("departments.select_manager")}</option>
              {employees
                .filter((emp) => emp.role === "Manager")
                .map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} {emp.lastName}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("departments.team_members")}
            </label>
            <select
              name="teamMembers"
              multiple
              value={formData.teamMembers}
              onChange={handleTeamMembersChange}
              className="w-full p-2 border rounded-md h-40 overflow-y-scroll focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.lastName} - {emp.role}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
            >
              {t("departments.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
            >
              {t("departments.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DepartmentList = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [editDepartment, setEditDepartment] = useState(null);

  const {
    data: departments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/departments");
        return response.data.data;
      } catch (err) {
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (departmentId) =>
      axiosInstance.delete(`/departments/${departmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast.success(t("departments.deleted"));
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("departments.error_deleting")
      );
    },
  });

  const filteredDepartments = departments.filter((dept) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    const searchableString = [
      dept.name || "",
      dept.description || "",
      dept.departmentManager?.name || dept.departmentManager?.toString() || "",
      dept.teamMembers
        ?.map(
          (member) =>
            `${member.employeeId?.name} ${member.employeeId?.lastName}`
        )
        .join(" ") || "",
      dept.projects
        ?.map((proj) => proj.projectId?.name || "")
        .filter(Boolean)
        .join(" ") || "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableString.includes(searchLower);
  });

  const handleRowClick = (dept) => {
    setSelectedRow(selectedRow === dept._id ? null : dept._id);
  };

  const handleDelete = (departmentId) => {
    if (window.confirm(t("departments.confirm_delete"))) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  const handleEdit = (dept) => {
    setEditDepartment(dept);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800 flex justify-center items-start py-8">
      <div className="w-4/5 p-6 rounded-xl shadow-md border border-gray-200 bg-white">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-600">
          {t("departments.department_list")}
        </h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder={t("departments.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600 animate-pulse">
              {t("departments.loading")}
            </p>
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center h-64 text-red-500 font-medium">
            {error?.message || t("departments.failed_to_load_departments")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-gray-700 rounded-xl overflow-hidden text-center border border-gray-200">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-3 px-4">{t("departments.name")}</th>
                  <th className="py-3 px-4">{t("departments.description")}</th>
                  <th className="py-3 px-4">{t("departments.manager")}</th>
                  <th className="py-3 px-4">{t("departments.team_members")}</th>
                  <th className="py-3 px-4">{t("departments.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 px-4 text-center text-gray-500 italic"
                    >
                      {searchTerm
                        ? t("departments.no_departments_match")
                        : t("departments.no_departments")}
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => {
                    const initial = (dept.name || "D")[0].toUpperCase();
                    const backgroundColor = getRandomColor();

                    return (
                      <>
                        <tr
                          key={dept._id}
                          className="border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => handleRowClick(dept)}
                        >
                          <td className="py-3 px-4">
                            <div
                              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
                              style={{ backgroundColor }}
                            >
                              {initial}
                            </div>
                            <span className="block mt-2">
                              {dept.name || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {dept.description || "-"}
                          </td>
                          <td className="py-3 px-4">
                            {dept.departmentManager
                              ? `${dept.departmentManager.name} ${dept.departmentManager.lastName}`
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {dept.teamMembers && dept.teamMembers.length > 0
                              ? dept.teamMembers
                                  .map((member) =>
                                    `${member.employeeId?.name || ""} ${
                                      member.employeeId?.lastName || ""
                                    }`.trim()
                                  )
                                  .filter(Boolean)
                                  .join(", ") || "-"
                              : t("departments.no_team_members")}
                          </td>
                          <td className="py-3 px-4 flex gap-2 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(dept);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(dept._id);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                        {selectedRow === dept._id && (
                          <tr>
                            <td colSpan={5} className="py-2 px-4 bg-gray-50">
                              <div className="flex flex-col gap-2">
                                <div>
                                  <strong>{t("departments.projects")}:</strong>{" "}
                                  {dept.projects && dept.projects.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                      {dept.projects.map((proj, idx) => (
                                        <li key={idx}>
                                          {proj.projectId?.name || "-"}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    t("departments.no_projects")
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <EditDepartmentModal
          department={editDepartment}
          isOpen={!!editDepartment}
          onClose={() => setEditDepartment(null)}
        />
      </div>
    </div>
  );
};

export default DepartmentList;
