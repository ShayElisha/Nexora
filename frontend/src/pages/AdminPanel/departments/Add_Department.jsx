import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Building2,
  User,
  Users,
  FileText,
  Plus,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

const Add_Department = ({ onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentManager: "",
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

  const removeTeamMember = (empId) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((id) => id !== empId),
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
        departmentManager: "",
        teamMembers: [],
      });
      if (onClose) onClose();
    } catch (error) {
      console.error("Error creating department:", error);
      setError(t("addDepartment.error"));
      toast.error(t("addDepartment.error"));
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = () => {
    const totalFields = 4;
    let filledFields = 0;
    if (formData.name) filledFields++;
    if (formData.description) filledFields++;
    if (formData.departmentManager) filledFields++;
    if (formData.teamMembers.length > 0) filledFields++;
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
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
            >
              <Plus size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("addDepartment.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("addDepartment.create_new_department")}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: 'var(--text-color)' }}>
                {t("addDepartment.form_progress")}
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

        {/* Error Message */}
        {error && (
          <motion.div
            className="p-4 rounded-xl mb-6 flex items-center gap-3 border-2 border-red-500 bg-red-50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AlertCircle size={24} className="text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 lg:p-8"
          style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                <Building2 className="inline me-2" size={16} />
                {t("addDepartment.nameLabel")}
                <span className="text-red-500 ms-1">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("addDepartment.enter_name")}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                <FileText className="inline me-2" size={16} />
                {t("addDepartment.descriptionLabel")}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("addDepartment.enter_description")}
              />
            </div>

            {/* Department Manager */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                <User className="inline me-2" size={16} />
                {t("addDepartment.managerLabel")}
                <span className="text-red-500 ms-1">*</span>
              </label>
              <select
                name="departmentManager"
                value={formData.departmentManager}
                onChange={handleChange}
                required
                className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              >
                <option value="">{t("addDepartment.selectManager")}</option>
                {employees
                  .filter(
                    (employee) =>
                      employee.role === "Manager" || employee.role === "Admin"
                  )
                  .map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name} {employee.lastName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                <Users className="inline me-2" size={16} />
                {t("addDepartment.teamMembersLabel")}
              </label>
              <select
                name="teamMembers"
                multiple
                value={formData.teamMembers}
                onChange={handleTeamMembersChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 h-40"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              >
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} {employee.lastName} - {employee.role}
                  </option>
                ))}
              </select>
              <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>
                {t("addDepartment.teamMembersHint")}
              </p>

              {/* Selected Team Members */}
              {formData.teamMembers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.teamMembers.map((empId) => {
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
                          {employee.name} {employee.lastName}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(empId)}
                          className="hover:scale-110 transition-all"
                        >
                          <AlertCircle size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 h-11 rounded-lg font-medium shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {t("addDepartment.creating")}
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    {t("addDepartment.submitButton")}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Add_Department;
