import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  Loader2,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import EmptyState from "../../../../components/ui/EmptyState";
import { safeT } from "../../../../lib/i18nSafe";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const hasChartData = (chartData) =>
  Array.isArray(chartData?.datasets?.[0]?.data) &&
  chartData.datasets[0].data.some((v) => Number(v) > 0);

const ChartPanel = ({ title, chartData, emptyTitle, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl shadow-lg p-6"
    style={{
      backgroundColor: "var(--bg-color)",
      borderColor: "var(--border-color)",
      border: "1px solid",
    }}
  >
    <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
      {title}
    </h3>
    <div style={{ height: "350px", position: "relative" }}>
      {hasChartData(chartData) ? (
        children
      ) : (
        <EmptyState icon={BarChart3} title={emptyTitle} compact />
      )}
    </div>
  </motion.div>
);

const HRAnalyticsDashboard = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["hr-analytics", dateRange],
    queryFn: async () => {
      const res = await axiosInstance.get("/hr/analytics", {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
      });
      return res.data.data || {};
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const employeesData = analytics?.employees || {};
  const recruitmentData = analytics?.recruitment || {};
  const learningData = analytics?.learning || {};
  const attendanceData = analytics?.attendance || {};
  const leaveData = analytics?.leave || {};
  const performanceData = analytics?.performance || {};

  // Chart data for employees by department
  const employeesByDeptData = {
    labels: employeesData.byDepartment?.map((d) => d.department?.name || "Unknown") || [],
    datasets: [
      {
        label: safeT(t, "hr.analytics.employees", "עובדים"),
        data: employeesData.byDepartment?.map((d) => d.count) || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)",
          "rgba(16, 185, 129, 0.5)",
          "rgba(245, 158, 11, 0.5)",
          "rgba(239, 68, 68, 0.5)",
          "rgba(139, 92, 246, 0.5)",
        ],
      },
    ],
  };

  // Chart data for applicants by status
  const applicantsByStatusData = {
    labels: recruitmentData.byStatus?.map((s) => s._id?.replace("_", " ")) || [],
    datasets: [
      {
        label: t("hr.analytics.applicants") || "Applicants",
        data: recruitmentData.byStatus?.map((s) => s.count) || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)",
          "rgba(16, 185, 129, 0.5)",
          "rgba(245, 158, 11, 0.5)",
          "rgba(239, 68, 68, 0.5)",
        ],
      },
    ],
  };

  // Chart data for leave by type
  const leaveByTypeData = {
    labels: leaveData.byType?.map((t) => t._id) || [],
    datasets: [
      {
        label: t("hr.analytics.leave_requests") || "Leave Requests",
        data: leaveData.byType?.map((t) => t.count) || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)",
          "rgba(239, 68, 68, 0.5)",
          "rgba(139, 92, 246, 0.5)",
          "rgba(236, 72, 153, 0.5)",
          "rgba(99, 102, 241, 0.5)",
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
            {t("hr.analytics.dashboard") || "HR Analytics Dashboard"}
          </h1>
          <p className="mt-1" style={{ color: "var(--color-secondary)" }}>
            {t("hr.analytics.comprehensive_insights") || "Comprehensive insights into your HR operations"}
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="rounded-xl shadow-lg p-4 mb-6" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", border: "1px solid" }}>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: safeT(t, "hr.analytics.total_employees", "סה״כ עובדים"),
            value: employeesData.total || 0,
            badge: `${employeesData.active || 0} ${safeT(t, "hr.analytics.active", "פעיל")}`,
            badgeColor: "#10b981",
            Icon: Users,
            iconColor: "var(--color-primary)",
          },
          {
            label: safeT(t, "hr.analytics.total_applicants", "סה״כ מועמדים"),
            value: recruitmentData.totalApplicants || 0,
            badge: `${recruitmentData.averageTimeToHire?.toFixed(1) || 0} ${safeT(t, "hr.analytics.avg_days_to_hire", "ימים ממוצע לגיוס")}`,
            badgeColor: "var(--color-primary)",
            Icon: Briefcase,
            iconColor: "#10b981",
          },
          {
            label: safeT(t, "hr.analytics.total_courses", "סה״כ קורסים"),
            value: learningData.totalCourses || 0,
            badge: `${learningData.completionRate?.toFixed(1) || 0}% ${safeT(t, "hr.analytics.completion_rate", "שיעור השלמה")}`,
            badgeColor: "#a855f7",
            Icon: BookOpen,
            iconColor: "#a855f7",
          },
          {
            label: safeT(t, "hr.analytics.attendance_rate", "שיעור נוכחות"),
            value: `${attendanceData.averageRate?.toFixed(1) || 0}%`,
            badge: `${attendanceData.lateArrivals || 0} ${safeT(t, "hr.analytics.late_arrivals", "איחורים")}`,
            badgeColor: "#f59e0b",
            Icon: Calendar,
            iconColor: "#f59e0b",
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl shadow-lg p-6"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-start justify-between gap-4 h-full">
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <p className="text-sm leading-snug" style={{ color: "var(--color-secondary)" }}>
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold leading-none" style={{ color: "var(--text-color)" }}>
                  {kpi.value}
                </p>
                <p className="text-sm mt-1 leading-snug" style={{ color: kpi.badgeColor }}>
                  {kpi.badge}
                </p>
              </div>
              <kpi.Icon className="w-10 h-10 shrink-0" style={{ color: kpi.iconColor }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartPanel
          title={safeT(t, "hr.analytics.employees_by_department", "עובדים לפי מחלקה")}
          chartData={employeesByDeptData}
          emptyTitle={safeT(t, "hr.analytics.no_chart_data", "אין נתונים להצגה")}
        >
          <Bar
            data={employeesByDeptData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: { left: 8, right: 8, top: 8, bottom: 8 } },
              plugins: {
                legend: { display: true, position: "top" },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { padding: 8, maxTicksLimit: 6 },
                  afterFit: (scale) => {
                    scale.width = Math.max(scale.width, 48);
                  },
                },
                x: {
                  ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
                },
              },
            }}
          />
        </ChartPanel>

        <ChartPanel
          title={safeT(t, "hr.analytics.applicants_by_status", "מועמדים לפי סטטוס")}
          chartData={applicantsByStatusData}
          emptyTitle={safeT(t, "hr.analytics.no_chart_data", "אין נתונים להצגה")}
        >
          <Pie
            data={applicantsByStatusData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "bottom" },
              },
            }}
          />
        </ChartPanel>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartPanel
          title={safeT(t, "hr.analytics.leave_by_type", "בקשות חופשה לפי סוג")}
          chartData={leaveByTypeData}
          emptyTitle={safeT(t, "hr.analytics.no_chart_data", "אין נתונים להצגה")}
        >
          <Pie
            data={leaveByTypeData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "bottom" },
              },
            }}
          />
        </ChartPanel>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-lg p-6"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
            border: "1px solid",
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
            {t("hr.analytics.performance_summary") || "Performance Summary"}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.total_reviews") || "Total Reviews"}</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{performanceData.totalReviews || 0}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.average_rating") || "Average Rating"}</p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                {performanceData.averageRating?.toFixed(1) || 0}/5
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-lg p-6"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
            border: "1px solid",
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
            {t("hr.analytics.recruitment_metrics") || "Recruitment Metrics"}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.offer_acceptance_rate") || "Offer Acceptance Rate"}</span>
              <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                {recruitmentData.offerAcceptanceRate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.avg_time_to_hire") || "Avg Time to Hire"}</span>
              <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                {recruitmentData.averageTimeToHire?.toFixed(1) || 0} {t("hr.analytics.days") || "days"}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-lg p-6"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
            border: "1px solid",
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
            {t("hr.analytics.learning_metrics") || "Learning Metrics"}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.total_enrollments") || "Total Enrollments"}</span>
              <span className="font-semibold" style={{ color: "var(--text-color)" }}>{learningData.totalEnrollments || 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.completion_rate") || "Completion Rate"}</span>
              <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                {learningData.completionRate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.avg_progress") || "Average Progress"}</span>
              <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                {learningData.averageProgress?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-lg p-6"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
            border: "1px solid",
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
            {t("hr.analytics.attendance_metrics") || "Attendance Metrics"}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.total_working_hours") || "Total Working Hours"}</span>
              <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                {attendanceData.totalWorkingHours?.toFixed(1) || 0}h
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.total_overtime") || "Total Overtime"}</span>
              <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                {attendanceData.totalOvertimeHours?.toFixed(1) || 0}h
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-secondary)" }}>{t("hr.analytics.absences") || "Absences"}</span>
              <span className="font-semibold" style={{ color: "#ef4444" }}>{attendanceData.absences || 0}</span>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default HRAnalyticsDashboard;

