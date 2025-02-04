import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios"; // ודא שהנתיב נכון
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  FaTrash,
  FaUser,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

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

// קומפוננטת רשימת המשימות
const TasksList = () => {
  const queryClient = useQueryClient();
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

  if (isLoading) return <div className="text-center p-6">Loading tasks...</div>;
  if (isError)
    return (
      <div className="text-center p-6 text-red-500">Error loading tasks.</div>
    );

  // סידור המשימות לפי דדליין ואח"כ לפי עדיפות
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Task List</h1>

      {sortedTasks.length === 0 ? (
        <p className="text-gray-500 text-center">No tasks available.</p>
      ) : (
        <div className="grid gap-6">
          {sortedTasks.map((task) => (
            <div
              key={task._id}
              className="p-5 border rounded-lg shadow hover:shadow-lg transition bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {task.title}
                </h2>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => deleteMutation.mutate(task._id)}
                >
                  <FaTrash size={18} />
                </button>
              </div>

              <p className="text-gray-600">{task.description}</p>

              {/* סטטוס */}
              <div
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-lg mt-2 ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status}
              </div>

              {/* דדליין */}
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <FaClock className="mr-2 text-blue-500" />
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
                  <strong className="text-gray-700">Assigned To:</strong>
                  <div className="flex flex-wrap mt-1">
                    {task.assignedTo.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex items-center bg-gray-200 px-3 py-1 rounded-full text-sm mr-2 mt-2"
                      >
                        <FaUser className="mr-1 text-gray-600" /> {emp.name} (
                        {emp.role})
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
