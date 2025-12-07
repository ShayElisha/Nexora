import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  User,
  Award,
  Briefcase,
  PieChart,
} from "lucide-react";
import { Doughnut, Line } from "react-chartjs-2";

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

  // Calculate statistics
  const stats = {
    totalShifts: shifts.length,
    totalHours: shifts.reduce((sum, shift) => sum + (shift.hoursWorked || 0), 0),
    totalPay: shifts.reduce((sum, shift) => sum + (shift.totalPay || 0), 0),
    avgJobPercentage: shifts.length > 0
      ? (shifts.reduce((sum, shift) => sum + parseFloat(calculateJobPercentage(shift.hoursWorked, 42)), 0) / shifts.length).toFixed(1)
      : 0,
  };

  // Chart data for shift types
  const shiftTypeData = {
    labels: [t("myShifts.dayShifts"), t("myShifts.nightShifts")],
    datasets: [{
      data: [
        shifts.filter(s => s.shiftType === "Day").length,
        shifts.filter(s => s.shiftType === "Night").length,
      ],
      backgroundColor: ['#fbbf24', '#1e293b'],
      borderWidth: 2,
    }],
  };

  // Chart data for hours trend
  const hoursTrendData = {
    labels: shifts.slice(-7).map(s => formatDate(s.shiftDate)),
    datasets: [{
      label: t("myShifts.hoursWorked"),
      data: shifts.slice(-7).map(s => s.hoursWorked),
      borderColor: 'var(--color-primary)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <User size={28} style={{ color: 'var(--button-text)' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
        {t("myShifts.myShifts")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("myShifts.personalShiftTracking")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: t("myShifts.totalShifts"), 
              value: stats.totalShifts, 
              icon: Briefcase, 
              color: "#3b82f6",
              gradient: "from-blue-500 to-blue-600"
            },
            { 
              label: t("myShifts.totalHours"), 
              value: stats.totalHours.toFixed(1), 
              icon: Clock, 
              color: "#10b981",
              gradient: "from-green-500 to-green-600"
            },
            { 
              label: t("myShifts.totalEarnings"), 
              value: `₪${stats.totalPay.toLocaleString()}`, 
              icon: DollarSign, 
              color: "#f59e0b",
              gradient: "from-amber-500 to-amber-600"
            },
            { 
              label: t("myShifts.avgJobPercentage"), 
              value: `${stats.avgJobPercentage}%`, 
              icon: PieChart, 
              color: "#8b5cf6",
              gradient: "from-purple-500 to-purple-600"
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all"
              style={{ 
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)'
              }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} shadow-lg`}
                >
                  <stat.icon size={24} color="white" />
                </div>
                <TrendingUp size={20} style={{ color: stat.color }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>
              {t("myShifts.shiftDistribution")}
            </h3>
            <div className="h-64">
              <Doughnut data={shiftTypeData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>
              {t("myShifts.hoursTrend")}
            </h3>
            <div className="h-64">
              <Line data={hoursTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </motion.div>
        </div>

        {/* Shifts List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              className="w-16 h-16 border-4 border-t-4 rounded-full"
              style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>
        ) : shifts.length === 0 ? (
          <motion.div
            className="text-center py-16 rounded-2xl shadow-lg"
            style={{ backgroundColor: 'var(--bg-color)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Briefcase size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
              {t("myShifts.noShiftsFound")}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift, index) => (
              <motion.div
                key={shift._id}
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl shadow-lg overflow-hidden border hover:shadow-xl transition-all"
                style={{ 
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                {/* Main Shift Card */}
                <div 
                  className="p-6 cursor-pointer"
                    onClick={() => toggleRow(shift._id)}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Date & Time */}
                    <div className="lg:col-span-3">
                      <p className="font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--text-color)' }}>
                        <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                      {formatDate(shift.shiftDate)}
                      </p>
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                        <Clock size={16} />
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </p>
                    </div>

                    {/* Shift Type Badge */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2">
                        {shift.shiftType === "Night" ? (
                          <Moon size={18} className="text-indigo-600" />
                        ) : (
                          <Sun size={18} className="text-amber-500" />
                        )}
                        <span className="px-3 py-1 rounded-full text-sm font-medium" style={{
                          backgroundColor: shift.shiftType === "Night" ? '#1e293b' : '#fef3c7',
                          color: shift.shiftType === "Night" ? 'white' : '#92400e'
                        }}>
                      {t(`myShifts.shiftTypes.${shift.shiftType}`)}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                      {t(`myShifts.dayTypes.${shift.dayType}`)}
                      </p>
                    </div>

                    {/* Hours Worked */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={18} style={{ color: 'var(--color-primary)' }} />
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                          {shift.hoursWorked.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                        {t("myShifts.hours")}
                      </p>
                    </div>

                    {/* Payment */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={18} style={{ color: '#10b981' }} />
                        <span className="text-2xl font-bold text-green-600">
                      ₪{shift.totalPay ? shift.totalPay.toFixed(2) : "0.00"}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                        ₪{shift.hourlySalary.toFixed(2)}/{t("myShifts.hour")}
                      </p>
                    </div>

                    {/* Job Percentage Circle */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="var(--border-color)"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="var(--color-primary)"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${(calculateJobPercentage(shift.hoursWorked, 42) / 100) * 201} 201`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                      {calculateJobPercentage(shift.hoursWorked, 42)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                            {t("myShifts.jobPercentage")}
                          </p>
                          <Award size={18} style={{ color: 'var(--color-accent)' }} className="mt-1" />
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="lg:col-span-1 flex justify-center">
                      {shift.shiftBreakdown && shift.shiftBreakdown.length > 0 && (
                        expandedRow === shift._id ? (
                          <ChevronUp size={24} style={{ color: 'var(--color-primary)' }} />
                        ) : (
                          <ChevronDown size={24} style={{ color: 'var(--color-primary)' }} />
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                  {expandedRow === shift._id &&
                    shift.shiftBreakdown &&
                    shift.shiftBreakdown.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t p-6"
                      style={{ 
                        backgroundColor: 'var(--bg-color)',
                        borderColor: 'var(--border-color)',
                        opacity: 0.95
                      }}
                    >
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                        <PieChart size={20} style={{ color: 'var(--color-primary)' }} />
                              {t("myShifts.breakdownDetails")}
                            </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shift.shiftBreakdown.map((part, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 rounded-xl border hover:shadow-lg transition-all"
                            style={{ 
                              backgroundColor: 'var(--bg-color)',
                              borderColor: 'var(--color-primary)'
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>
                                      {getRateTypeLabel(part.rateType)}
                              </p>
                              <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                                backgroundColor: 'var(--color-accent)',
                                color: 'var(--button-text)'
                              }}>
                                x{part.multiplier.toFixed(2)}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span style={{ color: 'var(--color-secondary)' }}>
                                  {t("myShifts.hours")}:
                                </span>
                                <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                                      {part.hours.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span style={{ color: 'var(--color-secondary)' }}>
                                  {t("myShifts.payment")}:
                                </span>
                                <span className="font-bold text-green-600">
                                  ₪{(part.hours * shift.hourlySalary * part.multiplier).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                          </div>
                      {shift.notes && (
                        <motion.div 
                          className="mt-6 p-4 rounded-xl border-l-4"
                          style={{ 
                            backgroundColor: 'var(--bg-color)',
                            borderLeftColor: 'var(--color-accent)',
                            borderColor: 'var(--border-color)'
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                            <strong>{t("myShifts.notes")}:</strong> {shift.notes}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
              </motion.div>
            ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default MyShifts;
