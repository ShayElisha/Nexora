import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import { FaEdit, FaFilePdf } from "react-icons/fa";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

const Salary = () => {
  const { t } = useTranslation();
  const [salaries, setSalaries] = useState([]);
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingSalary, setEditingSalary] = useState(null);
  const [taxCalcInput, setTaxCalcInput] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    taxConfigId: "",
  });
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipUrl, setPayslipUrl] = useState("");

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
        currency: salary.currency || "ILS",
      }));
      setSalaries(formattedSalaries);
    } catch (err) {
      toast.error(t("salary.errorFetchingSalaries") + " " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxConfigs = async () => {
    try {
      const response = await axiosInstance.get("/tax-config");
      setTaxConfigs(response.data.data.filter((config) => config.isActive));
    } catch (err) {
      toast.error(t("salary.errorFetchingTaxConfigs") + " " + err.message);
    }
  };

  useEffect(() => {
    fetchSalaries();
    fetchTaxConfigs();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatStatus = (status) => {
    return t(`salary.status.${status}`);
  };

  const formatCurrency = (currency) => {
    return t(`salary.currencies.${currency}`);
  };

  const toggleRow = (salaryId) => {
    setExpandedRow(expandedRow === salaryId ? null : salaryId);
  };

  const handleEdit = (salary) => {
    setEditingSalary({ ...salary });
    toast(t("salary.editMode"));
  };

  const handleInputChange = (e, field) => {
    const value = field === "status" ? e.target.value : e.target.value;
    setEditingSalary({ ...editingSalary, [field]: value });
  };

  const handleTaxCalcInputChange = (e, field) => {
    setTaxCalcInput({ ...taxCalcInput, [field]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      await axiosInstance.put(`/salary/${editingSalary._id}`, editingSalary);
      setSalaries(
        salaries.map((s) =>
          s._id === editingSalary._id ? { ...editingSalary } : s
        )
      );
      setEditingSalary(null);
      fetchSalaries();
      toast.success(t("salary.updatedSuccess"));
    } catch (err) {
      toast.error(t("salary.errorUpdatingSalary") + " " + err.message);
    }
  };

  const cancelEdit = () => {
    setEditingSalary(null);
    toast(t("salary.cancelled"));
  };

  const calculateTaxesForMonth = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const payload = {
        year: Number(taxCalcInput.year),
        month: Number(taxCalcInput.month),
        taxConfigId: taxCalcInput.taxConfigId,
      };

      if (!payload.taxConfigId) {
        throw new Error(t("salary.selectTaxConfig"));
      }

      const response = await axiosInstance.post(
        "/salary/calculate-taxes-for-month",
        payload
      );
      toast.success(response.data.message);
      fetchSalaries();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t("salary.errorCalculatingTax");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generatePayslip = (salary) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.setFont("Helvetica");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const textLeft = (text, x, y, maxWidth = 180) => {
        doc.text(text, x, y, { align: "left", maxWidth });
      };

      const textRight = (text, x, y, maxWidth = 180) => {
        doc.text(text, x, y, { align: "right", maxWidth });
      };

      const addTableRow = (
        x,
        y,
        col1,
        col2,
        col3,
        col4,
        col5,
        isHeader = false
      ) => {
        if (isHeader) {
          doc.setFillColor(200, 200, 200);
          doc.rect(x, y - 4, 170, 8, "F");
        }
        textLeft(col1, x, y);
        textLeft(col2, x + 40, y);
        textLeft(col3, x + 80, y);
        textLeft(col4, x + 110, y);
        textLeft(col5, x + 140, y);
      };

      doc.setFontSize(14);
      textLeft(t("salary.payslip"), 20, 10);
      doc.setFontSize(10);
      textLeft(t("salary.companyName"), 20, 18);
      textLeft(t("salary.companyId"), 20, 24);
      textLeft(`${t("salary.date")}: ${formatDate(new Date())}`, 20, 30);
      textLeft(
        `${t("salary.payPeriod")}: ${formatDate(
          salary.periodStart
        )} - ${formatDate(salary.periodEnd)}`,
        20,
        36
      );
      textRight(`${t("salary.employee")}: ${salary.employeeName}`, 190, 18);
      textRight(
        `${t("salary.id")}: ${salary.employeeId?.idNumber || "N/A"}`,
        190,
        24
      );
      textRight(
        `${t("salary.address")}: ${salary.employeeId?.address || "N/A"}`,
        190,
        30
      );
      textRight(
        `${t("salary.startDate")}: ${salary.employeeId?.startDate || "N/A"}`,
        190,
        36
      );

      let yPos = 50;
      textLeft(t("salary.earnings"), 20, yPos);
      yPos += 8;
      addTableRow(
        20,
        yPos,
        t("salary.code"),
        t("salary.description"),
        t("salary.hours"),
        t("salary.value"),
        t("salary.total"),
        true
      );
      yPos += 8;
      addTableRow(
        20,
        yPos,
        "001",
        t("salary.baseSalary"),
        salary.totalHours,
        salary.totalPay,
        salary.totalPay
      );
      if (salary.bonus && Number(salary.bonus) > 0) {
        addTableRow(
          20,
          yPos + 8,
          "006",
          t("salary.bonus"),
          "",
          salary.bonus,
          salary.bonus
        );
        yPos += 8;
      }
      yPos += 8;
      addTableRow(
        20,
        yPos,
        "103",
        t("salary.totalPayments"),
        "",
        "",
        (Number(salary.totalPay) + Number(salary.bonus)).toFixed(2)
      );

      yPos += 16;
      textLeft(t("salary.deductions"), 20, yPos);
      yPos += 8;
      addTableRow(
        20,
        yPos,
        t("salary.code"),
        t("salary.description"),
        t("salary.rate"),
        t("salary.value"),
        t("salary.total"),
        true
      );
      yPos += 8;
      if (salary.taxDeduction && Number(salary.taxDeduction) > 0) {
        addTableRow(
          20,
          yPos,
          "107",
          t("salary.incomeTax"),
          "",
          salary.taxDeduction,
          salary.taxDeduction
        );
        yPos += 8;
      }
      salary.otherDeductions.forEach((deduction, index) => {
        addTableRow(
          20,
          yPos,
          `10${8 + index}`,
          deduction.description,
          "",
          deduction.amount,
          deduction.amount
        );
        yPos += 8;
      });
      yPos += 8;
      const totalDeductions = (
        Number(salary.taxDeduction) +
        salary.otherDeductions.reduce((sum, d) => sum + Number(d.amount), 0)
      ).toFixed(2);
      addTableRow(
        20,
        yPos,
        "",
        t("salary.totalDeductions"),
        "",
        "",
        totalDeductions
      );

      yPos += 16;
      textLeft(t("salary.netPay"), 20, yPos);
      yPos += 8;
      addTableRow(
        20,
        yPos,
        "",
        t("salary.netAmountPayable"),
        "",
        "",
        salary.netPay
      );

      yPos += 16;
      textLeft(t("salary.signature"), 20, yPos);
      textRight(`${t("salary.date")}: ${formatDate(new Date())}`, 190, yPos);

      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPayslipUrl(pdfUrl);
      setShowPayslipModal(true);

      doc.save(`payslip_${salary.employeeName.replace(/\s+/g, "_")}.pdf`);
      toast.success(t("salary.payslipGenerated"));
    } catch (err) {
      toast.error(t("salary.errorGeneratingPayslip") + err.message);
    }
  };

  const closePayslipModal = () => {
    setShowPayslipModal(false);
    setPayslipUrl("");
    toast(t("salary.modalClosed"));
  };

  return (
    <div className="max-w-full mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {t("salary.salaryList")}
      </h2>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {t("salary.calculateTaxForMonth")}
        </h3>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("salary.year")}
            </label>
            <input
              type="number"
              value={taxCalcInput.year}
              onChange={(e) => handleTaxCalcInputChange(e, "year")}
              className="border p-2 rounded w-full"
              placeholder={t("salary.yearPlaceholder")}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("salary.month")}
            </label>
            <select
              value={taxCalcInput.month}
              onChange={(e) => handleTaxCalcInputChange(e, "month")}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">{t("salary.selectMonth")}</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {t(`salary.months.${i + 1}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("salary.taxConfig")}
            </label>
            <select
              value={taxCalcInput.taxConfigId}
              onChange={(e) => handleTaxCalcInputChange(e, "taxConfigId")}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">{t("salary.selectTaxConfig")}</option>
              {taxConfigs.map((config) => (
                <option key={config._id} value={config._id}>
                  {`${config.taxName} (${config.countryCode}, ${config.currency})`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={calculateTaxesForMonth}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          {loading ? t("salary.calculating") : t("salary.calculateTaxForMonth")}
        </button>
      </div>

      {showPayslipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <h3 className="text-lg font-semibold mb-4">
              {t("salary.payslip")}
            </h3>
            <iframe
              src={payslipUrl}
              className="w-full h-[600px] border rounded"
              title={t("salary.payslipPreview")}
            ></iframe>
            <div className="flex justify-end gap-4 mt-4">
              <a
                href={payslipUrl}
                download={`payslip_${
                  salaries
                    .find(
                      (s) => s._id === (editingSalary?._id || salaries[0]?._id)
                    )
                    ?.employeeName.replace(/\s+/g, "_") || "payslip"
                }.pdf`}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {t("salary.downloadPDF")}
              </a>
              <button
                onClick={closePayslipModal}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                {t("salary.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">{t("salary.loading")}</div>
      ) : salaries.length === 0 ? (
        <div className="text-center text-gray-500">
          {t("salary.noSalariesFound")}
        </div>
      ) : (
        <div className="overflow-x-auto ml-[100px]">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">{t("salary.employee")}</th>
                <th className="py-3 px-6 text-left">{t("salary.period")}</th>
                <th className="py-3 px-6 text-left">
                  {t("salary.totalHours")}
                </th>
                <th className="py-3 px-6 text-left">{t("salary.totalPay")}</th>
                <th className="py-3 px-6 text-left">{t("salary.bonus")}</th>
                <th className="py-3 px-6 text-left">
                  {t("salary.taxDeduction")}
                </th>
                <th className="py-3 px-6 text-left">
                  {t("salary.otherDeductions")}
                </th>
                <th className="py-3 px-6 text-left">{t("salary.netPay")}</th>
                <th className="py-3 px-6 text-left">{t("salary.Status")}</th>
                <th className="py-3 px-6 text-left">{t("salary.notes")}</th>
                <th className="py-3 px-6 text-left">{t("salary.actions")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {salaries.map((salary) => (
                <React.Fragment key={salary._id}>
                  <tr
                    onClick={() => toggleRow(salary._id)}
                    className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="py-3 px-6 text-left">
                      {salary.employeeName}
                    </td>
                    <td className="py-3 px-6 text-left">{`${formatDate(
                      salary.periodStart
                    )} - ${formatDate(salary.periodEnd)}`}</td>
                    <td className="py-3 px-6 text-left">
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
                    <td className="py-3 px-6 text-left">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingSalary.totalPay}
                          onChange={(e) => handleInputChange(e, "totalPay")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `${formatCurrency(salary.currency)}${salary.totalPay}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="any"
                          value={editingSalary.bonus || 0}
                          onChange={(e) => handleInputChange(e, "bonus")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `${formatCurrency(salary.currency)}${salary.bonus}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingSalary.taxDeduction || 0}
                          onChange={(e) => handleInputChange(e, "taxDeduction")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `${formatCurrency(salary.currency)}${
                          salary.taxDeduction
                        }`
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {salary.otherDeductions &&
                      salary.otherDeductions.length > 0
                        ? t("salary.clickForDetails")
                        : "-"}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingSalary.netPay}
                          onChange={(e) => handleInputChange(e, "netPay")}
                          className="border p-1 rounded"
                        />
                      ) : (
                        `${formatCurrency(salary.currency)}${salary.netPay}`
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {editingSalary && editingSalary._id === salary._id ? (
                        <select
                          value={editingSalary.status}
                          onChange={(e) => handleInputChange(e, "status")}
                          className="border p-1 rounded"
                        >
                          <option value="Draft">
                            {t("salary.status.Draft")}
                          </option>
                          <option value="Approved">
                            {t("salary.status.Approved")}
                          </option>
                          <option value="Paid">
                            {t("salary.status.Paid")}
                          </option>
                          <option value="Canceled">
                            {t("salary.status.Canceled")}
                          </option>
                        </select>
                      ) : (
                        formatStatus(salary.status)
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
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
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center gap-2">
                        {editingSalary && editingSalary._id === salary._id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="bg-green-500 text-white px-2 py-1 rounded"
                            >
                              {t("salary.save")}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-red-500 text-white px-2 py-1 rounded"
                            >
                              {t("salary.cancel")}
                            </button>
                          </>
                        ) : (
                          <>
                            <FaEdit
                              className="text-blue-500 cursor-pointer"
                              onClick={() => handleEdit(salary)}
                            />
                            <FaFilePdf
                              className={`text-red-500 cursor-pointer ${
                                !salary.taxDeduction ||
                                !salary.otherDeductions.length
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() =>
                                salary.taxDeduction &&
                                salary.otherDeductions.length
                                  ? generatePayslip(salary)
                                  : null
                              }
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === salary._id &&
                    salary.otherDeductions &&
                    salary.otherDeductions.length > 0 && (
                      <tr>
                        <td colSpan="11" className="bg-gray-50 p-4">
                          <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <h3 className="text-lg font-semibold mb-2">
                              {t("salary.deductionDetails")}
                            </h3>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="py-2 px-4 text-left">
                                    {t("salary.description")}
                                  </th>
                                  <th className="py-2 px-4 text-left">
                                    {t("salary.amount")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {salary.otherDeductions.map(
                                  (deduction, index) => (
                                    <tr
                                      key={index}
                                      className="border-b border-gray-200"
                                    >
                                      <td className="py-2 px-4 text-left">
                                        {deduction.description}
                                      </td>
                                      <td className="py-2 px-4 text-left">
                                        {formatCurrency(salary.currency)}
                                        {deduction.amount}
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
