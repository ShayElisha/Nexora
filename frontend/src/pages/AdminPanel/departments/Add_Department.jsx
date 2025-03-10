import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle } from "react-icons/fa";

const Add_Department = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
    teamMembers: [],
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        if (response.data && response.data.data) {
          setEmployees(response.data.data);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError(t("addDepartment.fetchError"));
      }
    };
    fetchEmployees();
  }, [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeamMembersChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      teamMembers: selectedOptions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...formData,
        teamMembers: formData.teamMembers.map((id) => ({ employeeId: id })),
      };
      await axiosInstance.post("/departments", payload);
      toast.success(t("addDepartment.success"));
      setFormData({
        name: "",
        description: "",
        managerId: "",
        teamMembers: [],
      });
    } catch (error) {
      console.error("Error creating department:", error);
      setError(t("addDepartment.error"));
      toast.error(t("addDepartment.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-bg to-bg min-h-screen animate-fade-in">
      <h2 className="text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
        {t("addDepartment.title")}
      </h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-lg animate-slide-in max-w-2xl mx-auto">
          <p className="flex items-center">
            <FaExclamationTriangle className="mr-2" /> {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        {/* שדה שם המחלקה */}
        <div className="animate-slide-up">
          <label htmlFor="name" className="block mb-2 text-text font-semibold">
            {t("addDepartment.nameLabel")}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text placeholder-gray-400 shadow-sm hover:shadow-md"
          />
        </div>

        {/* שדה תיאור */}
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <label
            htmlFor="description"
            className="block mb-2 text-text font-semibold"
          >
            {t("addDepartment.descriptionLabel")}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text placeholder-gray-400 shadow-sm hover:shadow-md resize-none"
          />
        </div>

        {/* שדה מנהל מחלקה */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <label
            htmlFor="managerId"
            className="block mb-2 text-text font-semibold"
          >
            {t("addDepartment.managerLabel")}
          </label>
          <select
            id="managerId"
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
            required
            className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text shadow-sm hover:shadow-md"
          >
            <option value="">{t("addDepartment.selectManager")}</option>
            {employees
              .filter((employee) => employee.role === "Manager")
              .map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} {employee.lastName}
                </option>
              ))}
          </select>
        </div>

        {/* בחירת חברי צוות */}
        <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <label
            htmlFor="teamMembers"
            className="block mb-2 text-text font-semibold"
          >
            {t("addDepartment.teamMembersLabel")}
          </label>
          <select
            id="teamMembers"
            name="teamMembers"
            multiple
            value={formData.teamMembers}
            onChange={handleTeamMembersChange}
            className="w-full p-4 border border-border-color rounded-lg focus:ring-4 focus:ring-primary focus:border-primary transition-all duration-300 bg-white text-text shadow-sm hover:shadow-md h-40"
          >
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name} {employee.lastName} - {employee.role}
              </option>
            ))}
          </select>
          <p className="text-sm text-text mt-1 opacity-70">
            {t(
              "addDepartment.teamMembersHint",
              "החזק Ctrl/Cmd לבחירת מספר עובדים"
            )}
          </p>
        </div>

        {/* כפתור שליחה */}
        <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-4 rounded-full text-button-text font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              loading
                ? "bg-button-bg opacity-60 cursor-not-allowed"
                : "bg-gradient-to-r from-button-bg to-accent"
            }`}
          >
            {loading
              ? t("addDepartment.creating")
              : t("addDepartment.submitButton")}
          </button>
        </div>
      </form>

      {/* אנימציות מותאמות */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Add_Department;
