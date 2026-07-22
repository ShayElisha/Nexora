import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import {
  FaBell,
  FaCheckCircle,
  FaFilter,
  FaInbox,
  FaTrashAlt,
} from "react-icons/fa";

const priorityConfig = {
  critical: {
    label: "קריטי",
    border: "border-red-400",
    badge: "bg-red-100 text-red-700",
  },
  high: {
    label: "גבוה",
    border: "border-orange-400",
    badge: "bg-orange-100 text-orange-700",
  },
  medium: {
    label: "בינוני",
    border: "border-blue-300",
    badge: "bg-blue-100 text-blue-700",
  },
  low: {
    label: "נמוך",
    border: "border-[var(--border-color)]",
    badge: "bg-[var(--bg-secondary)] text-[var(--color-secondary)]",
  },
};

const categoryLabels = {
  procurement: "רכש",
  finance: "פיננסים",
  inventory: "מלאי",
  tasks: "משימות",
  projects: "פרויקטים",
  customers: "לקוחות",
  hr: "משא\"ן",
  system: "מערכת",
  approval: "אישורים",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const NotificationsManagement = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/notifications/admin-notifications");
      return res.data?.data || [];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      axiosInstance.post("/notifications/mark-as-read", { notificationId }),
    onSuccess: () => {
      toast.success("ההתראה סומנה כנקראה");
      queryClient.invalidateQueries(["adminNotifications"]);
    },
    onError: (error) => {
      console.error("Error marking notification:", error);
      toast.error("נכשל בסימון ההתראה");
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => axiosInstance.post("/notifications/mark-as-read-all"),
    onSuccess: () => {
      toast.success("כל ההתראות המסומנות נקראו");
      queryClient.invalidateQueries(["adminNotifications"]);
    },
    onError: (error) => {
      console.error("Error marking all notifications:", error);
      toast.error("נכשל בסימון כל ההתראות");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId) =>
      axiosInstance.delete("/notifications/delete", {
        data: { notificationId },
      }),
    onSuccess: () => {
      toast.success("ההתראה נמחקה");
      queryClient.invalidateQueries(["adminNotifications"]);
    },
    onError: (error) => {
      console.error("Error deleting notification:", error);
      toast.error("נכשל במחיקת ההתראה");
    },
  });

  const categories = useMemo(() => {
    const set = new Set(notifications.map((n) => n.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        if (categoryFilter !== "all" && notification.category !== categoryFilter) {
          return false;
        }

        if (showOnlyUnread && notification.isRead) {
          return false;
        }

        if (searchTerm.trim()) {
          const searchTarget = (
            `${notification.title} ${notification.content} ${notification.category}`
          ).toLowerCase();
          return searchTarget.includes(searchTerm.toLowerCase());
        }

        return true;
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [notifications, categoryFilter, showOnlyUnread, searchTerm]);

  const stats = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    const critical = notifications.filter((n) => n.priority === "critical").length;
    const finance = notifications.filter((n) => n.category === "finance").length;

    return {
      total: notifications.length,
      unread,
      critical,
      finance,
    };
  }, [notifications]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
        >
          <FaBell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
            ניהול התראות
          </h1>
          <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
            צפייה, סינון וביצוע פעולות על כל ההתראות במערכת
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--surface-color)] shadow-lg">
          <p className="text-sm text-[var(--color-secondary)]">סה"כ התראות</p>
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {stats.total}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--surface-color)] shadow-lg">
          <p className="text-sm text-[var(--color-secondary)]">התראות שלא נקראו</p>
          <p className="text-2xl font-bold text-red-500">{stats.unread}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--surface-color)] shadow-lg">
          <p className="text-sm text-[var(--color-secondary)]">התראות קריטיות</p>
          <p className="text-2xl font-bold text-orange-500">{stats.critical}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--surface-color)] shadow-lg">
          <p className="text-sm text-[var(--color-secondary)]">התראות פיננסיות</p>
          <p className="text-2xl font-bold text-emerald-500">{stats.finance}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--color-secondary)]">
          <FaFilter />
          <span className="font-medium">סינון</span>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", color: "var(--text-color)" }}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all"
                ? "כל הקטגוריות"
                : categoryLabels[category] || category}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlyUnread}
            onChange={(e) => setShowOnlyUnread(e.target.checked)}
          />
          הצג רק התראות שלא נקראו
        </label>
        <input
          type="text"
          placeholder="חיפוש לפי כותרת או תוכן..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[220px] h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", color: "var(--text-color)" }}
        />
        <button
          onClick={() => {
            setCategoryFilter("all");
            setShowOnlyUnread(false);
            setSearchTerm("");
            refetch();
          }}
          className="px-4 h-11 text-sm rounded-lg border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors font-medium"
        >
          איפוס
        </button>
        <button
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={notifications.length === 0}
          className="ml-auto flex items-center gap-2 px-4 h-11 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-[var(--button-text)] hover:opacity-90 transition disabled:bg-[var(--border-color)] disabled:text-[var(--color-secondary)]"
        >
          <FaCheckCircle />
          סמן הכל כנקרא
        </button>
      </div>

      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--color-secondary)]">טוען התראות...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            אירעה שגיאה בטעינת ההתראות
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-secondary)] flex flex-col items-center gap-3">
            <FaInbox className="w-10 h-10 text-[var(--color-secondary)]" />
            <p>אין התראות התואמות את הסינון הנוכחי</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {filteredNotifications.map((notification) => {
              const priorityStyle =
                priorityConfig[notification.priority] || priorityConfig.medium;

              return (
                <div
                  key={notification._id}
                  className={`flex flex-col md:flex-row md:items-center gap-3 p-5 transition ${
                    notification.isRead ? "bg-[var(--surface-color)]" : "bg-yellow-50"
                  } border-l-4 ${priorityStyle.border}`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-secondary)] mb-1">
                      <span className="font-medium">
                        {formatDate(notification.createdAt)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--color-secondary)]">
                        {categoryLabels[notification.category] ||
                          notification.category ||
                          "כללי"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${priorityStyle.badge}`}
                      >
                        {priorityStyle.label}
                      </span>
                      {notification.type && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                          {notification.type}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-color)]">
                      {notification.title}
                    </h3>
                    <p className="text-[var(--color-secondary)] text-sm whitespace-pre-line">
                      {notification.content}
                    </p>
                    {notification.actionUrl && (
                      <Link
                        to={notification.actionUrl}
                        className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] font-medium mt-2 hover:underline"
                      >
                        עבור לפעולה
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() =>
                          markAsReadMutation.mutate(notification._id)
                        }
                        className="px-3 py-1.5 rounded-full text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                      >
                        סמן כנקרא
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(notification._id)}
                      className="px-3 py-1.5 rounded-full text-sm bg-red-100 text-red-700 hover:bg-red-200 transition flex items-center gap-2"
                    >
                      <FaTrashAlt />
                      מחיקה
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsManagement;

