import React, { useState } from "react";
import axiosInstance from "../../../lib/axios"; // עדכן את הנתיב לפי המבנה שלך
import toast from "react-hot-toast";

const Add_Department = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  // טיפול בשינויי השדות בטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // טיפול בשליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // קריאה ליצירת מחלקה בנתיב /api/departments
      const res = await axiosInstance.post("/departments", formData);
      toast.success("Department created successfully!");
      // איפוס הטופס לאחר הצלחה
      setFormData({
        name: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Error creating department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Add Department</h2>
      <form onSubmit={handleSubmit}>
        {/* שדה שם המחלקה */}
        <div className="mb-4">
          <label htmlFor="name" className="block font-medium mb-1">
            Department Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 p-2 rounded"
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
            rows="3"
            className="w-full border border-gray-300 p-2 rounded"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Department"}
        </button>
      </form>
    </div>
  );
};

export default Add_Department;
