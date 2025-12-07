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
    border: "border-gray-300",
    badge: "bg-gray-100 text-gray-600",
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-[var(--color-primary)] text-white">
          <FaBell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)]">
            ניהול התראות
          </h1>
          <p className="text-sm text-gray-500">
            צפייה, סינון וביצוע פעולות על כל ההתראות במערכת
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">סה"כ התראות</p>
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">התראות שלא נקראו</p>
          <p className="text-2xl font-bold text-red-500">{stats.unread}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">התראות קריטיות</p>
          <p className="text-2xl font-bold text-orange-500">{stats.critical}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">התראות פיננסיות</p>
          <p className="text-2xl font-bold text-emerald-500">{stats.finance}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <FaFilter />
          <span className="font-medium">סינון</span>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
          className="flex-1 min-w-[220px] border rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <button
          onClick={() => {
            setCategoryFilter("all");
            setShowOnlyUnread(false);
            setSearchTerm("");
            refetch();
          }}
          className="px-4 py-1.5 text-sm rounded-full border border-gray-300 hover:border-[var(--color-primary)] transition-colors"
        >
          איפוס
        </button>
        <button
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={notifications.length === 0}
          className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-sm bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition disabled:bg-gray-200 disabled:text-gray-400"
        >
          <FaCheckCircle />
          סמן הכל כנקרא
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">טוען התראות...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            אירעה שגיאה בטעינת ההתראות
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <FaInbox className="w-10 h-10 text-gray-300" />
            <p>אין התראות התואמות את הסינון הנוכחי</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const priorityStyle =
                priorityConfig[notification.priority] || priorityConfig.medium;

              return (
                <div
                  key={notification._id}
                  className={`flex flex-col md:flex-row md:items-center gap-3 p-5 transition ${
                    notification.isRead ? "bg-white" : "bg-yellow-50"
                  } border-l-4 ${priorityStyle.border}`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium">
                        {formatDate(notification.createdAt)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
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
                    <p className="text-gray-600 text-sm whitespace-pre-line">
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

