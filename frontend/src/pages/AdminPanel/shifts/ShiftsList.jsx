import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  FilterX,
  Sun,
  Moon,
  Briefcase,
} from "lucide-react";

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
    const startTimeStr = shift.startTime
        ? new Date(shift.startTime).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
      : "";
    const endTimeStr = shift.endTime
        ? new Date(shift.endTime).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
      : "";
    
    setEditFormData({
      shiftDate: shift.shiftDate.split("T")[0],
      startTime: startTimeStr,
      endTime: endTimeStr,
      hoursWorked: shift.hoursWorked,
      hourlySalary: shift.hourlySalary,
      notes: shift.notes || "",
      isNextDay:
        shift.endTime &&
        new Date(shift.endTime).getDate() !==
          new Date(shift.shiftDate).getDate(),
      originalShift: shift, // Store for comparison
    });
    toast.success(t("shifts.editMode"));
  };

  // Calculate hours from start/end time
  const calculateHoursFromTimes = (startTime, endTime, shiftDate) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`${shiftDate}T${startTime}:00`);
    let end = new Date(`${shiftDate}T${endTime}:00`);
    
    // If end time is before start time, it's next day
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...editFormData, [name]: value };
    
    // Auto-calculate hours when times change
    if ((name === 'startTime' || name === 'endTime') && newData.startTime && newData.endTime && newData.shiftDate) {
      newData.hoursWorked = calculateHoursFromTimes(newData.startTime, newData.endTime, newData.shiftDate);
    }
    
    setEditFormData(newData);
  };

  const recalculateHours = () => {
    if (editFormData.startTime && editFormData.endTime && editFormData.shiftDate) {
      const calculatedHours = calculateHoursFromTimes(
        editFormData.startTime, 
        editFormData.endTime, 
        editFormData.shiftDate
      );
      setEditFormData(prev => ({ ...prev, hoursWorked: calculatedHours }));
      toast.success(`${t("shifts.hoursCalculated")}: ${calculatedHours} ${t("shifts.hours")}`);
    } else {
      toast.error(t("shifts.needTimesToCalculate"));
    }
  };

  // Get shift info for preview
  const getShiftPreview = (formData) => {
    if (!formData.shiftDate || !formData.startTime) return null;
    
    const date = new Date(formData.shiftDate);
    const startHour = parseInt(formData.startTime?.split(':')[0] || 0);
    const endHour = formData.endTime ? parseInt(formData.endTime.split(':')[0] || 0) : startHour;
    
    // Check if it's night shift (22:00-06:00)
    const isNightTime = startHour >= 22 || endHour <= 6;
    
    // Check if it's Saturday (rest day)
    const isRestDay = date.getDay() === 6;
    
    // Note: Holiday check would require API call, so we'll show it as info
    
    return {
      isNightTime,
      isRestDay,
      dayOfWeek: date.toLocaleDateString('he-IL', { weekday: 'long' }),
      description: isRestDay ? t("shifts.restDayDetected") : 
                   isNightTime ? t("shifts.nightShiftDetected") : 
                   t("shifts.regularShift")
    };
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
      // Create proper date objects
      const shiftDate = new Date(editFormData.shiftDate);
      const startTime = new Date(`${editFormData.shiftDate}T${editFormData.startTime}:00`);
      
      let endTime = null;
      if (editFormData.endTime) {
        endTime = new Date(`${editFormData.shiftDate}T${editFormData.endTime}:00`);
        
        // If end time is before start time, it's next day
        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }
      }

      const updatedShift = {
        shiftDate: shiftDate.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime ? endTime.toISOString() : null,
        hoursWorked: parseFloat(editFormData.hoursWorked) || 0,
        hourlySalary: parseFloat(editFormData.hourlySalary) || 0,
        notes: editFormData.notes || "",
      };

      console.log('Updating shift with data:', updatedShift);

      const response = await axiosInstance.put(
        `/shifts/${shiftId}`,
        updatedShift
      );
      
      // Refresh the shift data
      await fetchShifts();
      
      setEditingRow(null);
      setEditFormData({});
      toast.success(t("shifts.shiftUpdatedSuccess"));
    } catch (err) {
      console.error('Error updating shift:', err);
      toast.error(t("shifts.errorUpdatingShift") + ": " + (err.response?.data?.message || err.message));
    }
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditFormData({});
    toast(t("shifts.cancelled"));
  };

  // Calculate statistics
  const stats = {
    totalShifts: shifts.length,
    totalHours: shifts.reduce((sum, shift) => sum + (shift.hoursWorked || 0), 0),
    totalPay: shifts.reduce((sum, shift) => sum + (shift.totalPay || 0), 0),
    avgHoursPerShift: shifts.length > 0 
      ? (shifts.reduce((sum, shift) => sum + (shift.hoursWorked || 0), 0) / shifts.length).toFixed(1)
      : 0,
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
              <Briefcase size={28} style={{ color: 'var(--button-text)' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
        {t("shifts.shiftsList")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("shifts.manageAllShifts")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: t("shifts.totalShifts"), value: stats.totalShifts, icon: Calendar, color: "#3b82f6" },
            { label: t("shifts.totalHours"), value: stats.totalHours.toFixed(1), icon: Clock, color: "#10b981" },
            { label: t("shifts.totalPayment"), value: `₪${stats.totalPay.toLocaleString()}`, icon: DollarSign, color: "#f59e0b" },
            { label: t("shifts.avgHours"), value: stats.avgHoursPerShift, icon: TrendingUp, color: "#8b5cf6" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl shadow-lg p-6 border"
              style={{ 
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: stat.color }}
                >
                  <stat.icon size={24} color="white" />
                </div>
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

        {/* Filter Section */}
        <motion.div
          className="mb-8 rounded-2xl shadow-lg p-6 border"
          style={{ 
            backgroundColor: 'var(--bg-color)',
            borderColor: 'var(--border-color)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter size={24} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("shifts.filterShifts")}
      </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                <Calendar className="inline mr-2" size={16} />
              {t("shifts.startDate")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)'
                }}
            />
          </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                <Calendar className="inline mr-2" size={16} />
              {t("shifts.endDate")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)'
                }}
            />
          </div>
            <div className="flex items-end">
          <button
            onClick={clearFilter}
                className="w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--button-text)'
                }}
              >
                <FilterX size={20} />
            {t("shifts.clearFilter")}
          </button>
        </div>
      </div>
        </motion.div>

        {/* Shifts Grid */}
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
          {t("shifts.noShiftsFound")}
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
                className="rounded-2xl shadow-lg overflow-hidden border"
                style={{ 
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                {/* Main Shift Card */}
                <div 
                  className="p-6 cursor-pointer hover:bg-opacity-80 transition-all"
                    onClick={() => toggleRow(shift._id)}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Employee Info */}
                    <div className="lg:col-span-3 flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <Users size={20} style={{ color: 'var(--button-text)' }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                      {shift.employeeId
                        ? `${shift.employeeId.name} ${shift.employeeId.lastName}`
                        : "-"}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                          {t("shifts.employee")}
                        </p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="lg:col-span-3">
                      {editingRow === shift._id ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="date"
                          name="shiftDate"
                          value={editFormData.shiftDate}
                          onChange={handleInputChange}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          name="startTime"
                          value={editFormData.startTime}
                          onChange={handleInputChange}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                            />
                        <input
                          type="time"
                          name="endTime"
                          value={editFormData.endTime}
                          onChange={handleInputChange}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                            <Calendar size={16} />
                            {formatDate(shift.shiftDate)}
                          </p>
                          <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                            <Clock size={16} />
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Hours & Type */}
                    <div className="lg:col-span-2">
                      {editingRow === shift._id ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <label className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
                            {t("shifts.hoursWorked")}
                          </label>
                        <input
                          type="number"
                          name="hoursWorked"
                          value={editFormData.hoursWorked}
                          onChange={handleInputChange}
                            step="0.1"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            {shift.shiftType === "Night" ? (
                              <Moon size={16} style={{ color: 'var(--color-accent)' }} />
                            ) : (
                              <Sun size={16} style={{ color: 'var(--color-accent)' }} />
                            )}
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                              backgroundColor: shift.shiftType === "Night" ? '#1e293b' : '#fef3c7',
                              color: shift.shiftType === "Night" ? 'white' : '#92400e'
                            }}>
                              {t(`shifts.shiftTypes.${shift.shiftType}`)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                            {shift.hoursWorked.toFixed(2)} {t("shifts.hours")}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Payment */}
                    <div className="lg:col-span-2">
                      {editingRow === shift._id ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <label className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
                            {t("shifts.hourlySalary")}
                          </label>
                        <input
                          type="number"
                          name="hourlySalary"
                          value={editFormData.hourlySalary}
                          onChange={handleInputChange}
                            step="0.1"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                            <DollarSign size={16} />
                            ₪{shift.totalPay ? shift.totalPay.toFixed(2) : "0.00"}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                            ₪{shift.hourlySalary.toFixed(2)}/{t("shifts.hour")}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Job Percentage */}
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="var(--border-color)"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="var(--color-primary)"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${(calculateJobPercentage(
                                editingRow === shift._id ? parseFloat(editFormData.hoursWorked) || 0 : shift.hoursWorked, 
                                42
                              ) / 100) * 175.93} 175.93`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold" style={{ color: 'var(--text-color)' }}>
                      {calculateJobPercentage(
                                editingRow === shift._id ? parseFloat(editFormData.hoursWorked) || 0 : shift.hoursWorked, 
                                42
                              )}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1">
                      {editingRow === shift._id ? (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveChanges(shift._id);
                            }}
                            className="p-2 rounded-lg hover:scale-110 transition-all shadow-lg"
                            style={{ backgroundColor: '#10b981', color: 'white' }}
                            title={t("shifts.save")}
                          >
                            <Save size={20} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className="p-2 rounded-lg hover:scale-110 transition-all shadow-lg"
                            style={{ backgroundColor: '#ef4444', color: 'white' }}
                            title={t("shifts.cancel")}
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(shift);
                          }}
                          className="p-2 rounded-lg hover:scale-110 transition-all shadow-lg"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          title={t("shifts.edit")}
                        >
                          <Edit2 size={20} />
                        </button>
                      )}
                    </div>
                    
                    {/* Editing Info Panel - Full Width */}
                    {editingRow === shift._id && (
                      <div className="lg:col-span-12" onClick={(e) => e.stopPropagation()}>
                        {/* Shift Preview Info */}
                        {getShiftPreview(editFormData) && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 rounded-xl border-l-4"
                            style={{ 
                              backgroundColor: 'var(--bg-color)',
                              borderLeftColor: getShiftPreview(editFormData).isRestDay ? '#ef4444' :
                                              getShiftPreview(editFormData).isNightTime ? '#6366f1' :
                                              '#10b981'
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg" style={{ 
                                backgroundColor: getShiftPreview(editFormData).isRestDay ? '#fef2f2' :
                                               getShiftPreview(editFormData).isNightTime ? '#eef2ff' :
                                               '#f0fdf4'
                              }}>
                                {getShiftPreview(editFormData).isRestDay ? '🌙' :
                                 getShiftPreview(editFormData).isNightTime ? '🌃' : '☀️'}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold mb-1" style={{ color: 'var(--text-color)' }}>
                                  {getShiftPreview(editFormData).description}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                                  {getShiftPreview(editFormData).dayOfWeek}
                                  {editFormData.hoursWorked && ` • ${editFormData.hoursWorked} ${t("shifts.hours")}`}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {getShiftPreview(editFormData).isNightTime && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      🌙 {t("shifts.nightHours")}
                                    </span>
                                  )}
                                  {getShiftPreview(editFormData).isRestDay && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      📅 {t("shifts.restDay")}
                                    </span>
                                  )}
                                  {parseFloat(editFormData.hoursWorked) > 8 && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                      ⏰ {t("shifts.overtimeExpected")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={recalculateHours}
                                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-md"
                                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                              >
                                <Clock size={16} />
                                {t("shifts.recalculate")}
                              </button>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Notes Input */}
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                          {t("shifts.notes")}
                        </label>
                        <textarea
                          name="notes"
                          value={editFormData.notes}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                          placeholder={t("shifts.notesPlaceholder")}
                        />
                      </div>
                    )}

                    {/* Expand Icon */}
                    <div className="lg:col-span-12 flex justify-center">
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
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                              {t("shifts.breakdownDetails")}
                            </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {shift.shiftBreakdown.map((part, index) => (
                          <div
                                    key={index}
                            className="p-4 rounded-xl border"
                            style={{ 
                              backgroundColor: 'var(--bg-color)',
                              borderColor: 'var(--border-color)'
                            }}
                          >
                            <p className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                                      {getRateTypeLabel(part.rateType)}
                            </p>
                            <div className="space-y-1 text-sm" style={{ color: 'var(--color-secondary)' }}>
                              <p>{t("shifts.hours")}: {part.hours.toFixed(2)}</p>
                              <p>{t("shifts.multiplier")}: x{part.multiplier.toFixed(2)}</p>
                              <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                                ₪{(part.hours * shift.hourlySalary * part.multiplier).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {shift.notes && (
                        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-accent)', opacity: 0.1 }}>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                            <strong>{t("shifts.notes")}:</strong> {shift.notes}
                          </p>
                        </div>
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

export default ShiftsList;
