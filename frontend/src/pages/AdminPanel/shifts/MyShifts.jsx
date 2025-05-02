import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";

const MyShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState(null); // Track which row is expanded

  // Fetch user's shifts
  const fetchMyShifts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/shifts/my");
      setShifts(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "שגיאה בשליפת המשמרות. אנא נסה שוב."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load shifts on component mount
  useEffect(() => {
    fetchMyShifts();
  }, []);

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">המשמרות שלי</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">טוען...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center text-gray-500">לא נמצאו משמרות.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
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
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {shifts.map((shift) => (
                <React.Fragment key={shift._id}>
                  <tr
                    onClick={() => toggleRow(shift._id)}
                    className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="py-3 px-6 text-right">
                      {formatDate(shift.shiftDate)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {formatTime(shift.startTime)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {formatTime(shift.endTime)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {shift.hoursWorked.toFixed(2)}
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
                      ₪{shift.hourlySalary.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      ₪{shift.totalPay ? shift.totalPay.toFixed(2) : "0.00"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {calculateJobPercentage(shift.hoursWorked, 42)}%
                    </td>
                    <td className="py-3 px-6 text-right">
                      {shift.notes || "-"}
                    </td>
                  </tr>
                  {expandedRow === shift._id &&
                    shift.shiftBreakdown &&
                    shift.shiftBreakdown.length > 0 && (
                      <tr>
                        <td colSpan="11" className="bg-gray-50 p-4">
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

export default MyShifts;
