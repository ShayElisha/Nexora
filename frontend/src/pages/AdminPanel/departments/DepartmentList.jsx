import { useState, useEffect } from "react";
import React from "react"; // ייבוא מפורש של React עבור React.Fragment
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaExclamationTriangle,
} from "react-icons/fa";

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

  useEffect(() => {
    if (department && isOpen) {
      setFormData({
        name: department.name || "",
        description: department.description || "",
        departmentManager:
          department.departmentManager?._id ||
          department.departmentManager ||
          "",
        teamMembers:
          department.teamMembers?.map(
            (m) => m.employeeId?._id || m.employeeId
          ) || [],
      });
    }
  }, [department, isOpen]);

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
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-500 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border-color transform transition-all duration-300 scale-95 hover:scale-100">
        <h2 className="text-2xl font-bold text-text mb-6 tracking-tight drop-shadow-sm">
          {t("departments.edit_department", { name: department.name })}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-slide-up">
            <label className="block mb-2 text-text font-semibold">
              {t("departments.name")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text placeholder-gray-400 shadow-sm hover:shadow-md"
              required
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <label className="block mb-2 text-text font-semibold">
              {t("departments.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text placeholder-gray-400 shadow-sm hover:shadow-md resize-none"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <label className="block mb-2 text-text font-semibold">
              {t("departments.manager")}
            </label>
            <select
              name="departmentManager"
              value={formData.departmentManager}
              onChange={handleChange}
              className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text shadow-sm hover:shadow-md"
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
          <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
            <label className="block mb-2 text-text font-semibold">
              {t("departments.team_members")}
            </label>
            <select
              name="teamMembers"
              multiple
              value={formData.teamMembers}
              onChange={handleTeamMembersChange}
              className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text shadow-sm hover:shadow-md h-40"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.lastName} - {emp.role}
                </option>
              ))}
            </select>
          </div>
          <div
            className="flex justify-end gap-4 animate-slide-up"
            style={{ animationDelay: "400ms" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-secondary to-primary text-button-text rounded-full hover:bg-secondary transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              {t("departments.cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-button-bg to-accent text-button-text rounded-full hover:bg-accent transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
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
    <div className="container mx-auto p-8 bg-gradient-to-br from-bg to-bg min-h-screen animate-fade-in">
      <h1 className="text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
        {t("departments.department_list")}
      </h1>

      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder={t("departments.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 border border-border-color rounded-full shadow-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-white text-text placeholder-gray-400"
          />
          <FaSearch
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary"
            size={20}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-text animate-pulse text-lg">
            {t("departments.loading")}
          </p>
        </div>
      ) : isError ? (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-lg animate-slide-in max-w-2xl mx-auto">
          <p className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            {error?.message || t("departments.failed_to_load_departments")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-2xl rounded-xl bg-white transform transition-all duration-500 hover:shadow-3xl">
          <table className="min-w-full text-text">
            <thead className="bg-gradient-to-r from-primary to-secondary text-button-text">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("departments.name")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("departments.description")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("departments.manager")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("departments.team_members")}
                </th>
                <th className="py-4 px-6 text-center text-sm font-bold tracking-wider">
                  {t("departments.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 px-4 text-center text-text italic animate-fade-in"
                  >
                    {searchTerm
                      ? t("departments.no_departments_match")
                      : t("departments.no_departments")}
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept, index) => {
                  const initial = (dept.name || "D")[0].toUpperCase();
                  const backgroundColor = getRandomColor();

                  return (
                    <React.Fragment key={dept._id}>
                      <tr
                        className={`border-b transition-all duration-300 ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-accent hover:shadow-inner animate-slide-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleRowClick(dept)}
                      >
                        <td className="py-4 px-6">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
                            style={{ backgroundColor }}
                          >
                            {initial}
                          </div>
                          <span className="block mt-2 font-medium">
                            {dept.name || "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6">{dept.description || "-"}</td>
                        <td className="py-4 px-6">
                          {dept.departmentManager
                            ? `${dept.departmentManager.name} ${dept.departmentManager.lastName}`
                            : "-"}
                        </td>
                        <td className="py-4 px-6">
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
                        <td className="py-4 px-6 flex gap-3 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(dept);
                            }}
                            className="text-primary hover:text-secondary transition-all duration-200 transform hover:scale-125 hover:rotate-6"
                            title={t("departments.edit")}
                          >
                            <FaEdit size={24} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(dept._id);
                            }}
                            className="text-red-600 hover:text-red-800 transition-all duration-200 transform hover:scale-125 hover:rotate-6"
                            title={t("departments.delete")}
                          >
                            <FaTrash size={24} />
                          </button>
                        </td>
                      </tr>
                      {selectedRow === dept._id && (
                        <tr className="bg-gray-50 animate-slide-up">
                          <td colSpan={5} className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              <div>
                                <strong className="text-text">
                                  {t("departments.projects")}:
                                </strong>{" "}
                                {dept.projects && dept.projects.length > 0 ? (
                                  <ul className="list-disc list-inside text-text">
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
                    </React.Fragment>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        .animate-slide-in { animation: slideIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default DepartmentList;
