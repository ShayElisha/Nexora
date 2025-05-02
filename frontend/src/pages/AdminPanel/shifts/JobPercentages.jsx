import { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";

const JobPercentages = () => {
  const [formData, setFormData] = useState({
    rateType: "Regular",
    multiplier: 1.0,
    fullTimeHours: "",
    hoursThreshold: "",
    description: "",
    isActive: true,
    workHours: {
      startTime: "06:00",
      endTime: "18:00", // שינוי לדוגמה של 6:00-18:00
    },
    workDaysPerWeek: 5, // ברירת מחדל: 5 ימי עבודה בשבוע
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payRates, setPayRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayRateId, setEditingPayRateId] = useState(null);

  // פונקציה לחישוב שעות יומיות מתוך workHours
  const calculateDailyHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    if (end < start) end.setDate(end.getDate() + 1); // טיפול במשמרות שחוצות יום
    const hours = (end - start) / (1000 * 60 * 60); // המרה למילישניות לשעות
    return hours;
  };

  // פונקציה לחישוב אחוזי משרה
  const calculateJobPercentage = (
    dailyHours,
    workDaysPerWeek,
    fullTimeHours
  ) => {
    if (!dailyHours || !workDaysPerWeek || !fullTimeHours) return 0;
    const weeklyHours = dailyHours * workDaysPerWeek;
    return ((weeklyHours / fullTimeHours) * 100).toFixed(1); // אחוזים עם ספרה אחת אחרי הנקודה
  };

  // חישוב שעות יומיות ואחוזי משרה עבור התצוגה
  const dailyHours = calculateDailyHours(
    formData.workHours.startTime,
    formData.workHours.endTime
  );
  const jobPercentage = calculateJobPercentage(
    dailyHours,
    formData.workDaysPerWeek,
    formData.fullTimeHours
  );

  // שליפת תעריפים קיימים
  const fetchPayRates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/payRate`);
      setPayRates(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error fetching pay rates. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // טעינת תעריפים בעת טעינת הקומפוננטה
  useEffect(() => {
    fetchPayRates();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("workHours.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        workHours: {
          ...prev.workHours,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? parseFloat(value) || ""
            : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ולידציה בסיסית
    if (!formData.rateType || !formData.multiplier) {
      setError("Rate type and multiplier are required");
      return;
    }
    if (formData.multiplier < 1) {
      setError("Multiplier must be at least 1.0");
      return;
    }
    // ולידציה לשעות עבודה
    const { startTime, endTime } = formData.workHours;
    if (
      (startTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) ||
      (endTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime))
    ) {
      setError("Invalid time format for start time or end time (use HH:MM)");
      return;
    }
    // ולידציה לימי עבודה
    if (formData.workDaysPerWeek < 1 || formData.workDaysPerWeek > 7) {
      setError("Work days per week must be between 1 and 7");
      return;
    }
    // אזהרות
    if (formData.rateType === "Regular" && !formData.fullTimeHours) {
      console.warn("Full-time hours are recommended for Regular rate type");
    }
    if (
      ["Overtime125", "Overtime150"].includes(formData.rateType) &&
      !formData.hoursThreshold
    ) {
      console.warn("Hours threshold is recommended for Overtime rate types");
    }

    try {
      const payload = {
        rateType: formData.rateType,
        multiplier: parseFloat(formData.multiplier),
        fullTimeHours: formData.fullTimeHours
          ? parseFloat(formData.fullTimeHours)
          : undefined,
        hoursThreshold: formData.hoursThreshold
          ? parseFloat(formData.hoursThreshold)
          : undefined,
        description: formData.description,
        isActive: formData.isActive,
        workHours: formData.workHours,
        workDaysPerWeek: formData.workDaysPerWeek,
      };

      if (isEditing) {
        // עדכון תעריף קיים
        const response = await axiosInstance.put(
          `/payRate/${editingPayRateId}`,
          payload
        );
        setSuccess("Pay rate updated successfully!");
      } else {
        // יצירת תעריף חדש
        const response = await axiosInstance.post(`/payRate`, payload);
        setSuccess("Pay rate created successfully!");
      }

      // איפוס הטופס ומצב העריכה
      setFormData({
        rateType: "Regular",
        multiplier: 1.0,
        fullTimeHours: "",
        hoursThreshold: "",
        description: "",
        isActive: true,
        workHours: {
          startTime: "06:00",
          endTime: "18:00",
        },
        workDaysPerWeek: 5,
      });
      setIsEditing(false);
      setEditingPayRateId(null);
      // רענון רשימ�ת התעריפים
      fetchPayRates();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error processing pay rate. Please try again."
      );
    }
  };

  // מילוי הטופס לטובת עריכה
  const handleEdit = (rate) => {
    setFormData({
      rateType: rate.rateType,
      multiplier: rate.multiplier,
      fullTimeHours: rate.fullTimeHours ? rate.fullTimeHours.toString() : "",
      hoursThreshold: rate.hoursThreshold ? rate.hoursThreshold.toString() : "",
      description: rate.description || "",
      isActive: rate.isActive,
      workHours: {
        startTime: rate.workHours?.startTime || "06:00",
        endTime: rate.workHours?.endTime || "18:00",
      },
      workDaysPerWeek: rate.workDaysPerWeek || 5,
    });
    setIsEditing(true);
    setEditingPayRateId(rate._id);
    setError("");
    setSuccess("");
  };

  // מחיקת תעריף
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this pay rate?")) {
      return;
    }
    try {
      await axiosInstance.delete(`/payRate/${id}`);
      setSuccess("Pay rate deactivated successfully!");
      fetchPayRates();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error deactivating pay rate. Please try again."
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* טופס יצירת/עדכון תעריף */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isEditing ? "Update Pay Rate" : "Create Pay Rate"}
        </h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* סוג התעריף */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rate Type
            </label>
            <select
              name="rateType"
              value={formData.rateType}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Regular">Regular (100%)</option>
              <option value="Overtime125">Overtime 125%</option>
              <option value="Overtime150">Overtime 150%</option>
              <option value="Night">Night Shift</option>
              <option value="Holiday">Holiday</option>
              <option value="RestDay">Rest Day</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* מכפיל שכר */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Multiplier
            </label>
            <input
              type="number"
              name="multiplier"
              value={formData.multiplier}
              onChange={handleChange}
              step="0.01"
              min="1"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1.25 for 125%"
            />
          </div>

          {/* שעות שבועיות למשרה מלאה */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full-Time Hours (Weekly)
            </label>
            <input
              type="number"
              name="fullTimeHours"
              value={formData.fullTimeHours}
              onChange={handleChange}
              step="0.1"
              min="0"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 42 for 100% job"
            />
            {formData.rateType === "Regular" && !formData.fullTimeHours && (
              <p className="text-sm text-yellow-600 mt-1">
                Recommended for Regular rate type
              </p>
            )}
          </div>

          {/* סף שעות יומי */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hours Threshold (Daily)
            </label>
            <input
              type="number"
              name="hoursThreshold"
              value={formData.hoursThreshold}
              onChange={handleChange}
              step="0.1"
              min="0"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 8 for Overtime125"
            />
            {["Overtime125", "Overtime150"].includes(formData.rateType) &&
              !formData.hoursThreshold && (
                <p className="text-sm text-yellow-600 mt-1">
                  Recommended for Overtime rate types
                </p>
              )}
          </div>

          {/* שעות עבודה - התחלה */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Time (HH:MM)
            </label>
            <input
              type="text"
              name="workHours.startTime"
              value={formData.workHours.startTime}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 06:00"
            />
          </div>

          {/* שעות עבודה - סיום */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Time (HH:MM)
            </label>
            <input
              type="text"
              name="workHours.endTime"
              value={formData.workHours.endTime}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 18:00"
            />
          </div>

          {/* תיאור */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
              rows="4"
            />
          </div>

          {/* סטטוס פעיל */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          {/* כפתור שליחה */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEditing ? "Update Pay Rate" : "Create Pay Rate"}
          </button>

          {/* כפתור ביטול בעת עריכה */}
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setFormData({
                  rateType: "Regular",
                  multiplier: 1.0,
                  fullTimeHours: "",
                  hoursThreshold: "",
                  description: "",
                  isActive: true,
                  workHours: {
                    startTime: "06:00",
                    endTime: "18:00",
                  },
                  workDaysPerWeek: 5,
                });
                setIsEditing(false);
                setEditingPayRateId(null);
                setError("");
                setSuccess("");
              }}
              className="w-full bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400 mt-2"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* הצגת תעריפים קיימים ככרטיסיות */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Existing Pay Rates</h3>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : payRates.length === 0 ? (
          <div className="text-center text-gray-500">
            No pay rates found for this company.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payRates.map((rate) => {
              const rateDailyHours = calculateDailyHours(
                rate.workHours?.startTime,
                rate.workHours?.endTime
              );
              const rateJobPercentage = calculateJobPercentage(
                rateDailyHours,
                rate.workDaysPerWeek,
                rate.fullTimeHours
              );
              return (
                <div
                  key={rate._id}
                  className={`p-4 border rounded-lg shadow-sm ${
                    rate.isActive ? "bg-green-50" : "bg-gray-100"
                  } relative`}
                >
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(rate)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit Pay Rate"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(rate._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Deactivate Pay Rate"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800">
                    {rate.rateType}
                  </h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Multiplier:</span>{" "}
                    {rate.multiplier.toFixed(2)}x
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      Full-Time Hours (Weekly):
                    </span>{" "}
                    {rate.fullTimeHours ? rate.fullTimeHours.toFixed(1) : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      Hours Threshold (Daily):
                    </span>{" "}
                    {rate.hoursThreshold ? rate.hoursThreshold.toFixed(1) : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Work Hours:</span>{" "}
                    {rate.workHours?.startTime && rate.workHours?.endTime
                      ? `${rate.workHours.startTime} - ${rate.workHours.endTime}`
                      : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Description:</span>{" "}
                    {rate.description || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Status:</span>{" "}
                    {rate.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPercentages;
