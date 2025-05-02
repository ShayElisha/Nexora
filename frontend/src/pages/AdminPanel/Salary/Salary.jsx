import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { FaEdit } from "react-icons/fa";

const Salary = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingSalary, setEditingSalary] = useState(null);
  const [newTax, setNewTax] = useState({ description: "", percentage: "" });
  const [showTaxForm, setShowTaxForm] = useState(null);

  // Fetch salaries grouped by employee
  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/salary");
      const formattedSalaries = response.data.data.map((salary) => ({
        ...salary,
        employeeName: `${salary.employeeId?.name || ""} ${
          salary.employeeId?.lastName || ""
        }`,
        totalHours: Number(salary.totalHours).toFixed(2),
        totalPay: Number(salary.totalPay).toFixed(2),
        bonus: salary.bonus ? Number(salary.bonus).toFixed(2) : "0.00",
        netPay: Number(salary.netPay).toFixed(2),
        taxDeduction: salary.taxDeduction
          ? Number(salary.taxDeduction).toFixed(2)
          : "0.00",
        otherDeductions: salary.otherDeductions.map((deduction) => ({
          ...deduction,
          amount: Number(deduction.amount).toFixed(2),
        })),
      }));
      setSalaries(formattedSalaries);
    } catch (err) {
      setError(
        err.response?.data?.message || "שגיאה בשליפת המשכורות. אנא נסה שוב."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load salaries on component mount
  useEffect(() => {
    fetchSalaries();
  }, []);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Format status
  const formatStatus = (status) => {
    switch (status) {
      case "Draft":
        return "טיוטה";
      case "Approved":
        return "מאושר";
      case "Paid":
        return "שולם";
      case "Canceled":
        return "בוטל";
      default:
        return status;
    }
  };

  // Toggle row expansion
  const toggleRow = (salaryId) => {
    setExpandedRow(expandedRow === salaryId ? null : salaryId);
  };

  // Handle edit button click
  const handleEdit = (salary) => {
    setEditingSalary({ ...salary });
  };

  // Handle input change for editing
  const handleInputChange = (e, field) => {
    const value = field === "status" ? e.target.value : e.target.value;
    setEditingSalary({ ...editingSalary, [field]: value });
  };

  // Handle tax input change
  const handleTaxInputChange = (e, field) => {
    setNewTax({ ...newTax, [field]: e.target.value });
  };

  // Save edited salary
  const saveEdit = async () => {
    try {
      await axiosInstance.put(`/salary/${editingSalary._id}`, editingSalary);
      setSalaries(
        salaries.map((s) =>
          s._id === editingSalary._id ? { ...editingSalary } : s
        )
      );
      setEditingSalary(null);
    } catch (err) {
      setError("שגיאה בעדכון המשכורת. אנא נסה שוב.");
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingSalary(null);
  };

  // Add new tax deduction
  const addTaxDeduction = async (salaryId) => {
    if (!newTax.description || !newTax.percentage || newTax.percentage <= 0) {
      setError("אנא מלא תיאור ואחוז תקין עבור המס.");
      return;
    }

    try {
      const salary = salaries.find((s) => s._id === salaryId);
      const taxPercentage = Number(newTax.percentage);
      const taxAmount = (
        (taxPercentage / 100) *
        Number(salary.totalPay)
      ).toFixed(2);
      const newDeduction = {
        description: newTax.description,
        amount: taxAmount,
      };
      const updatedDeductions = [...salary.otherDeductions, newDeduction];
      const totalDeductions = updatedDeductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0
      );
      const updatedTaxDeduction = Number(salary.taxDeduction || 0);
      const updatedNetPay = (
        Number(salary.totalPay) -
        (updatedTaxDeduction + totalDeductions)
      ).toFixed(2);

      const updatedSalary = {
        ...salary,
        otherDeductions: updatedDeductions,
        netPay: updatedNetPay,
      };

      await axiosInstance.put(`/salary/${salaryId}`, updatedSalary);
      setSalaries(
        salaries.map((s) => (s._id === salaryId ? updatedSalary : s))
      );
      setNewTax({ description: "", percentage: "" });
      setShowTaxForm(null);
    } catch (err) {
      setError("שגיאה בהוספת המס. אנא נסה שוב.");
    }
  };

  // Cancel adding tax
  const cancelAddTax = () => {
    setNewTax({ description: "", percentage: "" });
    setShowTaxForm(null);
  };

  return (
    <div className="max-w-full mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">רשימת משכורות</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">טוען...</div>
      ) : salaries.length === 0 ? (
        <div className="text-center text-gray-500">לא נמצאו משכורות.</div>
      ) : (
        <div className="overflow-x-auto ml-[100px]">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-right">עובד</th>
                <th className="py-3 px-6 text-right">תקופה</th>
                <th className="py-3 px-6 text-right">שעות עבודה</th>
                <th className="py-3 px-6 text-right">שכר ברוטו</th>
                <th className="py-3 px-6 text-right">בונוס</th>
                <th className="py-3 px-6 text-right">מס הכנסה</th>
                <th className="py-3 px-6 text-right">ניכויים נוספים</th>
                <th className="py-3 px-6 text-right">שכר נטו</th>
                <th className="py-3 px-6 text-right">סטטוס</th>
                <th className="py-3 px-6 text-right">הערות</th>
                <th className="py-3 px-6 text-right">פעולות</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {salaries.map((salary) => (
                <React.Fragment key={salary._id}>
                  <tr
                    onClick={() => toggleRow(salary._id)}
                    className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="py-3 px-6 text-right">
                      {salary.employeeName}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {`${formatDate(salary.periodStart)} - ${formatDate(
                        salary.periodEnd
                      )}`}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingSalary.totalHours}
                          onChange={(e) => handleInputChange(e, "totalHours")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        salary.totalHours
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingSalary.totalPay}
                          onChange={(e) => handleInputChange(e, "totalPay")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `₪${salary.totalPay}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="any"
                          value={editingSalary.bonus || 0}
                          onChange={(e) => handleInputChange(e, "bonus")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `₪${salary.bonus}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingSalary.taxDeduction || 0}
                          onChange={(e) => handleInputChange(e, "taxDeduction")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `₪${salary.taxDeduction}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {salary.otherDeductions &&
                      salary.otherDeductions.length > 0
                        ? "לחץ לפירוט"
                        : "-"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingSalary.netPay}
                          onChange={(e) => handleInputChange(e, "netPay")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `₪${salary.netPay}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <select
                          value={editingSalary.status}
                          onChange={(e) => handleInputChange(e, "status")}
                          className="border p-1 rounded"
                        >
                          <option value="Draft">טיוטה</option>
                          <option value="Approved">מאושר</option>
                          <option value="Paid">שולם</option>
                          <option value="Canceled">בוטל</option>
                        </select>
                      ) : (
                        formatStatus(salary.status)
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="text"
                          value={editingSalary.notes || ""}
                          onChange={(e) => handleInputChange(e, "notes")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        salary.notes || "-"
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <div>
                          <button
                            onClick={saveEdit}
                            className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                          >
                            שמור
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-red-500 text-white px-2 py-1 rounded"
                          >
                            בטל
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FaEdit
                            className="text-blue-500 cursor-pointer"
                            onClick={() => handleEdit(salary)}
                          />
                          <button
                            onClick={() => setShowTaxForm(salary._id)}
                            className="bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            הוסף מס
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {showTaxForm === salary._id && (
                    <tr>
                      <td colSpan="11" className="bg-gray-50 p-4">
                        <div className="border rounded-lg p-4 bg-white shadow-sm">
                          <h3 className="text-lg font-semibold mb-2">
                            הוספת מס
                          </h3>
                          <div className="flex gap-4 mb-4">
                            <input
                              type="text"
                              placeholder="תיאור המס"
                              value={newTax.description}
                              onChange={(e) =>
                                handleTaxInputChange(e, "description")
                              }
                              className="border p-2 rounded w-full"
                            />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="אחוז המס (%)"
                              value={newTax.percentage}
                              onChange={(e) =>
                                handleTaxInputChange(e, "percentage")
                              }
                              className="border p-2 rounded w-full"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => addTaxDeduction(salary._id)}
                              className="bg-green-500 text-white px-4 py-2 rounded"
                            >
                              הוסף
                            </button>
                            <button
                              onClick={cancelAddTax}
                              className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                              בטל
                            </button>
                            Parque Nacional de Komodo
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedRow === salary._id &&
                    salary.otherDeductions &&
                    salary.otherDeductions.length > 0 && (
                      <tr>
                        <td colSpan="11" className="bg-gray-50 p-4">
                          <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <h3 className="text-lg font-semibold mb-2">
                              פירוט ניכויים
                            </h3>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="py-2 px-4 text-right">
                                    תיאור
                                  </th>
                                  <th className="py-2 px-4 text-right">סכום</th>
                                </tr>
                              </thead>
                              <tbody>
                                {salary.otherDeductions.map(
                                  (deduction, index) => (
                                    <tr
                                      key={index}
                                      className="border-b border-gray-200"
                                    >
                                      <td className="py-2 px-4 text-right">
                                        {deduction.description}
                                      </td>
                                      <td className="py-2 px-4 text-right">
                                        ₪{deduction.amount}
                                      </td>
                                    </tr>
                                  )
                                )}
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

export default Salary;
