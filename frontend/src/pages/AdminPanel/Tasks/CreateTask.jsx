// src/pages/procurement/CreateTask.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios"; // עדכן את הנתיב לפי המבנה שלך
import toast from "react-hot-toast";

const CreateTask = () => {
  // אתחול מצב הטופס
  const [formData, setFormData] = useState({
    departmentId: "",
    projectId: "",
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    assignedTo: [],
    isApproved: false,
  });

  // רשימות אפשרויות לבחירת מחלקה ופרוייקט
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);

  // טעינת רשימת העובדים מהשרת
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [loading, setLoading] = useState(false);

  // טעינת מחלקות
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axiosInstance.get("/departments");
        const options = res.data.data.map((dept) => ({
          id: dept._id,
          name: dept.name,
        }));
        setDepartmentOptions(options);
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Error loading departments");
      }
    };
    fetchDepartments();
  }, []);

  // טעינת פרוייקטים כאשר בוחרים מחלקה
  useEffect(() => {
    if (formData.departmentId) {
      const fetchProjects = async () => {
        try {
          const res = await axiosInstance.get(
            `/departments/projectName/${formData.departmentId}`
          );
          const options = res.data.data.map((project) => ({
            id: project.id,
            name: project.name,
            endDate: project.endDate,
          }));
          setProjectOptions(options);
        } catch (error) {
          console.error("Error fetching projects:", error);
          toast.error("Error loading projects for selected department");
        }
      };
      fetchProjects();
    } else {
      setProjectOptions([]);
    }
  }, [formData.departmentId]);

  // טעינת עובדים
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

  // סינון עובדים לפי המחלקה
  useEffect(() => {
    if (formData.departmentId) {
      const filtered = employees.filter(
        (emp) => String(emp.department) === formData.departmentId
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [formData.departmentId, employees]);

  // טיפול בשינוי שדות הטופס
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // בעת שינוי המחלקה, נאפס את בחירת הפרוייקט
    if (name === "departmentId") {
      setFormData((prev) => ({ ...prev, projectId: "" }));
    }
  };

  // טיפול בבחירת עובדים (multiple select)
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

    if (!formData.departmentId) {
      toast.error("Department is required");
      setLoading(false);
      return;
    }
    if (!formData.projectId) {
      toast.error("Project is required");
      setLoading(false);
      return;
    }

    try {
      await axiosInstance.post("/tasks", formData);
      toast.success("Task created successfully!");
      setFormData({
        departmentId: "",
        projectId: "",
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
        isApproved: false,
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Error creating task");
    } finally {
      setLoading(false);
    }
  };

  // מציאת הפרוייקט הנבחר לצורך תצוגת תאריך הסיום
  const selectedProject = projectOptions.find(
    (project) => project.id === formData.projectId
  );

  return (
    <div className="max-w-3xl mx-auto p-4 bg-bg text-text border border-border-color rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-primary">Create New Task</h2>
      <form onSubmit={handleSubmit}>
        {/* בחירת מחלקה */}
        <div className="mb-4">
          <label htmlFor="departmentId" className="block font-medium mb-1">
            Department:
          </label>
          <select
            id="departmentId"
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
            required
          >
            <option value="">Select Department</option>
            {departmentOptions.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* בחירת פרוייקט – מוצג רק אם מחלקה נבחרה */}
        {formData.departmentId && (
          <div className="mb-4">
            <label htmlFor="projectId" className="block font-medium mb-1">
              Project:
            </label>
            <select
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
              required
            >
              <option value="">Select Project</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* שדה כותרת */}
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
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
            required
          />
        </div>

        {/* שדה תיאור */}
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
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          ></textarea>
        </div>

        {/* בחירת סטטוס */}
        <div className="mb-4">
          <label htmlFor="status" className="block font-medium mb-1">
            Status:
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          >
            <option value="pending">Pending</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* בחירת עדיפות */}
        <div className="mb-4">
          <label htmlFor="priority" className="block font-medium mb-1">
            Priority:
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* בחירת תאריך יעד */}
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
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          />
        </div>

        {/* תצוגת תאריך סיום פרוייקט */}
        {formData.projectId && (
          <div className="mb-4">
            <label className="block font-medium mb-1">Project End Date:</label>
            <p className="p-2 border border-border-color rounded bg-bg text-text">
              {selectedProject && selectedProject.endDate
                ? new Date(selectedProject.endDate).toLocaleDateString()
                : "Not available"}
            </p>
          </div>
        )}

        {/* בחירת עובדים (אם קיימים עובדים מסוננים) */}
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
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
            >
              {filteredEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.lastName}
                </option>
              ))}
            </select>
            <small className="text-sm text-gray-600">
              Select one or more employees (optional)
            </small>
          </div>
        )}

        {/* Checkbox לאישור ביצוע המשימה */}
        <div className="mb-4">
          <label htmlFor="isApproved" className="inline-flex items-center">
            <input
              type="checkbox"
              id="isApproved"
              name="isApproved"
              checked={formData.isApproved}
              onChange={handleChange}
              className="mr-2"
            />
            Approved
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-button-bg text-button-text px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
};

export default CreateTask;
