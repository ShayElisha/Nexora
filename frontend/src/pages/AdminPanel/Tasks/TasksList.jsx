import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FaTrash, FaUser, FaClock } from "react-icons/fa";
import { useTranslation } from "react-i18next";

// פונקציה למיפוי צבעים לסטטוסים
const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "in progress":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// פונקציה למיפוי צבעים לעדיפות
const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "text-red-600 font-bold";
    case "medium":
      return "text-orange-500 font-semibold";
    case "low":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
};

const TasksList = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // שליפת המשימות
  const {
    data: tasks = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await axiosInstance.get("/tasks");
      return res.data.data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("tasks.error_fetch"));
    },
  });

  // מחיקת משימה
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      toast.success(t("tasks.deleted_success"));
    },
    onError: () => {
      toast.error(t("tasks.deleted_error"));
    },
  });

  // עדכון סטטוס משימה
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await axiosInstance.put(`/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      toast.success(t("tasks.status_updated"));
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("tasks.status_update_error")
      );
    },
  });

  if (isLoading) {
    return (
      <div className="text-center p-6 text-text">{t("tasks.loading")}</div>
    );
  }
  if (isError) {
    return (
      <div className="text-center p-6 text-red-500">{t("tasks.no_data")}</div>
    );
  }

  // מיון המשימות לפי תאריך יעד (dueDate)
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  const handleStatusChange = (taskId, newStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-bg shadow-md rounded-lg border border-border-color">
      <h1 className="text-3xl font-bold mb-6 text-primary">
        {t("tasks.list_title")}
      </h1>

      {sortedTasks.length === 0 ? (
        <p className="text-center text-text">{t("tasks.no_tasks")}</p>
      ) : (
        <div className="grid gap-6">
          {sortedTasks.map((task) => (
            <div
              key={task._id}
              className="p-5 border rounded-lg shadow hover:shadow-lg transition bg-bg border border-border-color"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary">
                  {task.title}
                </h2>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => deleteMutation.mutate(task._id)}
                >
                  <FaTrash size={18} />
                </button>
              </div>

              <p className="text-text mt-2">{task.description}</p>

              {/* סטטוס עם תפריט גלילה */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-text">
                  {t("tasks.status")}:
                </span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className={`px-3 py-1 text-sm font-semibold rounded-lg ${getStatusColor(
                    task.status
                  )} focus:outline-none focus:ring-2 focus:ring-blue-600`}
                >
                  <option value="pending">{t("tasks.pending")}</option>
                  <option value="in progress">{t("tasks.in_progress")}</option>
                  <option value="completed">{t("tasks.completed")}</option>
                  <option value="cancelled">{t("tasks.cancelled")}</option>
                </select>
              </div>

              {/* דדליין */}
              <div className="flex items-center text-sm text-text mt-2">
                <FaClock className="mr-2 text-accent" />
                <span>
                  {t("tasks.due")}{" "}
                  {task.dueDate
                    ? format(new Date(task.dueDate), "MMM d, yyyy")
                    : t("tasks.not_available")}
                </span>
              </div>

              {/* עדיפות */}
              <p className={`mt-2 ${getPriorityColor(task.priority)}`}>
                {t("tasks.priority")}: {task.priority}
              </p>

              {/* משתתפים */}
              {task.assignedTo.length > 0 && (
                <div className="mt-3">
                  <strong className="text-text">
                    {t("tasks.assigned_to")}:
                  </strong>
                  <div className="flex flex-wrap mt-1">
                    {task.assignedTo.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex items-center bg-secondary px-3 py-1 rounded-full text-sm mr-2 mt-2"
                      >
                        <FaUser className="mr-1" /> {emp.name} ({emp.role})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksList;
