import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  FaTrash,
  FaUser,
  FaClock,
  FaSearch,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

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

  // State עבור חיפוש, מיון, סינון, עמוד נוכחי וכו'
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const tasksPerPage = 12;

  // שליפת רשימת המשימות
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await axiosInstance.get("/tasks");
      return res.data.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("tasks.error_fetch"));
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
    onError: (err) => {
      toast.error(
        err.response?.data?.message || t("tasks.status_update_error")
      );
    },
  });

  // לוגיקה: חיפוש
  let filteredTasks = tasks.filter((task) => {
    const term = searchTerm.toLowerCase();
    const dueDateStr = task.dueDate
      ? format(new Date(task.dueDate), "MMM d, yyyy").toLowerCase()
      : "";
    const assignedToStr = task.assignedTo
      .map((emp) => `${emp.name} ${emp.role}`.toLowerCase())
      .join(" ");
    return (
      task.title?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.status?.toLowerCase().includes(term) ||
      task.priority?.toLowerCase().includes(term) ||
      dueDateStr.includes(term) ||
      assignedToStr.includes(term)
    );
  });

  // לוגיקה: סינון לפי סטטוס
  if (filterStatus !== "all") {
    filteredTasks = filteredTasks.filter(
      (task) => task.status?.toLowerCase() === filterStatus
    );
  }

  // לוגיקה: מיון
  if (sortOption) {
    filteredTasks.sort((a, b) => {
      switch (sortOption) {
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "description_asc":
          return a.description.localeCompare(b.description);
        case "description_desc":
          return b.description.localeCompare(a.description);
        case "status_asc":
          return a.status.localeCompare(b.status);
        case "status_desc":
          return b.status.localeCompare(a.status);
        case "priority_asc":
          return a.priority.localeCompare(b.priority);
        case "priority_desc":
          return b.priority.localeCompare(a.priority);
        case "dueDate_asc":
          return new Date(a.dueDate) - new Date(b.dueDate);
        case "dueDate_desc":
          return new Date(b.dueDate) - new Date(a.dueDate);
        default:
          return 0;
      }
    });
  }

  // פאג'ינציה
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === i
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (startPage > 1) {
        pageNumbers.push(
          <button
            key={1}
            onClick={() => paginate(1)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === 1
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(
            <span key="start-dots" className="mx-1">
              ...
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === i
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-dots" className="mx-1">
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => paginate(totalPages)}
            className={`px-3 py-1 rounded-full mx-1 ${
              currentPage === totalPages
                ? "bg-button-bg text-button-text"
                : "bg-accent text-text hover:bg-secondary hover:text-button-text"
            }`}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  // שינוי סטטוס משימה
  const handleStatusChange = (taskId, newStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-bg">
        <div className="text-red-500 font-medium text-lg flex items-center gap-2">
          <FaExclamationTriangle />
          {error?.message || t("tasks.no_data")}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-bg to-bg min-h-screen animate-fade-in">
      <h1 className="text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
        {t("tasks.list_title")}
      </h1>

      {/* Search, Sort, and Filter row */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row justify-center">
        {/* שדה חיפוש עם אייקון זכוכית מגדלת */}
        <div className="relative w-full max-w-sm mx-auto md:mx-2">
          <input
            type="text"
            placeholder={t("tasks.search_placeholder")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // אם מחפשים, חוזרים לעמוד ראשון
            }}
            className="w-full p-4 pl-12 border border-border-color rounded-full shadow-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-white text-text placeholder-gray-400"
          />
          <FaSearch
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary"
            size={18}
          />
        </div>

        <select
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-sm p-3 border border-border-color rounded-full bg-white text-text focus:ring-2 focus:ring-primary transition-all duration-200 shadow-md mx-auto md:mx-2"
        >
          <option value="">{t("tasks.sort_by")}</option>
          <option value="title_asc">{t("tasks.sort_title_asc")}</option>
          <option value="title_desc">{t("tasks.sort_title_desc")}</option>
          <option value="description_asc">
            {t("tasks.sort_description_asc")}
          </option>
          <option value="description_desc">
            {t("tasks.sort_description_desc")}
          </option>
          <option value="status_asc">{t("tasks.sort_status_asc")}</option>
          <option value="status_desc">{t("tasks.sort_status_desc")}</option>
          <option value="priority_asc">{t("tasks.sort_priority_asc")}</option>
          <option value="priority_desc">{t("tasks.sort_priority_desc")}</option>
          <option value="dueDate_asc">{t("tasks.sort_due_date_asc")}</option>
          <option value="dueDate_desc">{t("tasks.sort_due_date_desc")}</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-sm p-3 border border-border-color rounded-full bg-white text-text focus:ring-2 focus:ring-primary transition-all duration-200 shadow-md mx-auto md:mx-2"
        >
          <option value="all">{t("tasks.filter_status_all")}</option>
          <option value="pending">{t("tasks.pending")}</option>
          <option value="in progress">{t("tasks.in_progress")}</option>
          <option value="completed">{t("tasks.completed")}</option>
          <option value="cancelled">{t("tasks.cancelled")}</option>
        </select>
      </div>

      {/* טבלת המשימות */}
      {filteredTasks.length === 0 ? (
        <p className="text-center text-text italic">{t("tasks.no_tasks")}</p>
      ) : (
        <div className="overflow-x-auto shadow-2xl rounded-xl bg-white transform transition-all duration-500 hover:shadow-3xl">
          <table className="min-w-full text-text">
            <thead className="bg-gradient-to-r from-primary to-secondary text-button-text">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("tasks.title")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("tasks.description")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("tasks.status")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("tasks.priority")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("tasks.due_date")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("tasks.assigned_to")}
                </th>
                <th className="py-4 px-6 text-center text-sm font-bold tracking-wider">
                  {t("tasks.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.map((task, index) => {
                const dueDate = task.dueDate
                  ? format(new Date(task.dueDate), "MMM d, yyyy")
                  : t("tasks.not_available");

                return (
                  <tr
                    key={task._id}
                    className={`border-b transition-all duration-300 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-accent hover:shadow-inner`}
                  >
                    {/* כותרת */}
                    <td className="py-4 px-6 font-semibold text-primary">
                      {task.title}
                    </td>

                    {/* תיאור */}
                    <td className="py-4 px-6">{task.description || "-"}</td>

                    {/* סטטוס (ב-Select) */}
                    <td className="py-4 px-6">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        className={`px-2 py-1 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 ${getStatusColor(
                          task.status
                        )}`}
                      >
                        <option value="pending">{t("tasks.pending")}</option>
                        <option value="in progress">
                          {t("tasks.in_progress")}
                        </option>
                        <option value="completed">
                          {t("tasks.completed")}
                        </option>
                        <option value="cancelled">
                          {t("tasks.cancelled")}
                        </option>
                      </select>
                    </td>

                    {/* עדיפות (צבע טקסט) */}
                    <td className="py-4 px-6">
                      <span className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </span>
                    </td>

                    {/* תאריך יעד */}
                    <td className="py-4 px-6 whitespace-nowrap flex items-center gap-1">
                      <FaClock className="text-accent" />
                      <span>{dueDate}</span>
                    </td>

                    {/* מוקצה לעובדים */}
                    <td className="py-4 px-6">
                      {task.assignedTo && task.assignedTo.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {task.assignedTo.map((emp) => (
                            <span
                              key={emp._id}
                              className="inline-flex items-center gap-1 bg-secondary text-button-text px-2 py-1 rounded-full text-xs"
                            >
                              <FaUser />
                              {emp.name} ({emp.role})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* פעולות (מחיקה וכו') */}
                    <td className="py-4 px-6 text-center">
                      <button
                        className="text-red-600 hover:text-red-800 transition-all transform hover:scale-110"
                        onClick={() => deleteMutation.mutate(task._id)}
                        title={t("tasks.delete")}
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* פאג'ינציה */}
      {filteredTasks.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-full ${
              currentPage === 1
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-button-bg text-button-text hover:bg-secondary"
            }`}
          >
            ←
          </button>
          {renderPageNumbers()}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-full ${
              currentPage === totalPages
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-button-bg text-button-text hover:bg-secondary"
            }`}
          >
            →
          </button>
        </div>
      )}

      {/* אנימציית רקע (כמו במחלקות) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TasksList;
