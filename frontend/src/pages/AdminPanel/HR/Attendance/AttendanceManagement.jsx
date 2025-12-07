import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../../lib/axios";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Loader2,
  User,
  DollarSign,
  TrendingUp,
  Moon,
  Percent,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AttendanceManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayRate, setSelectedPayRate] = useState("all");
  const [expandedShifts, setExpandedShifts] = useState(new Set());
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Check for active shift from localStorage
  useEffect(() => {
    const checkActiveShift = () => {
      const storedShift = JSON.parse(localStorage.getItem("activeShift"));
      if (storedShift?.isShiftStarted && storedShift?.shiftId) {
        setActiveShiftId(storedShift.shiftId);
      } else {
        setActiveShiftId(null);
      }
    };

    checkActiveShift();
    
    // Listen for storage changes (when shift is started/ended from button)
    const handleStorageChange = (e) => {
      if (e.key === "activeShift") {
        checkActiveShift();
        // Refetch shifts when active shift changes
        queryClient.invalidateQueries(["shifts"]);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically for changes in the same tab
    const interval = setInterval(() => {
      checkActiveShift();
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [queryClient]);

  // Fetch shifts with refetch interval to catch updates
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts", dateRange],
    queryFn: async () => {
      const res = await axiosInstance.get("/shifts", {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
      });
      return res.data.data || [];
    },
    refetchInterval: 5000, // Refetch every 5 seconds to catch shift updates
  });

  // Fetch pay rates
  const { data: payRates = [] } = useQuery({
    queryKey: ["payRates"],
    queryFn: async () => {
      const res = await axiosInstance.get("/payRate");
      return res.data.filter(rate => rate.isActive) || [];
    },
  });

  // Create pay rate map for quick lookup
  const payRateMap = React.useMemo(() => {
    const map = new Map();
    payRates.forEach(rate => {
      map.set(rate._id, rate);
    });
    return map;
  }, [payRates]);

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (!shifts || shifts.length === 0) {
      return {
        totalShifts: 0,
        totalHours: 0,
        totalPay: 0,
        regularHours: 0,
        overtimeHours: 0,
        nightHours: 0,
        holidayHours: 0,
        restDayHours: 0,
      };
    }

    let totalHours = 0;
    let totalPay = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    let nightHours = 0;
    let holidayHours = 0;
    let restDayHours = 0;

    shifts.forEach(shift => {
      totalHours += shift.hoursWorked || 0;
      totalPay += shift.totalPay || 0;
      
      // Calculate by shiftBreakdown
      if (shift.shiftBreakdown && Array.isArray(shift.shiftBreakdown)) {
        shift.shiftBreakdown.forEach(breakdown => {
          const hours = breakdown.hours || 0;
          if (breakdown.rateType === "Regular") {
            regularHours += hours;
          } else if (breakdown.rateType === "Overtime125" || breakdown.rateType === "Overtime150") {
            overtimeHours += hours;
          } else if (breakdown.rateType === "Night" || breakdown.rateType?.includes("Night")) {
            nightHours += hours;
          } else if (breakdown.rateType === "Holiday" || breakdown.rateType?.includes("Holiday")) {
            holidayHours += hours;
          } else if (breakdown.rateType === "RestDay" || breakdown.rateType?.includes("RestDay")) {
            restDayHours += hours;
          }
        });
      }
    });

    return {
      totalShifts: shifts.length,
      totalHours: parseFloat(totalHours.toFixed(2)),
      totalPay: parseFloat(totalPay.toFixed(2)),
      regularHours: parseFloat(regularHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      nightHours: parseFloat(nightHours.toFixed(2)),
      holidayHours: parseFloat(holidayHours.toFixed(2)),
      restDayHours: parseFloat(restDayHours.toFixed(2)),
    };
  }, [shifts]);

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch = 
      shift.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.employeeId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayRate = selectedPayRate === "all" || shift.payRateId === selectedPayRate;
    return matchesSearch && matchesPayRate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredShifts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShifts = filteredShifts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPayRate, dateRange]);

  const toggleShiftExpansion = (shiftId) => {
    const newExpanded = new Set(expandedShifts);
    if (newExpanded.has(shiftId)) {
      newExpanded.delete(shiftId);
    } else {
      newExpanded.add(shiftId);
    }
    setExpandedShifts(newExpanded);
  };

  const getPayRateName = (payRateId) => {
    if (!payRateId) return "-";
    const rate = payRateMap.get(payRateId);
    return rate ? t(`jobPercentages.rateTypes.${rate.rateType}`) || rate.rateType : "-";
  };

  const getPayRateColor = (payRateId) => {
    if (!payRateId) return "#6b7280";
    const rate = payRateMap.get(payRateId);
    if (!rate) return "#6b7280";
    const colors = {
      Regular: "#3b82f6",
      Overtime125: "#f59e0b",
      Overtime150: "#ef4444",
      Night: "#6366f1",
      Holiday: "#ec4899",
      RestDay: "#14b8a6",
      Custom: "#8b5cf6",
    };
    return colors[rate.rateType] || "#6b7280";
  };

  const getDayTypeLabel = (dayType) => {
    const labels = {
      Regular: t("hr.attendance.regular") || "Regular",
      Holiday: t("hr.attendance.holiday") || "Holiday",
      RestDay: t("hr.attendance.rest_day") || "Rest Day",
      Sickday: t("hr.attendance.sick_day") || "Sick Day",
      Vacation: t("hr.attendance.vacation") || "Vacation",
    };
    return labels[dayType] || dayType;
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredShifts.map((shift) => {
      const baseData = {
        Employee: `${shift.employeeId?.name || ""} ${shift.employeeId?.lastName || ""}`,
        Date: new Date(shift.shiftDate).toLocaleDateString(),
        "Start Time": shift.startTime ? new Date(shift.startTime).toLocaleTimeString() : "-",
        "End Time": shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : "-",
        Hours: shift.hoursWorked ? shift.hoursWorked.toFixed(2) : "0",
        "Shift Type": shift.shiftType || "Day",
        "Day Type": getDayTypeLabel(shift.dayType),
        "Pay Rate": getPayRateName(shift.payRateId),
        "Total Pay": shift.totalPay ? shift.totalPay.toFixed(2) : "0",
      };

      // Add breakdown details if available
      if (shift.shiftBreakdown && shift.shiftBreakdown.length > 0) {
        const breakdownText = shift.shiftBreakdown
          .map(
            (b) =>
              `${t(`jobPercentages.rateTypes.${b.rateType}`) || b.rateType}: ${b.hours.toFixed(2)}h (x${b.multiplier.toFixed(2)})`
          )
          .join("; ");
        baseData["Breakdown"] = breakdownText;
      }

      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shifts");

    // Auto-size columns
    const maxWidth = 50;
    const wscols = [
      { wch: 20 }, // Employee
      { wch: 12 }, // Date
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 8 }, // Hours
      { wch: 12 }, // Shift Type
      { wch: 12 }, // Day Type
      { wch: 15 }, // Pay Rate
      { wch: 12 }, // Total Pay
      { wch: maxWidth }, // Breakdown
    ];
    ws["!cols"] = wscols;

    const fileName = `attendance_${dateRange.start}_to_${dateRange.end}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(18);
    doc.text(t("hr.attendance.title") || "Attendance Management", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(
      `${dateRange.start} - ${dateRange.end}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 15;

    // Summary statistics
    doc.setFontSize(14);
    doc.text("Summary", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const summaryData = [
      [t("hr.attendance.total_shifts") || "Total Shifts", statistics.totalShifts],
      [t("hr.attendance.total_hours") || "Total Hours", `${statistics.totalHours}h`],
      [t("hr.attendance.total_pay") || "Total Pay", `₪${statistics.totalPay}`],
      [t("hr.attendance.regular_hours") || "Regular Hours", `${statistics.regularHours}h`],
      [t("hr.attendance.overtime_hours") || "Overtime Hours", `${statistics.overtimeHours}h`],
      [t("hr.attendance.night_hours") || "Night Hours", `${statistics.nightHours}h`],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [[t("hr.attendance.metric") || "Metric", t("hr.attendance.value") || "Value"]],
      body: summaryData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Shifts table
    const tableData = filteredShifts.map((shift) => [
      `${shift.employeeId?.name || ""} ${shift.employeeId?.lastName || ""}`,
      new Date(shift.shiftDate).toLocaleDateString(),
      shift.startTime ? new Date(shift.startTime).toLocaleTimeString() : "-",
      shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : "-",
      shift.hoursWorked ? shift.hoursWorked.toFixed(2) : "0",
      shift.shiftType || "Day",
      getDayTypeLabel(shift.dayType),
      `₪${shift.totalPay ? shift.totalPay.toFixed(2) : "0"}`,
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [
        [
          t("hr.attendance.employee") || "Employee",
          t("hr.attendance.date") || "Date",
          t("hr.attendance.start_time") || "Start",
          t("hr.attendance.end_time") || "End",
          t("hr.attendance.hours") || "Hours",
          t("hr.attendance.shift_type") || "Type",
          t("hr.attendance.day_type") || "Day",
          t("hr.attendance.total_pay") || "Pay",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      margin: { top: yPosition },
    });

    // Breakdown details on separate pages if needed
    if (filteredShifts.some((s) => s.shiftBreakdown && s.shiftBreakdown.length > 0)) {
      filteredShifts.forEach((shift, index) => {
        if (shift.shiftBreakdown && shift.shiftBreakdown.length > 0) {
          if (doc.lastAutoTable.finalY > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          } else {
            yPosition = doc.lastAutoTable.finalY + 10;
          }

          doc.setFontSize(12);
          doc.text(
            `${shift.employeeId?.name || ""} ${shift.employeeId?.lastName || ""} - ${new Date(shift.shiftDate).toLocaleDateString()}`,
            14,
            yPosition
          );
          yPosition += 8;

          const hourlySalary = shift.hourlySalary || shift.employeeId?.hourlySalary || 0;
          const breakdownData = shift.shiftBreakdown.map((b) => [
            t(`jobPercentages.rateTypes.${b.rateType}`) || b.rateType,
            `${b.hours.toFixed(2)}h`,
            `x${b.multiplier.toFixed(2)}`,
            `₪${(hourlySalary * b.multiplier * b.hours).toFixed(2)}`,
          ]);

          doc.autoTable({
            startY: yPosition,
            head: [
              [
                t("hr.attendance.rate_type") || "Rate Type",
                t("hr.attendance.hours") || "Hours",
                t("hr.attendance.multiplier") || "Multiplier",
                t("hr.attendance.amount") || "Amount",
              ],
            ],
            body: breakdownData,
            theme: "striped",
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 9 },
          });
        }
      });
    }

    const fileName = `attendance_${dateRange.start}_to_${dateRange.end}.pdf`;
    doc.save(fileName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: "var(--bg-color)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("hr.attendance.title") || "Attendance Management"}
              </h1>
              <p className="mt-1" style={{ color: "var(--color-secondary)" }}>
                {t("hr.attendance.subtitle") || "Track and manage employee shifts with pay rates"}
              </p>
            </div>
            {activeShiftId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30"
              >
                <PlayCircle className="w-5 h-5 text-green-600 dark:text-green-400 animate-pulse" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t("hr.attendance.active_shift") || "Active Shift"}
                </span>
              </motion.div>
            )}
          </div>
          <div className="mt-2 text-sm" style={{ color: "var(--color-secondary)" }}>
            {t("hr.attendance.auto_update_note") || "This page automatically updates with shifts created from the shift button"}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-lg p-4"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.attendance.total_shifts") || "Total Shifts"}</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{statistics?.totalShifts || 0}</p>
              </div>
              <Calendar className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-lg p-4"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.attendance.total_hours") || "Total Hours"}</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{statistics?.totalHours || 0}h</p>
              </div>
              <Clock className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-lg p-4"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.attendance.total_pay") || "Total Pay"}</p>
                <p className="text-2xl font-bold" style={{ color: "#10b981" }}>₪{statistics?.totalPay || 0}</p>
              </div>
              <DollarSign className="w-8 h-8" style={{ color: "#10b981" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-lg p-4"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.attendance.overtime_hours") || "Overtime Hours"}</p>
                <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{statistics?.overtimeHours || 0}h</p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: "#f59e0b" }} />
            </div>
          </motion.div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-lg p-4"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.attendance.regular_hours") || "Regular Hours"}</p>
                <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{statistics?.regularHours || 0}h</p>
              </div>
              <Clock className="w-8 h-8" style={{ color: "#3b82f6" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-lg p-4"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.attendance.night_hours") || "Night Hours"}</p>
                <p className="text-2xl font-bold" style={{ color: "#6366f1" }}>{statistics?.nightHours || 0}h</p>
              </div>
              <Moon className="w-8 h-8" style={{ color: "#6366f1" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-lg p-4"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              border: "1px solid",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{t("hr.attendance.holiday_rest_hours") || "Holiday/Rest Hours"}</p>
                <p className="text-2xl font-bold" style={{ color: "#ec4899" }}>{(statistics?.holidayHours + statistics?.restDayHours).toFixed(1)}h</p>
              </div>
              <Calendar className="w-8 h-8" style={{ color: "#ec4899" }} />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", border: "1px solid" }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "var(--color-secondary)" }} />
              <input
                type="text"
                placeholder={t("hr.attendance.search") || "Search employees..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>
            <select
              value={selectedPayRate}
              onChange={(e) => setSelectedPayRate(e.target.value)}
              className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("hr.attendance.all_pay_rates") || "All Pay Rates"}</option>
              {payRates.map((rate) => (
                <option key={rate._id} value={rate._id}>
                  {t(`jobPercentages.rateTypes.${rate.rateType}`) || rate.rateType}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            />
          </div>
          {/* Export Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              title={t("hr.attendance.export_excel") || "Export to Excel"}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">{t("hr.attendance.export_excel") || "Export Excel"}</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              title={t("hr.attendance.export_pdf") || "Export to PDF"}
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">{t("hr.attendance.export_pdf") || "Export PDF"}</span>
            </button>
          </div>
        </div>

        {/* Shifts Table */}
        <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", border: "1px solid" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--footer-bg)" }}>
                <tr>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}></th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.employee") || "Employee"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.date") || "Date"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.start_time") || "Start Time"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.end_time") || "End Time"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.hours") || "Hours"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.shift_type") || "Shift Type"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.day_type") || "Day Type"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.pay_rate") || "Pay Rate"}</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-color)" }}>{t("hr.attendance.total_pay") || "Total Pay"}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShifts.map((shift) => {
                  const isExpanded = expandedShifts.has(shift._id);
                  return (
                    <React.Fragment key={shift._id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`border-b transition-colors cursor-pointer hover:bg-opacity-50 ${
                          activeShiftId === shift._id ? "ring-2 ring-green-500 ring-opacity-50" : ""
                        }`}
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: activeShiftId === shift._id 
                            ? "rgba(34, 197, 94, 0.1)" 
                            : isExpanded 
                              ? "var(--footer-bg)" 
                              : "transparent",
                        }}
                        onClick={() => toggleShiftExpansion(shift._id)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {activeShiftId === shift._id && !shift.endTime && (
                              <PlayCircle className="w-5 h-5 text-green-500 animate-pulse" />
                            )}
                            {shift.shiftBreakdown && shift.shiftBreakdown.length > 0 ? (
                              isExpanded ? (
                                <ChevronUp className="w-5 h-5" style={{ color: "var(--color-secondary)" }} />
                              ) : (
                                <ChevronDown className="w-5 h-5" style={{ color: "var(--color-secondary)" }} />
                              )
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5" style={{ color: "var(--color-secondary)" }} />
                            <span className="font-medium" style={{ color: "var(--text-color)" }}>
                              {shift.employeeId?.name} {shift.employeeId?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                          {new Date(shift.shiftDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                          {shift.startTime
                            ? new Date(shift.startTime).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                          {shift.endTime
                            ? new Date(shift.endTime).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                          {shift.hoursWorked ? `${shift.hoursWorked.toFixed(2)}h` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: shift.shiftType === "Night" ? "#6366f1" : "#3b82f6",
                              color: "white",
                            }}
                          >
                            {shift.shiftType || "Day"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: shift.dayType === "Holiday" ? "#ec4899" : 
                                             shift.dayType === "RestDay" ? "#14b8a6" :
                                             shift.dayType === "Sickday" ? "#ef4444" :
                                             shift.dayType === "Vacation" ? "#8b5cf6" : "#6b7280",
                              color: "white",
                            }}
                          >
                            {getDayTypeLabel(shift.dayType)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: getPayRateColor(shift.payRateId),
                              color: "white",
                            }}
                          >
                            {getPayRateName(shift.payRateId)}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={{ color: "var(--text-color)" }}>
                          <span className="font-bold" style={{ color: "#10b981" }}>
                            {shift.totalPay ? `₪${shift.totalPay.toFixed(2)}` : "-"}
                          </span>
                        </td>
                      </motion.tr>
                      {isExpanded && shift.shiftBreakdown && shift.shiftBreakdown.length > 0 && (
                        <tr>
                          <td colSpan="10" className="px-4 py-4" style={{ backgroundColor: "var(--footer-bg)" }}>
                            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", border: "1px solid" }}>
                              <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                                <Percent className="w-4 h-4" />
                                {t("hr.attendance.rate_breakdown") || "Rate Breakdown"}
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr style={{ borderBottom: `1px solid var(--border-color)` }}>
                                      <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                                        {t("hr.attendance.rate_type") || "Rate Type"}
                                      </th>
                                      <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                                        {t("hr.attendance.hours") || "Hours"}
                                      </th>
                                      <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                                        {t("hr.attendance.multiplier") || "Multiplier"}
                                      </th>
                                      <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                                        {t("hr.attendance.hourly_rate") || "Hourly Rate"}
                                      </th>
                                      <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                                        {t("hr.attendance.amount") || "Amount"}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {shift.shiftBreakdown.map((breakdown, idx) => {
                                      const hourlySalary = shift.hourlySalary || shift.employeeId?.hourlySalary || 0;
                                      const hourlyRate = hourlySalary * breakdown.multiplier;
                                      const amount = breakdown.hours * hourlyRate;
                                      return (
                                        <tr key={idx} style={{ borderBottom: `1px solid var(--border-color)` }}>
                                          <td className="py-2 px-3">
                                            <span 
                                              className="px-2 py-1 rounded text-xs font-semibold"
                                              style={{
                                                backgroundColor: getPayRateColor(shift.payRateId),
                                                color: "white",
                                              }}
                                            >
                                              {t(`jobPercentages.rateTypes.${breakdown.rateType}`) || breakdown.rateType}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3" style={{ color: "var(--text-color)" }}>
                                            {breakdown.hours.toFixed(2)}h
                                          </td>
                                          <td className="py-2 px-3" style={{ color: "var(--text-color)" }}>
                                            x{breakdown.multiplier.toFixed(2)}
                                          </td>
                                          <td className="py-2 px-3" style={{ color: "var(--text-color)" }}>
                                            ₪{hourlyRate.toFixed(2)}
                                          </td>
                                          <td className="py-2 px-3">
                                            <span className="font-semibold" style={{ color: "#10b981" }}>
                                              ₪{amount.toFixed(2)}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    <tr style={{ borderTop: `2px solid var(--border-color)` }}>
                                      <td colSpan="4" className="py-2 px-3 font-bold text-right" style={{ color: "var(--text-color)" }}>
                                        {t("hr.attendance.total") || "Total"}:
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className="font-bold text-lg" style={{ color: "#10b981" }}>
                                          ₪{shift.totalPay?.toFixed(2) || "0.00"}
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredShifts.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("hr.attendance.no_records") || "No attendance records found"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredShifts.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t" style={{ borderColor: "var(--border-color)" }}>
              <div className="text-sm" style={{ color: "var(--color-secondary)" }}>
                {t("hr.attendance.showing") || "Showing"} {startIndex + 1} - {Math.min(endIndex, filteredShifts.length)} {t("hr.attendance.of") || "of"} {filteredShifts.length} {t("hr.attendance.records") || "records"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: currentPage === 1 ? "transparent" : "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  title={t("hr.attendance.previous_page") || "Previous Page"}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg border transition-all ${
                          currentPage === pageNum ? "font-bold" : ""
                        }`}
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: currentPage === pageNum ? "var(--color-primary)" : "var(--bg-color)",
                          color: currentPage === pageNum ? "white" : "var(--text-color)",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: currentPage === totalPages ? "transparent" : "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  title={t("hr.attendance.next_page") || "Next Page"}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
