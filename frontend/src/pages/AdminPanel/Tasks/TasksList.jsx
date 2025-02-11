// src/components/procurement/TasksList.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FaTrash, FaUser, FaClock } from "react-icons/fa";

// פונקציה למיפוי צבעים לסטטוסים (ניתן להתאים גם כאן, במידת הצורך, לערכי הפלטה)
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

// פונקציה למיפוי צבעים לעדיפות (ניתן לשנות בהתאם לרצונכם)
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
      toast.error(error.response?.data?.message || "Error fetching tasks.");
    },
  });

  // מחיקת משימה
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  if (isLoading) {
    return <div className="text-center p-6 text-text">Loading tasks...</div>;
  }
  if (isError) {
    return (
      <div className="text-center p-6 text-red-500">אין נתונים זמינים</div>
    );
  }

  // מיון המשימות לפי תאריך יעד (dueDate)
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-bg shadow-md rounded-lg border border-border-color">
      <h1 className="text-3xl font-bold mb-6 text-primary">Task List</h1>

      {sortedTasks.length === 0 ? (
        <p className="text-center text-text">אין משימות זמינות.</p>
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

              {/* סטטוס */}
              <div
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-lg mt-2 ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status}
              </div>

              {/* דדליין */}
              <div className="flex items-center text-sm text-text mt-2">
                <FaClock className="mr-2 text-accent" />
                <span>
                  Due:{" "}
                  {task.dueDate
                    ? format(new Date(task.dueDate), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>

              {/* עדיפות */}
              <p className={`mt-2 ${getPriorityColor(task.priority)}`}>
                Priority: {task.priority}
              </p>

              {/* משתתפים */}
              {task.assignedTo.length > 0 && (
                <div className="mt-3">
                  <strong className="text-text">Assigned To:</strong>
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
