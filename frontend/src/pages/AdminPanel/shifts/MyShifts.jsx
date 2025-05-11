import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";

const MyShifts = () => {
  const { t } = useTranslation();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchMyShifts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/shifts/my");
      setShifts(response.data.data);
    } catch (err) {
      toast.error(t("myShifts.errorFetchingShifts") + " " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyShifts();
  }, []);

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

  const toggleRow = (shiftId) => {
    setExpandedRow(expandedRow === shiftId ? null : shiftId);
  };

  const getRateTypeLabel = (rateType) => {
    return t(`myShifts.rateTypes.${rateType}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {t("myShifts.myShifts")}
      </h2>

      {loading ? (
        <div className="text-center text-gray-500">{t("myShifts.loading")}</div>
      ) : shifts.length === 0 ? (
        <div className="text-center text-gray-500">
          {t("myShifts.noShiftsFound")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-right">{t("myShifts.date")}</th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.startTime")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.endTime")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.hoursWorked")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.shiftType")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.dayType")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.shiftBreakdown")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.hourlySalary")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.totalPay")}
                </th>
                <th className="py-3 px-6 text-right">
                  {t("myShifts.jobPercentage")}
                </th>
                <th className="py-3 px-6 text-right">{t("myShifts.notes")}</th>
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
                      {t(`myShifts.shiftTypes.${shift.shiftType}`)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {t(`myShifts.dayTypes.${shift.dayType}`)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {shift.shiftBreakdown && shift.shiftBreakdown.length > 0
                        ? t("myShifts.clickForDetails")
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
                              {t("myShifts.breakdownDetails")}
                            </h3>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="py-2 px-4 text-right">
                                    {t("myShifts.rateType")}
                                  </th>
                                  <th className="py-2 px-4 text-right">
                                    {t("myShifts.hours")}
                                  </th>
                                  <th className="py-2 px-4 text-right">
                                    {t("myShifts.multiplier")}
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

export default MyShifts;
