import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  UserCheck,
  UserX,
} from "lucide-react";

const ResourceCapacityPlanning = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["resourceCapacity"],
    queryFn: async () => {
      const res = await axiosInstance.get("/projects/resources/capacity");
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
        {t("projects.error_loading") || "Error loading resource capacity"}
      </div>
    );
  }

  const { employeeCapacity = [], statistics = {} } = data || {};

  const filteredEmployees = employeeCapacity.filter((emp) => {
    const fullName = `${emp.employee.name} ${emp.employee.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
      emp.employee.department?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
          <Users size={28} color="white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
            {t("projects.resource_capacity")}
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
            {t("projects.resource_capacity_description")}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 shadow-lg border"
          style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.total_employees")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                {statistics.totalEmployees || 0}
              </p>
            </div>
            <Users className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 shadow-lg border"
          style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.overloaded_employees")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>
                {statistics.overloadedEmployees || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8" style={{ color: '#ef4444' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 shadow-lg border"
          style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("projects.average_utilization")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                {statistics.averageUtilization || 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
          <input
            type="text"
            placeholder={t("projects.search_employees")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 ps-10 pe-4 border rounded-xl focus:ring-2"
            style={{ 
              borderColor: 'var(--border-color)', 
              backgroundColor: 'var(--bg-color)', 
              color: 'var(--text-color)',
              '--tw-ring-color': 'var(--color-primary)'
            }}
          />
        </div>
      </div>

      {/* Employee Capacity Table */}
      <div className="rounded-2xl border overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th className={`px-6 py-3 text-xs font-medium uppercase ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                  {t("projects.employee")}
                </th>
                <th className={`px-6 py-3 text-xs font-medium uppercase ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                  {t("projects.department")}
                </th>
                <th className={`px-6 py-3 text-xs font-medium uppercase ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                  {t("projects.weekly_capacity")}
                </th>
                <th className={`px-6 py-3 text-xs font-medium uppercase ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                  {t("projects.allocated_hours")}
                </th>
                <th className={`px-6 py-3 text-xs font-medium uppercase ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                  {t("projects.utilization")}
                </th>
                <th className={`px-6 py-3 text-xs font-medium uppercase ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                  {t("projects.tasks")}
                </th>
                <th className={`px-6 py-3 text-xs font-medium uppercase ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                  {t("projects.projects")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.employee._id}
                  className="hover:opacity-80"
                  style={emp.isOverloaded ? { backgroundColor: 'rgba(239, 68, 68, 0.1)' } : {}}
                >
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse ml-auto' : ''}`} style={{ width: isRTL ? 'fit-content' : 'auto', marginLeft: isRTL ? 'auto' : '0' }}>
                      {emp.isOverloaded ? (
                        <AlertTriangle className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} style={{ color: '#ef4444' }} />
                      ) : (
                        <UserCheck className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} style={{ color: 'var(--color-accent)' }} />
                      )}
                      <div className="text-sm font-medium" dir="ltr" style={{ color: 'var(--text-color)', textAlign: 'left' }}>
                        {emp.employee.name} {emp.employee.lastName}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                    {emp.employee.department || "-"}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                    {emp.weeklyCapacity}h
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                    {emp.allocatedHours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-full rounded-full h-2 ${isRTL ? 'ml-2' : 'mr-2'}`} style={{ backgroundColor: 'var(--border-color)' }}>
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(emp.utilization, 100)}%`,
                            backgroundColor: emp.utilization > 100
                              ? "#ef4444"
                              : emp.utilization > 80
                              ? "#f59e0b"
                              : "var(--color-accent)"
                          }}
                        ></div>
                      </div>
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: emp.utilization > 100
                            ? "#ef4444"
                            : emp.utilization > 80
                            ? "#f59e0b"
                            : "var(--color-accent)"
                        }}
                      >
                        {emp.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                    {emp.tasksCount}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                    {emp.projectsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ResourceCapacityPlanning;

