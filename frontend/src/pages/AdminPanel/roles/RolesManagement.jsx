import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  FilePlus,
  Pencil,
  Trash,
  CheckCircle,
  Download,
} from "lucide-react";
import {
  fetchAllRoles,
  fetchAllAvailablePermissions,
  createRole,
  updateRole,
  deleteRole,
} from "../../../api/rolesApi";

// Role Form Modal Component
const RoleFormModal = ({ role, isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedModules, setSelectedModules] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available permissions
  const { data: availableData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["availablePermissions"],
    queryFn: fetchAllAvailablePermissions,
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
  });

  // Default modules and actions
  const defaultModules = [
    "products", "suppliers", "finance", "budgets", "procurement",
    "projects", "employees", "signatures", "departments", "reports",
    "tasks", "customers", "events", "settings", "invoices",
    "inventory", "analytics", "shifts", "salary", "ai",
  ];
  const defaultActions = ["view", "create", "update", "delete", "approve", "export"];

  const modules = availableData?.modules?.length > 0 ? availableData.modules : defaultModules;
  const actions = availableData?.actions?.length > 0 ? availableData.actions : defaultActions;

  // Initialize form when role changes
  useEffect(() => {
    if (role && isOpen) {
      setFormData({
        name: role.name || "",
        description: role.description || "",
      });
      
      // Initialize selected modules from role permissions
      const initialModules = {};
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach((perm) => {
          if (perm.module && perm.actions) {
            initialModules[perm.module] = {
              selected: true,
              actions: Array.isArray(perm.actions) ? perm.actions : [],
            };
          }
        });
      }
      setSelectedModules(initialModules);
    } else if (!role && isOpen) {
      // Reset for new role
      setFormData({ name: "", description: "" });
      setSelectedModules({});
    }
  }, [role, isOpen]);

  // Module labels
  const moduleLabels = {
    products: t("products.title") || "מוצרים",
    suppliers: t("suppliers.title") || "ספקים",
    finance: t("finance.title") || "כספים",
    budgets: t("budgets.title") || "תקציבים",
    procurement: t("procurement.title") || "רכש",
    projects: t("projects.title") || "פרויקטים",
    employees: t("employees.title") || "עובדים",
    signatures: t("signatures.title") || "חתימות",
    departments: t("departments.title") || "מחלקות",
    reports: t("reports.title") || "דוחות",
    tasks: t("tasks.title") || "משימות",
    customers: t("customers.title") || "לקוחות",
    events: t("events.title") || "אירועים",
    settings: t("settings.title") || "הגדרות",
    invoices: t("invoices.title") || "חשבוניות",
    inventory: t("inventory.title") || "מלאי",
    analytics: t("analytics.title") || "אנליטיקה",
    shifts: t("shifts.title") || "משמרות",
    salary: t("salary.title") || "שכר",
    ai: "AI",
  };

  // Action config
  const actionConfig = {
    view: { label: t("permissions.view") || "צפייה", icon: Eye, color: "var(--color-primary)" },
    create: { label: t("permissions.create") || "יצירה", icon: FilePlus, color: "var(--color-accent)" },
    update: { label: t("permissions.update") || "עדכון", icon: Pencil, color: "var(--color-secondary)" },
    delete: { label: t("permissions.delete") || "מחיקה", icon: Trash, color: "#ef4444" },
    approve: { label: t("permissions.approve") || "אישור", icon: CheckCircle, color: "#10b981" },
    export: { label: t("permissions.export") || "ייצוא", icon: Download, color: "#8b5cf6" },
  };

  const handleModuleToggle = (module) => {
    setSelectedModules((prev) => {
      const current = prev[module] || { selected: false, actions: [] };
      if (current.selected) {
        // Deselect module - remove all actions
        const { [module]: _, ...rest } = prev;
        return rest;
      } else {
        // Select module - add with all actions
        return {
          ...prev,
          [module]: { selected: true, actions: [...actions] },
        };
      }
    });
  };

  const handleActionToggle = (module, action) => {
    setSelectedModules((prev) => {
      const current = prev[module] || { selected: false, actions: [] };
      const newActions = current.actions.includes(action)
        ? current.actions.filter((a) => a !== action)
        : [...current.actions, action];

      if (newActions.length === 0) {
        // Remove module if no actions selected
        const { [module]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [module]: { selected: true, actions: newActions },
      };
    });
  };

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("roles.created") || "תפקיד נוצר בהצלחה");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("roles.error_creating") || "שגיאה ביצירת תפקיד");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ roleId, data }) => updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("roles.updated") || "תפקיד עודכן בהצלחה");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("roles.error_updating") || "שגיאה בעדכון תפקיד");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const permissions = Object.entries(selectedModules)
        .filter(([_, value]) => value.selected && value.actions.length > 0)
        .map(([module, value]) => ({
          module,
          actions: value.actions,
        }));

      const roleData = {
        name: formData.name,
        description: formData.description,
        permissions,
      };

      if (role?._id) {
        updateMutation.mutate({ roleId: role._id, data: roleData });
      } else {
        createMutation.mutate(roleData);
      }
    } catch (error) {
      toast.error(t("roles.error") || "שגיאה");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border"
          style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex items-center gap-3">
              <Shield size={28} style={{ color: "var(--color-primary)" }} />
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                {role ? t("roles.edit_role") || "עריכת תפקיד" : t("roles.create_role") || "יצירת תפקיד חדש"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("roles.name") || "שם התפקיד"} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("roles.description") || "תיאור"}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-color)" }}>
                {t("roles.permissions") || "הרשאות"}
              </h3>

              {isLoadingPermissions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module) => {
                    const moduleState = selectedModules[module] || { selected: false, actions: [] };

                    return (
                      <div
                        key={module}
                        className="p-4 rounded-xl border"
                        style={{
                          backgroundColor: moduleState.selected ? "var(--card-bg)" : "var(--bg-color)",
                          borderColor: moduleState.selected ? "var(--color-primary)" : "var(--border-color)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={moduleState.selected}
                              onChange={() => handleModuleToggle(module)}
                              className="w-5 h-5 rounded"
                              style={{ accentColor: "var(--color-primary)" }}
                            />
                            <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                              {moduleLabels[module] || module}
                            </span>
                          </label>
                        </div>

                        {moduleState.selected && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                            {actions.map((action) => {
                              const actionInfo = actionConfig[action] || {
                                label: action,
                                icon: Eye,
                                color: "var(--text-secondary)",
                              };
                              const IconComponent = actionInfo.icon;
                              const isSelected = moduleState.actions.includes(action);

                              return (
                                <label
                                  key={action}
                                  className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all hover:scale-105 border-2"
                                  style={{
                                    backgroundColor: isSelected ? `${actionInfo.color}15` : "var(--bg-color)",
                                    borderColor: isSelected ? actionInfo.color : "var(--border-color)",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleActionToggle(module, action)}
                                    className="w-5 h-5 rounded"
                                    style={{ accentColor: actionInfo.color }}
                                  />
                                  <IconComponent
                                    size={18}
                                    style={{ color: isSelected ? actionInfo.color : "var(--text-secondary)" }}
                                  />
                                  <span
                                    className="text-sm font-medium"
                                    style={{ color: isSelected ? actionInfo.color : "var(--text-secondary)" }}
                                  >
                                    {actionInfo.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
              >
                {t("roles.cancel") || "ביטול"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name}
                className="flex-1 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("roles.saving") || "שומר..."}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {role ? t("roles.update") || "עדכן" : t("roles.create") || "צור"}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Roles Management Component
const RolesManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Fetch roles
  const { data: roles = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      console.log("🔄 [RolesManagement] Starting to fetch roles...");
      try {
        const result = await fetchAllRoles(true);
        console.log("✅ [RolesManagement] Roles fetched successfully:", {
          type: typeof result,
          isArray: Array.isArray(result),
          length: result?.length || 0,
          firstRole: result?.[0] || null,
          allRoles: result
        });
        return result;
      } catch (err) {
        console.error("❌ [RolesManagement] Error fetching roles:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        throw err;
      }
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary calls
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });


  // Filter roles based on search term
  const filteredRoles = useMemo(() => {
    if (!Array.isArray(roles)) {
      console.warn("⚠️ Roles is not an array:", typeof roles);
      return [];
    }
    const result = !searchTerm.trim() 
      ? roles 
      : roles.filter(
          (role) =>
            role?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role?.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    console.log("🔍 Filtered roles:", {
      searchTerm,
      totalRoles: roles.length,
      filteredCount: result.length
    });
    return result;
  }, [roles, searchTerm]);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("roles.deleted") || "תפקיד נמחק בהצלחה");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("roles.error_deleting") || "שגיאה במחיקת תפקיד");
    },
  });

  // Handlers
  const handleCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = (role) => {
    if (window.confirm(t("roles.confirm_delete") || `האם אתה בטוח שברצונך למחוק את התפקיד "${role.name}"?`)) {
      deleteMutation.mutate(role._id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center p-6">
          <AlertCircle size={64} className="mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
          <p className="text-xl font-semibold mb-2" style={{ color: "var(--text-color)" }}>
            {t("roles.error_loading") || "שגיאה בטעינת תפקידים"}
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {error.message || t("roles.unknown_error") || "שגיאה לא ידועה"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 rounded-xl font-bold"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
          >
            {t("roles.try_again") || "נסה שוב"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl shadow-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                <Shield size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold" style={{ color: "var(--text-color)" }}>
                  {t("roles.management") || "ניהול תפקידים והרשאות"}
                </h1>
                <p className="text-lg mt-1" style={{ color: "var(--text-secondary)" }}>
                  {t("roles.subtitle") || "נהל תפקידים והרשאות גישה לעובדים"}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
            >
              <Plus size={20} />
              {t("roles.create_role") || "צור תפקיד חדש"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-secondary)" }}
            />
            <input
              type="text"
              placeholder={t("roles.search") || "חפש תפקידים..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            />
          </div>
        </div>


        {/* Roles List - Table View */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
            <span className="ml-2" style={{ color: "var(--text-color)" }}>{t("roles.loading") || "טוען תפקידים..."}</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 p-4 rounded-xl border" style={{ 
            backgroundColor: "var(--card-bg)", 
            borderColor: "var(--color-accent)" 
          }}>
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
            <p className="text-xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {t("roles.error_loading") || "שגיאה בטעינת תפקידים"}
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              {error.message || t("roles.unknown_error") || "שגיאה לא ידועה"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg font-bold"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
            >
              {t("roles.try_again") || "נסה שוב"}
            </button>
          </div>
        ) : !Array.isArray(roles) || roles.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {t("roles.no_roles") || "אין תפקידים"}
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              {t("roles.no_roles_description") || "צור תפקיד ראשון כדי להתחיל"}
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-3 rounded-xl font-bold"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
            >
              {t("roles.create_first_role") || "צור תפקיד ראשון"}
            </button>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-16">
            <Search size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {t("roles.no_roles_match") || "לא נמצאו תפקידים התואמים לחיפוש"}
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              {t("roles.search_term", { term: searchTerm }) || `חיפוש: "${searchTerm}"`}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
              {t("roles.total_roles", { count: roles.length }) || `יש ${roles.length} תפקידים בסך הכל`}
            </p>
          </div>
        ) : (
          <motion.div
            className="rounded-2xl shadow-lg border overflow-hidden"
            style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--border-color)" }}>
                    <th className="px-4 py-4 text-right font-bold" style={{ color: "var(--button-text)" }}>
                      {t("roles.table_name") || "שם התפקיד"}
                    </th>
                    <th className="px-4 py-4 text-right font-bold" style={{ color: "var(--button-text)" }}>
                      {t("roles.table_description") || "תיאור"}
                    </th>
                    <th className="px-4 py-4 text-right font-bold" style={{ color: "var(--button-text)" }}>
                      {t("roles.table_permissions") || "רשימת הרשאות"}
                    </th>
                    <th className="px-4 py-4 text-right font-bold" style={{ color: "var(--button-text)" }}>
                      {t("roles.table_status") || "סטטוס"}
                    </th>
                    <th className="px-4 py-4 text-right font-bold" style={{ color: "var(--button-text)" }}>
                      {t("roles.table_created") || "תאריך יצירה"}
                    </th>
                    <th className="px-4 py-4 text-center font-bold" style={{ color: "var(--button-text)" }}>
                      {t("roles.table_actions") || "פעולות"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role, index) => (
                    <motion.tr
                      key={role._id}
                      className="border-b transition-colors hover:bg-opacity-50"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: index % 2 === 0 ? "var(--card-bg)" : "var(--bg-color)",
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                            <Shield size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold" style={{ color: "var(--text-color)" }}>
                              {role.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm max-w-xs truncate" style={{ color: "var(--text-secondary)" }}>
                          {role.description || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 max-w-md">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map((perm, permIdx) => (
                              <div key={permIdx} className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs px-2 py-1 rounded font-semibold" style={{
                                  backgroundColor: "var(--color-primary)20",
                                  color: "var(--color-primary)"
                                }}>
                                  {perm.module}
                                </span>
                                <div className="flex gap-1 flex-wrap">
                                  {perm.actions && Array.isArray(perm.actions) && perm.actions.map((action, actionIdx) => (
                                    <span
                                      key={actionIdx}
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{
                                        backgroundColor: "var(--border-color)",
                                        color: "var(--text-secondary)"
                                      }}
                                    >
                                      {action}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {t("roles.no_permissions") || "אין הרשאות"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {role.isDefault && (
                            <span className="text-xs px-2 py-1 rounded font-semibold" style={{
                              backgroundColor: "var(--color-accent)",
                              color: "white"
                            }}>
                              {t("roles.default") || "ברירת מחדל"}
                            </span>
                          )}
                          {!role.canEdit && (
                            <Lock size={14} style={{ color: "var(--color-secondary)" }} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {role.createdAt
                            ? new Date(role.createdAt).toLocaleDateString("he-IL", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })
                            : "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {role.canEdit ? (
                            <>
                              <button
                                onClick={() => handleEdit(role)}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
                                title={t("roles.edit") || "ערוך"}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(role)}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                                title={t("roles.delete") || "מחק"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <Lock size={16} style={{ color: "var(--color-secondary)" }} title={t("roles.readonly") || "קריאה בלבד"} />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Role Form Modal */}
        <RoleFormModal
          role={selectedRole}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default RolesManagement;
