import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios"; // עדכן את הנתיב לפי המבנה שלך
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const Add_Department = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    // שדה חדש למנהל מחלקה
    managerId: "",
    teamMembers: [], // נשמור כאן את ה-IDים של העובדים הנבחרים
  });
  const [employees, setEmployees] = useState([]); // רשימת העובדים מהשרת
  const [loading, setLoading] = useState(false);

  // טעינת רשימת העובדים
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        // נניח שהנתונים מגיעים במבנה { data: { data: [...] } }
        if (response.data && response.data.data) {
          setEmployees(response.data.data);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  // טיפול בשינויי השדות בטופס (שדות טקסט ובחירת dropdown)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // טיפול בשינוי בשדה הבחירה המרובה לעובדים
  const handleTeamMembersChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      teamMembers: selectedOptions,
    }));
  };

  // טיפול בשליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // המרת רשימת ה-IDים למערך של אובייקטים בהתאם למודל
      const payload = {
        ...formData,
        teamMembers: formData.teamMembers.map((id) => ({ employeeId: id })),
      };

      // קריאה ליצירת מחלקה בנתיב /departments
      await axiosInstance.post("/departments", payload);
      toast.success(t("addDepartment.success"));
      // איפוס הטופס לאחר הצלחה
      setFormData({
        name: "",
        description: "",
        managerId: "",
        teamMembers: [],
      });
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error(t("addDepartment.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-base-100 text-text rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-primary">
        {t("addDepartment.title")}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* שדה שם המחלקה */}
        <div className="mb-4">
          <label htmlFor="name" className="block font-medium mb-1">
            {t("addDepartment.nameLabel")}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-border-color p-2 rounded bg-base-100 text-text"
          />
        </div>

        {/* שדה תיאור */}
        <div className="mb-4">
          <label htmlFor="description" className="block font-medium mb-1">
            {t("addDepartment.descriptionLabel")}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full border border-border-color p-2 rounded bg-base-100 text-text"
          ></textarea>
        </div>

        {/* שדה מנהל מחלקה */}
        <div className="mb-4">
          <label htmlFor="managerId" className="block font-medium mb-1">
            {t("addDepartment.managerLabel", "מנהל מחלקה")}
          </label>
          <select
            id="managerId"
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
            required
            className="w-full border border-border-color p-2 rounded bg-base-100 text-text"
          >
            <option value="">
              {t("addDepartment.selectManager", "בחר מנהל מחלקה")}
            </option>
            {employees
              .filter((employee) => employee.role === "Manager")
              .map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} {employee.lastName}
                </option>
              ))}
          </select>
        </div>

        {/* תפריט גלילה לבחירת עובדים (בחירה מרובה) */}
        <div className="mb-4">
          <label htmlFor="teamMembers" className="block font-medium mb-1">
            {t("addDepartment.teamMembersLabel")}
          </label>
          <select
            id="teamMembers"
            name="teamMembers"
            multiple
            value={formData.teamMembers}
            onChange={handleTeamMembersChange}
            className="w-full border border-border-color p-2 rounded h-40 overflow-y-scroll bg-base-100 text-text"
          >
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name} {employee.lastName} - {employee.role}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-button-text px-4 py-2 rounded"
        >
          {loading
            ? t("addDepartment.creating")
            : t("addDepartment.submitButton")}
        </button>
      </form>
    </div>
  );
};

export default Add_Department;
