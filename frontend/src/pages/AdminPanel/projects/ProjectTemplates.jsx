import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Star,
  Search,
  Filter,
  Copy,
} from "lucide-react";

const ProjectTemplates = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["projectTemplates"],
    queryFn: async () => {
      const res = await axiosInstance.get("/projects/templates");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/projects/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["projectTemplates"]);
      toast.success(t("projects.template_deleted"));
    },
    onError: () => {
      toast.error(t("projects.error_deleting_template"));
    },
  });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchTerm ||
      template.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            <FileText size={28} color="white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("projects.templates")}
            </h1>
            <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
              {t("projects.templates_description")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 h-11 rounded-lg font-medium transition"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
        >
          <Plus className="w-5 h-5" />
          {t("projects.create_template")}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder={t("projects.search_templates")}
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
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-11 px-4 border rounded-xl focus:ring-2"
            style={{ 
              borderColor: 'var(--border-color)', 
              backgroundColor: 'var(--bg-color)', 
              color: 'var(--text-color)',
              '--tw-ring-color': 'var(--color-primary)'
            }}
          >
            <option value="All">{t("projects.all_categories")}</option>
            <option value="Development">Development</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition border"
            style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                  {template.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-secondary)' }}>
                  {template.category}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(template.rating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : ""
                    }`}
                    style={i >= Math.round(template.rating || 0) ? { color: 'var(--border-color)' } : {}}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-secondary)' }}>
              {template.description || "No description"}
            </p>

            <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--color-secondary)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{template.tasks?.length || 0} tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{template.usageCount || 0} uses</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg transition text-sm"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                onClick={() => {
                  // TODO: Implement create project from template
                  toast.success(t("projects.creating_project"));
                }}
              >
                <Copy className="w-4 h-4 inline mr-2" />
                {t("projects.use_template")}
              </button>
              <button
                className="px-4 py-2 border rounded-lg transition"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  color: 'var(--text-color)',
                  backgroundColor: 'var(--surface-color)'
                }}
                onClick={() => {
                  // TODO: Implement edit template
                  toast.info(t("projects.edit_template"));
                }}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                className="px-4 py-2 border rounded-lg transition"
                style={{ 
                  borderColor: '#ef4444', 
                  color: '#ef4444',
                  backgroundColor: 'var(--surface-color)'
                }}
                onClick={() => {
                  if (window.confirm(t("projects.confirm_delete_template"))) {
                    deleteMutation.mutate(template._id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
          <p style={{ color: 'var(--color-secondary)' }}>
            {t("projects.no_templates")}
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProjectTemplates;

