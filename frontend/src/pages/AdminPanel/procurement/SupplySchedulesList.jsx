import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Truck,
  Package,
  Filter,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

const SupplySchedulesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: schedules = [], isLoading, isError } = useQuery({
    queryKey: ["supply-schedules"],
    queryFn: async () => {
      const res = await axiosInstance.get("/procurement-advanced/supply-schedules");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/procurement-advanced/supply-schedules/${id}`);
    },
    onSuccess: () => {
      toast.success(t("procurement.schedule_deleted") || "Schedule deleted successfully");
      queryClient.invalidateQueries(["supply-schedules"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete schedule");
    },
  });

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.scheduleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || schedule.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: "bg-gray-100 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      "Partially Delivered": "bg-yellow-100 text-yellow-800",
      Delivered: "bg-green-100 text-green-800",
      Delayed: "bg-red-100 text-red-800",
      Cancelled: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("procurement.loading") || "Loading..."}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("procurement.error_loading_schedules") || "Error loading schedules"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.supply_schedules") || "Supply Schedules"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("procurement.supply_schedules_description") || "Manage and track supply schedules"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/procurement/supply-schedules/add")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("procurement.add_schedule") || "Add Schedule"}
          </button>
        </div>

        <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("procurement.search_schedules") || "Search schedules..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_statuses") || "All Statuses"}</option>
              <option value="Scheduled">{t("procurement.scheduled") || "Scheduled"}</option>
              <option value="In Progress">{t("procurement.in_progress") || "In Progress"}</option>
              <option value="Partially Delivered">{t("procurement.partially_delivered") || "Partially Delivered"}</option>
              <option value="Delivered">{t("procurement.delivered") || "Delivered"}</option>
              <option value="Delayed">{t("procurement.delayed") || "Delayed"}</option>
            </select>
            </div>
          </div>
          {filteredSchedules.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <Calendar size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t("procurement.no_schedules") || "No schedules found"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.schedule_number") || "Schedule #"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.supplier") || "Supplier"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.start_date") || "Start Date"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.end_date") || "End Date"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.deliveries") || "Deliveries"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.status") || "Status"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((schedule) => (
                    <motion.tr
                      key={schedule._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3 font-mono" style={{ color: 'var(--text-color)' }}>
                        {schedule.scheduleNumber}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        <div className="flex items-center gap-2">
                          <Truck size={16} />
                          {schedule.supplierName}
                        </div>
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {schedule.startDate
                          ? new Date(schedule.startDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {schedule.endDate
                          ? new Date(schedule.endDate).toLocaleDateString()
                          : t("procurement.no_end_date") || "No end date"}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        <span className="flex items-center gap-1">
                          <Package size={16} />
                          {schedule.schedule?.length || 0} {t("procurement.scheduled") || "scheduled"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/procurement/supply-schedules/${schedule._id}`)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              const confirmMessage = t("procurement.confirm_delete") || "Are you sure you want to delete this schedule?";
                              if (window.confirm(confirmMessage)) {
                                deleteMutation.mutate(schedule._id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SupplySchedulesList;

