import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Loader2,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const LeaveRequestsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ["leave-requests", statusFilter, leaveTypeFilter],
    queryFn: async () => {
      const res = await axiosInstance.get("/leave", {
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          leaveType: leaveTypeFilter !== "all" ? leaveTypeFilter : undefined,
        },
      });
      return res.data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.post(`/leave/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leave-requests"]);
      toast.success(t("hr.leave.approved") || "Leave request approved");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to approve leave request");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      await axiosInstance.post(`/leave/${id}/reject`, { rejectionReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leave-requests"]);
      toast.success(t("hr.leave.rejected") || "Leave request rejected");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to reject leave request");
    },
  });

  const filteredRequests = leaveRequests.filter((request) =>
    `${request.employeeId?.name} ${request.employeeId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.pending;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      vacation: "bg-blue-100 text-blue-800",
      sick: "bg-red-100 text-red-800",
      personal: "bg-purple-100 text-purple-800",
      maternity: "bg-pink-100 text-pink-800",
      paternity: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: "var(--bg-color)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
              {t("hr.leave.leave_requests") || "Leave Requests"}
            </h1>
            <p className="mt-1" style={{ color: "var(--color-secondary)" }}>
              {t("hr.leave.manage_leave_requests") || "Manage and approve employee leave requests"}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard/hr/leave/requests/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg"
            style={{
              background: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
              color: "var(--button-text)",
            }}
          >
            <Plus className="w-5 h-5" />
            {t("hr.leave.request_leave") || "Request Leave"}
          </motion.button>
        </div>

        <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", border: "1px solid" }}>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "var(--color-secondary)" }} />
            <input
              type="text"
              placeholder={t("hr.leave.search") || "Search employees..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
          >
            <option value="all">{t("hr.leave.all_statuses") || "All Statuses"}</option>
            <option value="pending">{t("hr.leave.pending") || "Pending"}</option>
            <option value="approved">{t("hr.leave.approved") || "Approved"}</option>
            <option value="rejected">{t("hr.leave.rejected") || "Rejected"}</option>
          </select>
          <select
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
          >
            <option value="all">{t("hr.leave.all_types") || "All Types"}</option>
            <option value="vacation">{t("hr.leave.vacation") || "Vacation"}</option>
            <option value="sick">{t("hr.leave.sick") || "Sick"}</option>
            <option value="personal">{t("hr.leave.personal") || "Personal"}</option>
            <option value="maternity">{t("hr.leave.maternity") || "Maternity"}</option>
            <option value="paternity">{t("hr.leave.paternity") || "Paternity"}</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 hover:shadow-md transition-shadow"
              style={{
                borderColor: "var(--border-color)",
                border: "1px solid",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5" style={{ color: "var(--color-secondary)" }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {request.employeeId?.name} {request.employeeId?.lastName}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{request.employeeId?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                    {request.leaveType}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>{t("hr.leave.start_date") || "Start Date"}</p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>
                    {new Date(request.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>{t("hr.leave.end_date") || "End Date"}</p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>
                    {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>{t("hr.leave.days") || "Days"}</p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>{request.days} {t("hr.leave.days") || "days"}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>{t("hr.leave.requested_at") || "Requested At"}</p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {request.reason && (
                <div className="mb-4">
                  <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>{t("hr.leave.reason") || "Reason"}</p>
                  <p style={{ color: "var(--text-color)" }}>{request.reason}</p>
                </div>
              )}

              {request.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate(request._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg"
                    style={{
                      background: "linear-gradient(to right, #10b981, #059669)",
                      color: "white",
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t("hr.leave.approve") || "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt(t("hr.leave.rejection_reason") || "Rejection reason:");
                      if (reason) {
                        rejectMutation.mutate({ id: request._id, reason });
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg"
                    style={{
                      background: "linear-gradient(to right, #ef4444, #dc2626)",
                      color: "white",
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                    {t("hr.leave.reject") || "Reject"}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
              {t("hr.leave.no_requests") || "No leave requests found"}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestsList;

