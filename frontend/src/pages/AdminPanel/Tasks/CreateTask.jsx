import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios"; // עדכן לפי הנתיב הנכון
import toast from "react-hot-toast";

const CreateTask = () => {
  // מצב הטופס כולל תקציב (budget), כותרת, תיאור, סטטוס, עדיפות, תאריך יעד ומשתתפים
  const [formData, setFormData] = useState({
    department: "", // _id של התקציב (מחלקה/פרוייקט)
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    assignedTo: [], // מערך של מזהי עובדים
  });

  // מצב עבור אפשרויות התקציבים (מחלקות/פרוייקטים)
  const [budgetOptions, setBudgetOptions] = useState([]);
  // התקציב של המחלקה/פרוייקט הנבחר (אם קיים)
  const [budget, setBudget] = useState(null);
  // רשימת העובדים (למשימה)
  const [employees, setEmployees] = useState([]);
  // רשימת העובדים המיועדים לפי המחלקה – ניתן להרחיב במידת הצורך
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // טעינת תקציבים (מחלקות/פרוייקטים) מה-API
  useEffect(() => {
    const fetchBudgetOptions = async () => {
      try {
        const res = await axiosInstance.get(`/budget`);
        // הנחה: res.data.data הוא מערך של תקציבים, וכל תקציב כולל את השדה departmentOrProjectName
        const options = res.data.data.map((budget) => ({
          id: budget._id,
          name: budget.departmentOrProjectName,
        }));
        setBudgetOptions(options);
      } catch (error) {
        console.error("Error fetching budget options:", error);
        toast.error("Error loading budget options");
      }
    };
    fetchBudgetOptions();
  }, []);

  // טעינת רשימת העובדים מהשרת
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/employees");
        setEmployees(res.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Error loading employees");
      }
    };
    fetchEmployees();
  }, []);

  // כאשר התקציב (department) הנבחר משתנה, נטען את התקציב המלא מהשרת
  useEffect(() => {
    if (formData.department) {
      const fetchBudget = async () => {
        try {
          if (!formData.department) {
            toast.error("Missing department " + formData.department);
            return;
          }
          const res = await axiosInstance.get(
            `/budget/by-department/${formData.department}`
          );
          console.log("Budget:", res.data.data);
          setBudget(res.data.data);
        } catch (error) {
          console.error("Error fetching budget:", error);
          toast.error(
            "Error loading department budget+" +
              formData.department +
              " " +
              error
          );
        }
      };
      fetchBudget();

      const filtered = employees.filter(
        (emp) =>
          String(emp.department) === formData.department ||
          emp.department === budget?.departmentOrProjectName
      );
      setFilteredEmployees(filtered);
    } else {
      setBudget(null);
      setFilteredEmployees([]);
    }
  }, [formData.department, employees]);

  // טיפול בשינויי שדות הטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // טיפול בשינוי שדה ה-multi-select עבור assignedTo
  const handleAssignedChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      assignedTo: selectedOptions,
    }));
  };

  // טיפול בשליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post("/tasks", formData);
      toast.success("Task created successfully!");
      // איפוס הטופס לאחר יצירה
      setFormData({
        department: "",
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
      });
      setBudget(null);
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Error creating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6">Create New Task</h2>

      {/* בחירת תקציב (מחלקה/פרוייקט) */}
      <div className="mb-4">
        <label htmlFor="department" className="block font-medium mb-1">
          Department/Project:
        </label>
        <select
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
          required
        >
          <option value="">Select Department/Project</option>
          {budgetOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      {/* הצגת תקציב המחלקה אם קיים */}
      {budget && (
        <div className="mb-4 p-4 border border-green-300 bg-green-50 rounded">
          <h3 className="font-bold mb-2">Department Budget</h3>
          <p>Allocated Amount: {budget.amount}</p>
          <p>Spent Amount: {budget.spentAmount}</p>
          <p>Remaining: {budget.amount - budget.spentAmount}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="block font-medium mb-1">
            Title:
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block font-medium mb-1">
            Description:
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full border border-gray-300 p-2 rounded"
          ></textarea>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label htmlFor="status" className="block font-medium mb-1">
            Status:
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="pending">Pending</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label htmlFor="priority" className="block font-medium mb-1">
            Priority:
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="mb-4">
          <label htmlFor="dueDate" className="block font-medium mb-1">
            Due Date:
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        {/* Assigned To (עובדים מהתקציב או לפי המחלקה) */}
        {filteredEmployees.length > 0 && (
          <div className="mb-4">
            <label htmlFor="assignedTo" className="block font-medium mb-1">
              Assigned To:
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              multiple
              value={formData.assignedTo}
              onChange={handleAssignedChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              {filteredEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.lastName}
                </option>
              ))}
            </select>
            <small className="text-gray-600">
              Select one or more employees
            </small>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
};

export default CreateTask;
