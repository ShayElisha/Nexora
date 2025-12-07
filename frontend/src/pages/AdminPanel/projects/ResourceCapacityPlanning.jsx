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
  const { t } = useTranslation();
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("projects.resource_capacity")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("projects.resource_capacity_description")}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("projects.total_employees")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.totalEmployees || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("projects.overloaded_employees")}
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {statistics.overloadedEmployees || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("projects.average_utilization")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.averageUtilization || 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t("projects.search_employees")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Employee Capacity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("projects.employee")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("projects.department")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("projects.weekly_capacity")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("projects.allocated_hours")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("projects.utilization")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("projects.tasks")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {t("projects.projects")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.employee._id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    emp.isOverloaded ? "bg-red-50 dark:bg-red-900/20" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {emp.isOverloaded ? (
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-green-500 mr-2" />
                      )}
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {emp.employee.name} {emp.employee.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.employee.department || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.weeklyCapacity}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.allocatedHours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            emp.utilization > 100
                              ? "bg-red-600"
                              : emp.utilization > 80
                              ? "bg-yellow-600"
                              : "bg-green-600"
                          }`}
                          style={{ width: `${Math.min(emp.utilization, 100)}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          emp.utilization > 100
                            ? "text-red-600"
                            : emp.utilization > 80
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {emp.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.tasksCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.projectsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResourceCapacityPlanning;

