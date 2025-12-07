import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ListChecks,
  Search,
  Trash2,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Flag,
} from "lucide-react";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const tasksPerPage = 12;

  // Fetch tasks
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

  // Delete task
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

  // Update status
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

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await axiosInstance.put(`/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      toast.success(t("tasks.updated_success") || "משימה עודכנה בהצלחה");
      setShowEditModal(false);
      setEditingTask(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || t("tasks.update_error") || "שגיאה בעדכון משימה"
      );
    },
  });

  // Search filtering
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

  // Status filtering
  if (filterStatus !== "all") {
    filteredTasks = filteredTasks.filter(
      (task) => task.status?.toLowerCase() === filterStatus
    );
  }

  // Sorting
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

  // Pagination
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
            className={`px-3 py-1 rounded-full mx-1 transition-all ${
              currentPage === i
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
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
            className={`px-3 py-1 rounded-full mx-1 transition-all ${
              currentPage === 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
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
            className={`px-3 py-1 rounded-full mx-1 transition-all ${
              currentPage === i
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
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
            className={`px-3 py-1 rounded-full mx-1 transition-all ${
              currentPage === totalPages
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
            }`}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  // Calculate statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("tasks.loading")}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {error?.message || t("tasks.no_data")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <ListChecks size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("tasks.list_title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("tasks.manage_tasks")}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <ListChecks size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("tasks.total_tasks")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("tasks.pending")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.pending}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Edit size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("tasks.in_progress")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.inProgress}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("tasks.completed")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.completed}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-secondary)' }}
              />
              <input
                type="text"
                placeholder={t("tasks.search_placeholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              />
            </div>

            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="">{t("tasks.sort_by")}</option>
              <option value="title_asc">{t("tasks.sort_title_asc")}</option>
              <option value="title_desc">{t("tasks.sort_title_desc")}</option>
              <option value="priority_asc">{t("tasks.sort_priority_asc")}</option>
              <option value="priority_desc">{t("tasks.sort_priority_desc")}</option>
              <option value="dueDate_asc">{t("tasks.sort_due_date_asc")}</option>
              <option value="dueDate_desc">{t("tasks.sort_due_date_desc")}</option>
            </select>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="all">{t("tasks.filter_status_all")}</option>
              <option value="pending">{t("tasks.pending")}</option>
              <option value="in progress">{t("tasks.in_progress")}</option>
              <option value="completed">{t("tasks.completed")}</option>
              <option value="cancelled">{t("tasks.cancelled")}</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        {filteredTasks.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl" style={{ color: 'var(--color-secondary)' }}>
              {t("tasks.no_tasks")}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl shadow-lg border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("tasks.title")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("tasks.description")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("tasks.status")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("tasks.priority")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("tasks.due_date")}
                    </th>
                    <th className="px-4 py-4 text-left font-bold" style={{ color: 'var(--button-text)' }}>
                      {t("tasks.assigned_to")}
                    </th>
                    <th className="px-4 py-4 text-center font-bold" style={{ color: 'var(--button-text)' }}>
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
                      <motion.tr
                        key={task._id}
                        className="border-b hover:bg-opacity-50 transition-all"
                        style={{ borderColor: 'var(--border-color)' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'var(--border-color)' }}
                      >
                        <td className="px-4 py-4 font-bold" style={{ color: 'var(--text-color)' }}>
                          {task.title}
                        </td>
                        <td className="px-4 py-4" style={{ color: 'var(--text-color)' }}>
                          {task.description || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task._id, e.target.value)
                            }
                            className={`px-3 py-1 text-xs font-bold rounded-full focus:outline-none focus:ring-2 ${getStatusColor(
                              task.status
                            )}`}
                          >
                            <option value="pending">{t("tasks.pending")}</option>
                            <option value="in progress">{t("tasks.in_progress")}</option>
                            <option value="completed">{t("tasks.completed")}</option>
                            <option value="cancelled">{t("tasks.cancelled")}</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                            <Flag size={14} />
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                          <Calendar size={16} style={{ color: 'var(--color-secondary)' }} />
                          {dueDate}
                        </td>
                        <td className="px-4 py-4">
                          {task.assignedTo && task.assignedTo.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {task.assignedTo.map((emp) => (
                                <span
                                  key={emp._id}
                                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold"
                                >
                                  <User size={12} />
                                  {emp.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-secondary)' }}>-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="p-2 rounded-lg hover:scale-110 transition-all text-blue-500 hover:bg-blue-50"
                              onClick={() => {
                                setEditingTask(task);
                                setShowEditModal(true);
                              }}
                              title={t("tasks.edit") || "ערוך משימה"}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="p-2 rounded-lg hover:scale-110 transition-all text-red-500 hover:bg-red-50"
                              onClick={() => deleteMutation.mutate(task._id)}
                              title={t("tasks.delete")}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {filteredTasks.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-full transition-all ${
                currentPage === 1
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              ←
            </button>
            {renderPageNumbers()}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-full transition-all ${
                currentPage === totalPages
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
          onUpdate={(updatedData) => {
            updateTaskMutation.mutate({
              id: editingTask._id,
              data: updatedData,
            });
          }}
        />
      )}
    </div>
  );
};

// Edit Task Modal Component
const EditTaskModal = ({ task, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: task.title || "",
    description: task.description || "",
    status: task.status || "pending",
    priority: task.priority || "medium",
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    departmentId: task.departmentId?._id || task.departmentId || "",
    assignedTo: task.assignedTo?.map(emp => emp._id || emp) || [],
  });

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [departmentDetails, setDepartmentDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          axiosInstance.get("/departments"),
          axiosInstance.get("/employees"),
        ]);
        setDepartmentOptions(deptRes.data.data || []);
        setEmployees(empRes.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("שגיאה בטעינת נתונים");
      }
    };
    fetchData();
  }, []);

  // Fetch department details when department changes
  useEffect(() => {
    if (formData.departmentId) {
      axiosInstance
        .get(`/departments/${formData.departmentId}`)
        .then((res) => {
          setDepartmentDetails(res.data.data);
        })
        .catch((err) => {
          console.error("Error fetching department details:", err);
          setDepartmentDetails(null);
        });
    } else {
      setDepartmentDetails(null);
    }
  }, [formData.departmentId]);

  // Filter employees by department - show only employees from the selected department
  useEffect(() => {
    let filtered = [];
    
    // Only show employees if a department is selected
    if (formData.departmentId && departmentDetails && departmentDetails.teamMembers) {
      // Filter employees that belong to the selected department
      filtered = employees.filter((emp) =>
        departmentDetails.teamMembers.some(
          (member) => String(member.employeeId) === String(emp._id)
        )
      );
    }
    
    setFilteredEmployees(filtered);
  }, [formData.departmentId, employees, departmentDetails]);

  // Remove assigned employees that don't belong to the current department
  useEffect(() => {
    if (filteredEmployees.length > 0 && formData.assignedTo.length > 0) {
      const validAssignedIds = filteredEmployees.map(emp => emp._id.toString());
      const invalidAssigned = formData.assignedTo.filter(empId => !validAssignedIds.includes(empId.toString()));
      
      if (invalidAssigned.length > 0) {
        setFormData((prev) => ({
          ...prev,
          assignedTo: prev.assignedTo.filter(empId => validAssignedIds.includes(empId.toString()))
        }));
      }
    } else if (formData.departmentId && filteredEmployees.length === 0) {
      // If department is selected but no employees found, clear assigned employees
      if (formData.assignedTo.length > 0) {
        setFormData((prev) => ({
          ...prev,
          assignedTo: []
        }));
      }
    }
  }, [filteredEmployees, formData.departmentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // If department changed, filter out employees that don't belong to the new department
      if (name === "departmentId") {
        // Clear assigned employees - they will be filtered when department details load
        newData.assignedTo = [];
      }
      return newData;
    });
  };

  const handleAssignedChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setFormData((prev) => ({ ...prev, assignedTo: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      onUpdate(formData);
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <motion.div
        className="bg-bg rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto mx-4"
        style={{ backgroundColor: 'var(--bg-color)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
            {t("tasks.edit_task") || "ערוך משימה"}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-all"
            style={{ color: 'var(--text-color)' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("tasks.title")} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("tasks.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("createTask.departmentLabel") || "מחלקה"}
            </label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="">{t("createTask.selectDepartment") || "בחר מחלקה"}</option>
              {departmentOptions.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("tasks.status")}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              >
                <option value="pending">{t("tasks.pending")}</option>
                <option value="in progress">{t("tasks.in_progress")}</option>
                <option value="completed">{t("tasks.completed")}</option>
                <option value="cancelled">{t("tasks.cancelled")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("tasks.priority")}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              >
                <option value="low">{t("tasks.priority_low") || "נמוך"}</option>
                <option value="medium">{t("tasks.priority_medium") || "בינוני"}</option>
                <option value="high">{t("tasks.priority_high") || "גבוה"}</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("tasks.due_date")} *
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            />
          </div>

          {/* Assigned To - only show if department is selected */}
          {formData.departmentId ? (
            filteredEmployees.length > 0 ? (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("tasks.assigned_to")}
                </label>
                <select
                  name="assignedTo"
                  multiple
                  value={formData.assignedTo}
                  onChange={handleAssignedChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 h-32"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                  }}
                >
                  {filteredEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.lastName} - {emp.role || "Employee"}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>
                  {t("createTask.selectEmployeesOptional") || "החזק Ctrl/Cmd כדי לבחור מספר עובדים"} ({filteredEmployees.length} {t("createTask.employeesInDepartment", { defaultValue: "employees in department" })})
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                  {t("createTask.noEmployeesInDepartment", { defaultValue: "No employees found in the selected department" })}
                </p>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("createTask.selectDepartmentFirst", { defaultValue: "Please select a department first to assign employees" })}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--button-text)' }}
            >
              {t("tasks.cancel") || "ביטול"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {t("tasks.updating") || "מעדכן..."}
                </>
              ) : (
                t("tasks.update") || "עדכן"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TasksList;
