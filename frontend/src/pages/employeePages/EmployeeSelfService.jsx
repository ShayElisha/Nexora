import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../lib/axios";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Loader2,
  Award,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const EmployeeSelfService = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: selfServiceData, isLoading } = useQuery({
    queryKey: ["employee-self-service"],
    queryFn: async () => {
      const res = await axiosInstance.get("/hr/analytics/employee/me");
      return res.data.data || {};
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/attendance/check-in");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-self-service"]);
      toast.success(t("hr.attendance.checked_in") || "Checked in successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to check in");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/attendance/check-out");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-self-service"]);
      toast.success(t("hr.attendance.checked_out") || "Checked out successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to check out");
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  const employee = selfServiceData?.employee || {};
  const attendance = selfServiceData?.attendance || {};
  const leaveRequests = selfServiceData?.leaveRequests || [];
  const enrollments = selfServiceData?.enrollments || [];
  const performanceReviews = selfServiceData?.performanceReviews || [];

  const todayAttendance = attendance.records?.find(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  );

  const tabs = [
    { id: "overview", label: t("hr.self_service.overview") || "Overview", icon: User },
    { id: "attendance", label: t("hr.self_service.attendance") || "Attendance", icon: Clock },
    { id: "leave", label: t("hr.self_service.leave") || "Leave", icon: Calendar },
    { id: "learning", label: t("hr.self_service.learning") || "Learning", icon: BookOpen },
    { id: "performance", label: t("hr.self_service.performance") || "Performance", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
          >
            <User size={28} color="white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
              {t("hr.self_service.employee_portal") || "Employee Self-Service Portal"}
            </h1>
            <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
              {t("hr.self_service.manage_your_info") || "Manage your information and requests"}
            </p>
          </div>
        </div>

        {/* Employee Info Card */}
        <div
          className="rounded-2xl p-6 shadow-lg border mb-6"
          style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center gap-4">
            {employee.profileImage ? (
              <img
                src={employee.profileImage}
                alt={employee.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <User className="w-10 h-10" style={{ color: "var(--color-primary)" }} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                {employee.name} {employee.lastName}
              </h2>
              <p style={{ color: "var(--color-secondary)" }}>{employee.email}</p>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{employee.role} • {employee.department?.name}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 shadow-lg border"
            style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.vacation_balance") || "Vacation Balance"}</p>
                <p className="text-2xl font-bold text-blue-600">{employee.vacationBalance || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 shadow-lg border"
            style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.sick_balance") || "Sick Balance"}</p>
                <p className="text-2xl font-bold text-red-600">{employee.sickBalance || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 shadow-lg border"
            style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.active_courses") || "Active Courses"}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {enrollments.filter((e) => e.status === "in_progress").length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 shadow-lg border"
            style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.pending_requests") || "Pending Requests"}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {leaveRequests.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div
          className="rounded-2xl shadow-lg border mb-6 overflow-hidden"
          style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
        >
          <div className="flex border-b" style={{ borderColor: "var(--border-color)" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-6 py-4 font-medium transition-colors"
                  style={
                    activeTab === tab.id
                      ? { color: "var(--color-primary)", boxShadow: "inset 0 -2px 0 var(--color-primary)" }
                      : { color: "var(--color-secondary)" }
                  }
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Today's Attendance */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                    {t("hr.self_service.today_attendance") || "Today's Attendance"}
                  </h3>
                  {todayAttendance ? (
                    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.check_in") || "Check In"}</p>
                          <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                            {todayAttendance.checkIn?.time
                              ? new Date(todayAttendance.checkIn.time).toLocaleTimeString()
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.check_out") || "Check Out"}</p>
                          <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                            {todayAttendance.checkOut?.time
                              ? new Date(todayAttendance.checkOut.time).toLocaleTimeString()
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.working_hours") || "Working Hours"}</p>
                          <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                            {todayAttendance.workingHours?.toFixed(2) || 0}h
                          </p>
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.self_service.status") || "Status"}</p>
                          <p className="font-semibold capitalize" style={{ color: "var(--text-color)" }}>{todayAttendance.status}</p>
                        </div>
                      </div>
                      {!todayAttendance.checkOut?.time && (
                        <button
                          onClick={() => checkOutMutation.mutate()}
                          className="mt-4 w-full sm:w-auto px-6 h-11 rounded-lg font-medium transition-all hover:opacity-90"
                          style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                        >
                          {t("hr.self_service.check_out") || "Check Out"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--bg-secondary)" }}>
                      <p className="mb-4" style={{ color: "var(--color-secondary)" }}>
                        {t("hr.self_service.not_checked_in") || "You haven't checked in today"}
                      </p>
                      <button
                        onClick={() => checkInMutation.mutate()}
                        className="w-full sm:w-auto px-6 h-11 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        {t("hr.self_service.check_in") || "Check In"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Leave Requests */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("hr.self_service.recent_leave_requests") || "Recent Leave Requests"}
                    </h3>
                    <button
                      onClick={() => navigate("/employee/hr/leave/request")}
                      className="flex items-center gap-2 hover:opacity-80"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <Plus className="w-4 h-4" />
                      {t("hr.self_service.request_leave") || "Request Leave"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {leaveRequests.slice(0, 5).map((request) => (
                      <div
                        key={request._id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        <div>
                          <p className="font-medium" style={{ color: "var(--text-color)" }}>
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{request.leaveType} • {request.days} days</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Courses */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                    {t("hr.self_service.active_courses") || "Active Courses"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrollments
                      .filter((e) => e.status === "in_progress" || e.status === "enrolled")
                      .slice(0, 4)
                      .map((enrollment) => (
                        <div
                          key={enrollment._id}
                          className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
                        >
                          <h4 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                            {enrollment.courseId?.title}
                          </h4>
                          <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${enrollment.progress || 0}%`, backgroundColor: "var(--color-primary)" }}
                            />
                          </div>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                            {enrollment.progress || 0}% {t("hr.self_service.complete") || "complete"}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                  {t("hr.self_service.attendance_history") || "Attendance History"}
                </h3>
                <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: "var(--border-color)" }}>
                  <table className="w-full">
                    <thead style={{ backgroundColor: "var(--bg-secondary)" }}>
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.self_service.date") || "Date"}</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.self_service.check_in") || "Check In"}</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.self_service.check_out") || "Check Out"}</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.self_service.hours") || "Hours"}</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.self_service.status") || "Status"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.records?.slice(0, 30).map((record) => (
                        <tr key={record._id} className="border-b" style={{ borderColor: "var(--border-color)", color: "var(--text-color)" }}>
                          <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            {record.checkIn?.time
                              ? new Date(record.checkIn.time).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {record.checkOut?.time
                              ? new Date(record.checkOut.time).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="py-3 px-4">{record.workingHours?.toFixed(2) || 0}h</td>
                          <td className="py-3 px-4">
                            <span className="capitalize">{record.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Leave Tab */}
            {activeTab === "leave" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("hr.self_service.leave_requests") || "Leave Requests"}
                  </h3>
                  <button
                    onClick={() => navigate("/employee/hr/leave/request")}
                    className="flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                  >
                    <Plus className="w-4 h-4" />
                    {t("hr.self_service.request_leave") || "Request Leave"}
                  </button>
                </div>
                <div className="space-y-4">
                  {leaveRequests.map((request) => (
                    <div
                      key={request._id}
                      className="border rounded-xl p-4"
                      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                            {request.leaveType} • {request.days} {t("hr.self_service.days") || "days"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      {request.reason && (
                        <p className="text-sm mt-2" style={{ color: "var(--color-secondary)" }}>{request.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Tab */}
            {activeTab === "learning" && (
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                  {t("hr.self_service.my_courses") || "My Courses"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment._id}
                      className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
                      onClick={() => navigate(`/employee/hr/lms/courses/${enrollment.courseId?._id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold" style={{ color: "var(--text-color)" }}>
                          {enrollment.courseId?.title}
                        </h4>
                        {enrollment.certificate?.issued && (
                          <Award className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
                        <div
                          className={`h-2 rounded-full ${
                            enrollment.status === "completed"
                              ? "bg-green-600"
                              : enrollment.status === "in_progress"
                              ? "bg-blue-600"
                              : ""
                          }`}
                          style={{
                            width: `${enrollment.progress || 0}%`,
                            ...(enrollment.status !== "completed" && enrollment.status !== "in_progress"
                              ? { backgroundColor: "var(--color-secondary)" }
                              : {}),
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--color-secondary)" }}>
                          {enrollment.progress || 0}% {t("hr.self_service.complete") || "complete"}
                        </span>
                        <span className="capitalize" style={{ color: "var(--color-secondary)" }}>{enrollment.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                  {t("hr.self_service.performance_reviews") || "Performance Reviews"}
                </h3>
                <div className="space-y-4">
                  {performanceReviews.map((review) => (
                    <div
                      key={review._id}
                      className="border rounded-xl p-4"
                      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                            {review.reviewer?.name} {review.reviewer?.lastName}
                          </p>
                        </div>
                        {review.overallRating && (
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                              {review.overallRating}/5
                            </p>
                          </div>
                        )}
                      </div>
                      {review.comments && (
                        <p className="mt-2" style={{ color: "var(--color-secondary)" }}>{review.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelfService;
