import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";

const ShiftsList = () => {
  const { t } = useTranslation();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
      toast.error(t("shifts.errorFetchingShifts"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [startDate, endDate]);

  const calculateJobPercentage = (hoursWorked, fullTimeHours = 42) => {
    if (!hoursWorked || !fullTimeHours) return "0.0";
    return ((hoursWorked / fullTimeHours) * 100).toFixed(1);
  };

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

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    toast(t("shifts.filterCleared"));
  };

  const toggleRow = (shiftId) => {
    setExpandedRow(expandedRow === shiftId ? null : shiftId);
  };

  const getRateTypeLabel = (rateType) => {
    return t(`shifts.rateTypes.${rateType}`);
  };

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
    toast(t("shifts.editMode"));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateFormData = (formData) => {
    if (!formData.shiftDate || isNaN(Date.parse(formData.shiftDate))) {
      return t("shifts.invalidShiftDate");
    }
    if (!formData.startTime) {
      return t("shifts.startTimeRequired");
    }
    if (formData.hoursWorked && isNaN(parseFloat(formData.hoursWorked))) {
      return t("shifts.invalidHoursWorked");
    }
    if (formData.hourlySalary && isNaN(parseFloat(formData.hourlySalary))) {
      return t("shifts.invalidHourlySalary");
    }
    if (formData.startTime && formData.endTime) {
      const startDateTime = new Date(
        `${formData.shiftDate}T${formData.startTime}:00`
      );
      let endDateTime = new Date(
        `${formData.shiftDate}T${formData.endTime}:00`
      );

      if (formData.isNextDay || formData.endTime < formData.startTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      if (endDateTime <= startDateTime) {
        return t("shifts.invalidEndTime");
      }
    }
    return null;
  };

  const saveChanges = async (shiftId) => {
    const validationError = validateFormData(editFormData);
    if (validationError) {
      toast.error(validationError);
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
      toast.success(t("shifts.shiftUpdatedSuccess"));
    } catch (err) {
      toast.error(t("shifts.errorUpdatingShift"));
    }
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditFormData({});
    toast(t("shifts.cancelled"));
  };

  return (
    <div className="max-w-full mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {t("shifts.shiftsList")}
      </h2>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              {t("shifts.startDate")}
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
              {t("shifts.endDate")}
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
            {t("shifts.clearFilter")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">{t("shifts.loading")}</div>
      ) : shifts.length === 0 ? (
        <div className="text-center text-gray-500">
          {t("shifts.noShiftsFound")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-right">{t("shifts.employee")}</th>
                <th className="py-3 px-6 text-right">{t("shifts.date")}</th>
                <th className="py-3 px-6 text-right">
                  {t("shifts.startTime")}
                </th>
                <th className="py-3 px-6 text-right">{t("shifts.endTime")}</th>
                <th className="py-3 px-6 text-right">
                  {t("shifts.hoursWorked")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("shifts.shiftType")}
                </th>
                <th className="py-3 px-6 text-right">{t("shifts.dayType")}</th>
                <th className="py-3 px-6 text-right">
                  {t("shifts.shiftBreakdown")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("shifts.hourlySalary")}
                </th>
                <th className="py-3 px-6 text-right">{t("shifts.totalPay")}</th>
                <th className="py-3 px-6 text-right">
                  {t("shifts.jobPercentage")}
                </th>
                <th className="py-3 px-6 text-right">{t("shifts.notes")}</th>
                <th className="py-3 px-6 text-right">{t("shifts.actions")}</th>
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
                      {t(`shifts.shiftTypes.${shift.shiftType}`)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {t(`shifts.dayTypes.${shift.dayType}`)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {shift.shiftBreakdown && shift.shiftBreakdown.length > 0
                        ? t("shifts.clickForDetails")
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
                            {t("shifts.save")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                          >
                            {t("shifts.cancel")}
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
                          {t("shifts.edit")}
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
                              {t("shifts.breakdownDetails")}
                            </h3>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="py-2 px-4 text-right">
                                    {t("shifts.rateType")}
                                  </th>
                                  <th className="py-2 px-4 text-right">
                                    {t("shifts.hours")}
                                  </th>
                                  <th className="py-2 px-4 text-right">
                                    {t("shifts.multiplier")}
                                  </th>
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
