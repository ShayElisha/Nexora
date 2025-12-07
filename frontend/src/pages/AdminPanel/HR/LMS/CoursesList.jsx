import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Clock,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";

const CoursesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses", statusFilter, categoryFilter],
    queryFn: async () => {
      const res = await axiosInstance.get("/lms/courses", {
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        },
      });
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/lms/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      toast.success(t("hr.lms.course_deleted") || "Course deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete course");
    },
  });

  const filteredCourses = courses.filter((course) =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(courses.map((c) => c.category).filter(Boolean))];

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
              {t("hr.lms.courses") || "Courses"}
            </h1>
            <p className="mt-1" style={{ color: "var(--color-secondary)" }}>
              {t("hr.lms.manage_courses") || "Manage training courses and learning materials"}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard/hr/lms/courses/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg"
            style={{
              background: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
              color: "var(--button-text)",
            }}
          >
            <Plus className="w-5 h-5" />
            {t("hr.lms.create_course") || "Create Course"}
          </motion.button>
        </div>

        <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", border: "1px solid" }}>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "var(--color-secondary)" }} />
            <input
              type="text"
              placeholder={t("hr.lms.search_courses") || "Search courses..."}
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
            <option value="all">{t("hr.lms.all_statuses") || "All Statuses"}</option>
            <option value="draft">{t("hr.lms.draft") || "Draft"}</option>
            <option value="published">{t("hr.lms.published") || "Published"}</option>
            <option value="archived">{t("hr.lms.archived") || "Archived"}</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
          >
            <option value="all">{t("hr.lms.all_categories") || "All Categories"}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 hover:shadow-md transition-shadow"
              style={{
                borderColor: "var(--border-color)",
                border: "1px solid",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>{course.title}</h3>
                </div>
                {course.certificate?.enabled && (
                  <Award className="w-5 h-5" style={{ color: "#f59e0b" }} />
                )}
              </div>

              <div className="flex items-center gap-4 text-sm mb-3" style={{ color: "var(--color-secondary)" }}>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration} {t("hr.lms.hours") || "hours"}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.enrollmentType}
                </div>
              </div>

              <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-color)" }}>
                {course.description}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/dashboard/hr/lms/courses/${course._id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: "var(--footer-bg)",
                    color: "var(--color-primary)",
                  }}
                >
                  <Eye className="w-4 h-4" />
                  {t("common.view") || "View"}
                </button>
                <button
                  onClick={() => navigate(`/dashboard/hr/lms/courses/${course._id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: "var(--footer-bg)",
                    color: "var(--text-color)",
                  }}
                >
                  <Edit className="w-4 h-4" />
                  {t("common.edit") || "Edit"}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(course._id)}
                  className="px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: "var(--footer-bg)",
                    color: "#ef4444",
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
              {t("hr.lms.no_courses") || "No courses found"}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default CoursesList;

