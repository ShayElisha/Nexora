import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";

const ShiftsList = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Fetch shifts with date filtering
  const fetchShifts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) {
        params.endDate = endDate;
      } else if (startDate) {
        params.endDate = startDate;
      }
      const response = await axiosInstance.get("/shifts", { params });
      setShifts(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "שגיאה בשליפת המשמרות. אנא נסה שוב."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load shifts on component mount or date change
  useEffect(() => {
    fetchShifts();
  }, [startDate, endDate]);

  // Calculate job percentage
  const calculateJobPercentage = (hoursWorked, fullTimeHours = 42) => {
    if (!hoursWorked || !fullTimeHours) return "0.0";
    return ((hoursWorked / fullTimeHours) * 100).toFixed(1);
  };

  // Format date and time
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Clear filter
  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    setError("");
  };

  // Toggle row expansion
  const toggleRow = (shiftId) => {
    setExpandedRow(expandedRow === shiftId ? null : shiftId);
  };

  // Map rateType to Hebrew
  const getRateTypeLabel = (rateType) => {
    switch (rateType) {
      case "Regular":
        return "רגיל";
      case "Overtime125":
        return "נוספות 125%";
      case "Overtime150":
        return "נוספות 150%";
      case "Night":
        return "לילה";
      case "Holiday":
        return "חג";
      case "Rest":
        return "מנוחה";
      default:
        return rateType;
    }
  };

  // Start editing a row
  const startEditing = (shift) => {
    setEditingRow(shift._id);
    setEditFormData({
      shiftDate: shift.shiftDate.split("T")[0],
      startTime: shift.startTime
        ? new Date(shift.startTime).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "",
      endTime: shift.endTime
        ? new Date(shift.endTime).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "",
      hoursWorked: shift.hoursWorked,
      hourlySalary: shift.hourlySalary,
      notes: shift.notes || "",
      isNextDay:
        shift.endTime &&
        new Date(shift.endTime).getDate() !==
          new Date(shift.shiftDate).getDate(),
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate form data
  const validateFormData = (formData) => {
    if (!formData.shiftDate || isNaN(Date.parse(formData.shiftDate))) {
      return "תאריך המשמרת חובה וחייב להיות תקין";
    }
    if (!formData.startTime) {
      return "שעת התחלה היא שדה חובה";
    }
    if (formData.hoursWorked && isNaN(parseFloat(formData.hoursWorked))) {
      return "שעות עבודה חייבות להיות מספר תקין";
    }
    if (formData.hourlySalary && isNaN(parseFloat(formData.hourlySalary))) {
      return "שכר שעתי חייב להיות מספר תקין";
    }
    if (formData.startTime && formData.endTime) {
      const startDateTime = new Date(
        `${formData.shiftDate}T${formData.startTime}:00`
      );
      let endDateTime = new Date(
        `${formData.shiftDate}T${formData.endTime}:00`
      );

      // אם המשמרת חוצה חצות, הוסף יום ל-endDateTime
      if (formData.isNextDay || formData.endTime < formData.startTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      if (endDateTime <= startDateTime) {
        return "שעת הסיום חייבת להיות מאוחרת משעת ההתחלה";
      }
    }
    return null;
  };

  // Save changes
  const saveChanges = async (shiftId) => {
    // Validate form data
    const validationError = validateFormData(editFormData);
    if (validationError) {
      toast.error(validationError, {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      const updatedShift = {
        shiftDate: new Date(editFormData.shiftDate).toISOString(),
        startTime: editFormData.startTime
          ? new Date(
              `${editFormData.shiftDate}T${editFormData.startTime}:00`
            ).toISOString()
          : null,
        endTime: editFormData.endTime
          ? new Date(
              `${editFormData.shiftDate}T${editFormData.endTime}:00${
                editFormData.isNextDay ? " +1 day" : ""
              }`
            ).toISOString()
          : null,
        hoursWorked: parseFloat(editFormData.hoursWorked) || 0,
        hourlySalary: parseFloat(editFormData.hourlySalary) || 0,
        notes: editFormData.notes || "",
      };

      // Adjust endTime if it crosses midnight
      if (
        editFormData.isNextDay ||
        (editFormData.endTime && editFormData.endTime < editFormData.startTime)
      ) {
        const endDate = new Date(editFormData.shiftDate);
        endDate.setDate(endDate.getDate() + 1);
        updatedShift.endTime = new Date(
          `${endDate.toISOString().split("T")[0]}T${editFormData.endTime}:00`
        ).toISOString();
      }

      const response = await axiosInstance.put(
        `/shifts/${shiftId}`,
        updatedShift
      );
      setShifts((prev) =>
        prev.map((shift) =>
          shift._id === shiftId ? { ...shift, ...response.data.data } : shift
        )
      );
      setEditingRow(null);
      toast.success("המשמרת עודכנה בהצלחה", {
        position: "top-right",
        duration: 3000,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "שגיאה בעדכון המשמרת. אנא נסה שוב.",
        {
          position: "top-right",
          duration: 3000,
        }
      );
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingRow(null);
    setEditFormData({});
  };

  return (
    <div className="max-w-full mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">רשימת משמרות</h2>

      {/* Date filter form */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              תאריך התחלה
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              תאריך סיום
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={clearFilter}
            className="bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400 mt-4 sm:mt-0"
          >
            נקה סינון
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">טוען...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center text-gray-500">
          לא נמצאו משמרות עבור חברה זו.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-right">עובד</th>
                <th className="py-3 px-6 text-right">תאריך</th>
                <th className="py-3 px-6 text-right">שעת התחלה</th>
                <th className="py-3 px-6 text-right">שעת סיום</th>
                <th className="py-3 px-6 text-right">שעות עבודה</th>
                <th className="py-3 px-6 text-right">סוג משמרת</th>
                <th className="py-3 px-6 text-right">סוג יום</th>
                <th className="py-3 px-6 text-right">חלוקת שעות</th>
                <th className="py-3 px-6 text-right">שכר שעתי</th>
                <th className="py-3 px-6 text-right">שכר כולל</th>
                <th className="py-3 px-6 text-right">אחוזי משרה</th>
                <th className="py-3 px-6 text-right">הערות</th>
                <th className="py-3 px-6 text-right">פעולות</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {shifts.map((shift) => (
                <React.Fragment key={shift._id}>
                  <tr
                    onClick={() => toggleRow(shift._id)}
                    className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      {shift.employeeId
                        ? `${shift.employeeId.name} ${shift.employeeId.lastName}`
                        : "-"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingRow === shift._id ? (
                        <input
                          type="date"
                          name="shiftDate"
                          value={editFormData.shiftDate}
                          onChange={handleInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 border border-gray-300 rounded-md w-full"
                        />
                      ) : (
                        formatDate(shift.shiftDate)
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingRow === shift._id ? (
                        <input
                          type="time"
                          name="startTime"
                          value={editFormData.startTime}
                          onChange={handleInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 border border-gray-300 rounded-md w-full"
                        />
                      ) : (
                        formatTime(shift.startTime)
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingRow === shift._id ? (
                        <input
                          type="time"
                          name="endTime"
                          value={editFormData.endTime}
                          onChange={handleInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 border border-gray-300 rounded-md w-full"
                        />
                      ) : (
                        formatTime(shift.endTime)
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingRow === shift._id ? (
                        <input
                          type="number"
                          name="hoursWorked"
                          value={editFormData.hoursWorked}
                          onChange={handleInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 border border-gray-300 rounded-md w-full"
                          step="0.01"
                        />
                      ) : (
                        shift.hoursWorked.toFixed(2)
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {shift.shiftType === "Day" ? "יום" : "לילה"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {shift.dayType === "Regular"
                        ? "רגיל"
                        : shift.dayType === "Holiday"
                        ? "חג"
                        : "מנוחה"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {shift.shiftBreakdown && shift.shiftBreakdown.length > 0
                        ? "לחץ לפירוט"
                        : "-"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingRow === shift._id ? (
                        <input
                          type="number"
                          name="hourlySalary"
                          value={editFormData.hourlySalary}
                          onChange={handleInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 border border-gray-300 rounded-md w-full"
                          step="0.01"
                        />
                      ) : (
                        `₪${shift.hourlySalary.toFixed(2)}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {`₪${
                        shift.totalPay ? shift.totalPay.toFixed(2) : "0.00"
                      }`}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {calculateJobPercentage(
                        editingRow === shift._id
                          ? parseFloat(editFormData.hoursWorked)
                          : shift.hoursWorked,
                        42
                      )}
                      %
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingRow === shift._id ? (
                        <input
                          type="text"
                          name="notes"
                          value={editFormData.notes}
                          onChange={handleInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 border border-gray-300 rounded-md w-full"
                        />
                      ) : (
                        shift.notes || "-"
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingRow === shift._id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveChanges(shift._id);
                            }}
                            className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                          >
                            שמור
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                          >
                            בטל
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(shift);
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                        >
                          ערוך
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRow === shift._id &&
                    shift.shiftBreakdown &&
                    shift.shiftBreakdown.length > 0 && (
                      <tr>
                        <td colSpan="13" className="bg-gray-50 p-4">
                          <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <h3 className="text-lg font-semibold mb-2">
                              פירוט חלוקת שעות
                            </h3>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="py-2 px-4 text-right">
                                    סוג שעות
                                  </th>
                                  <th className="py-2 px-4 text-right">שעות</th>
                                  <th className="py-2 px-4 text-right">מקדם</th>
                                </tr>
                              </thead>
                              <tbody>
                                {shift.shiftBreakdown.map((part, index) => (
                                  <tr
                                    key={index}
                                    className="border-b border-gray-200"
                                  >
                                    <td className="py-2 px-4 text-right">
                                      {getRateTypeLabel(part.rateType)}
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                      {part.hours.toFixed(2)}
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                      x{part.multiplier.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShiftsList;
