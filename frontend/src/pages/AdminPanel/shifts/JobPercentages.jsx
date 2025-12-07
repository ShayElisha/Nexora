import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  TrendingUp,
  DollarSign,
  Settings,
  CheckCircle,
  XCircle,
  Info,
  Save,
  X as XIcon,
} from "lucide-react";

const JobPercentages = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
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

  const [payRates, setPayRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayRateId, setEditingPayRateId] = useState(null);

  const calculateDailyHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    if (end < start) end.setDate(end.getDate() + 1);
    const hours = (end - start) / (1000 * 60 * 60);
    return hours;
  };

  const calculateJobPercentage = (
    dailyHours,
    workDaysPerWeek,
    fullTimeHours
  ) => {
    if (!dailyHours || !workDaysPerWeek || !fullTimeHours) return 0;
    const weeklyHours = dailyHours * workDaysPerWeek;
    return ((weeklyHours / fullTimeHours) * 100).toFixed(1);
  };

  const dailyHours = calculateDailyHours(
    formData.workHours.startTime,
    formData.workHours.endTime
  );
  const jobPercentage = calculateJobPercentage(
    dailyHours,
    formData.workDaysPerWeek,
    formData.fullTimeHours
  );

  const fetchPayRates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/payRate`);
      setPayRates(response.data);
    } catch (err) {
      toast.error(
        t("jobPercentages.errorFetchingPayRates") + " " + err.message
      );
    } finally {
      setLoading(false);
    }
  };

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

    if (!formData.rateType || !formData.multiplier) {
      toast.error(t("jobPercentages.rateTypeMultiplierRequired"));
      return;
    }
    if (formData.multiplier < 1) {
      toast.error(t("jobPercentages.invalidMultiplier"));
      return;
    }
    const { startTime, endTime } = formData.workHours;
    if (
      (startTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) ||
      (endTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime))
    ) {
      toast.error(t("jobPercentages.invalidTimeFormat"));
      return;
    }
    if (formData.workDaysPerWeek < 1 || formData.workDaysPerWeek > 7) {
      toast.error(t("jobPercentages.invalidWorkDays"));
      return;
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
        await axiosInstance.put(`/payRate/${editingPayRateId}`, payload);
        toast.success(t("jobPercentages.payRateUpdated"));
      } else {
        await axiosInstance.post(`/payRate`, payload);
        toast.success(t("jobPercentages.payRateCreated"));
      }

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
      fetchPayRates();
    } catch (err) {
      toast.error(
        t("jobPercentages.errorProcessingPayRate") + " " + err.message
      );
    }
  };

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
    toast(t("jobPercentages.editMode"));
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("jobPercentages.confirmDeactivate"))) {
      return;
    }
    try {
      await axiosInstance.delete(`/payRate/${id}`);
      toast.success(t("jobPercentages.payRateDeactivated"));
      fetchPayRates();
    } catch (err) {
      toast.error(t("jobPercentages.errorDeactivatingPayRate") + " " + err);
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getRateColor = (rateType) => {
    const colors = {
      Regular: "#3b82f6",
      Overtime125: "#f59e0b",
      Overtime150: "#ef4444",
      Night: "#6366f1",
      Holiday: "#ec4899",
      RestDay: "#14b8a6",
      Custom: "#8b5cf6",
    };
    return colors[rateType] || "#6b7280";
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
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600"
            >
              <Percent size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("jobPercentages.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("jobPercentages.managePayRates")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form Section */}
        <motion.div
          className="mb-8 rounded-2xl shadow-lg p-6 lg:p-8 border"
          style={{ 
            backgroundColor: 'var(--bg-color)',
            borderColor: 'var(--border-color)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Settings size={24} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
              {isEditing ? t("jobPercentages.updatePayRate") : t("jobPercentages.createPayRate")}
        </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rate Type */}
          <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("jobPercentages.rateType")}
            </label>
            <select
              name="rateType"
              value={formData.rateType}
              onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                >
                  {["Regular", "Overtime125", "Overtime150", "Night", "Holiday", "RestDay", "Custom"].map(type => (
                    <option key={type} value={type}>
                      {t(`jobPercentages.rateTypes.${type}`)}
              </option>
                  ))}
            </select>
          </div>

              {/* Multiplier */}
          <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  <TrendingUp className="inline mr-2" size={16} />
              {t("jobPercentages.multiplier")}
            </label>
            <input
              type="number"
              name="multiplier"
              value={formData.multiplier}
              onChange={handleChange}
              step="0.01"
              min="1"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="1.0"
            />
          </div>

              {/* Full Time Hours */}
          <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Clock className="inline mr-2" size={16} />
              {t("jobPercentages.fullTimeHours")}
            </label>
            <input
              type="number"
              name="fullTimeHours"
              value={formData.fullTimeHours}
              onChange={handleChange}
              step="0.1"
              min="0"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="42.0"
            />
            {formData.rateType === "Regular" && !formData.fullTimeHours && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Info size={12} />
                {t("jobPercentages.fullTimeHoursRecommended")}
              </p>
            )}
          </div>

              {/* Hours Threshold */}
          <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("jobPercentages.hoursThreshold")}
            </label>
            <input
              type="number"
              name="hoursThreshold"
              value={formData.hoursThreshold}
              onChange={handleChange}
              step="0.1"
              min="0"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="0"
                />
          </div>

              {/* Start Time */}
          <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Clock className="inline mr-2" size={16} />
              {t("jobPercentages.startTime")}
            </label>
            <input
                  type="time"
              name="workHours.startTime"
              value={formData.workHours.startTime}
              onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
            />
          </div>

              {/* End Time */}
          <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Clock className="inline mr-2" size={16} />
              {t("jobPercentages.endTime")}
            </label>
            <input
                  type="time"
              name="workHours.endTime"
              value={formData.workHours.endTime}
              onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
            />
          </div>

              {/* Work Days Per Week */}
          <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={16} />
              {t("jobPercentages.workDaysPerWeek")}
            </label>
            <input
              type="number"
              name="workDaysPerWeek"
              value={formData.workDaysPerWeek}
              onChange={handleChange}
              min="1"
              max="7"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="5"
            />
          </div>

              {/* Calculated Job Percentage Display */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Percent className="inline mr-2" size={16} />
                  {t("jobPercentages.calculatedPercentage")}
                </label>
                <div 
                  className="w-full p-3 border rounded-xl font-bold text-2xl text-center"
                  style={{ 
                    borderColor: 'var(--color-primary)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--button-text)'
                  }}
                >
                  {jobPercentage}%
                </div>
              </div>
            </div>

            {/* Description */}
          <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("jobPercentages.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              placeholder={t("jobPercentages.descriptionPlaceholder")}
                rows="3"
            />
          </div>

            {/* Is Active Checkbox */}
            <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                {formData.isActive ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={18} />
                    {t("jobPercentages.active")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-gray-500">
                    <XCircle size={18} />
                    {t("jobPercentages.inactive")}
                  </span>
                )}
            </label>
          </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
          <button
            type="submit"
                className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 shadow-lg"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--button-text)'
                }}
              >
                {isEditing ? <Save size={20} /> : <Plus size={20} />}
                {isEditing ? t("jobPercentages.updatePayRate") : t("jobPercentages.createPayRate")}
          </button>

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
                toast(t("jobPercentages.cancelled"));
              }}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--button-text)'
                  }}
                >
                  <XIcon size={20} />
              {t("jobPercentages.cancel")}
            </button>
          )}
            </div>
        </form>
        </motion.div>

        {/* Existing Pay Rates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-color)' }}>
            <DollarSign size={28} style={{ color: 'var(--color-primary)' }} />
          {t("jobPercentages.existingPayRates")}
        </h3>

        {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="w-16 h-16 border-4 border-t-4 rounded-full"
                style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
          </div>
        ) : payRates.length === 0 ? (
            <motion.div
              className="text-center py-16 rounded-2xl shadow-lg"
              style={{ backgroundColor: 'var(--bg-color)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Percent size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
              <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
            {t("jobPercentages.noPayRatesFound")}
              </p>
            </motion.div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payRates.map((rate, index) => {
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
                  <motion.div
                    key={rate._id}
                    variants={cardVariant}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl shadow-lg p-6 border-2 hover:shadow-xl transition-all relative ${
                      rate.isActive ? '' : 'opacity-60'
                    }`}
                    style={{ 
                      backgroundColor: 'var(--bg-color)',
                      borderColor: getRateColor(rate.rateType)
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    {/* Header with Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="px-4 py-2 rounded-xl font-bold text-white shadow-lg"
                        style={{ backgroundColor: getRateColor(rate.rateType) }}
                      >
                        {t(`jobPercentages.rateTypes.${rate.rateType}`)}
                      </div>
                      <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(rate)}
                          className="p-2 rounded-lg hover:scale-110 transition-all"
                          style={{ backgroundColor: '#3b82f6', color: 'white' }}
                      title={t("jobPercentages.editPayRate")}
                    >
                          <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(rate._id)}
                          className="p-2 rounded-lg hover:scale-110 transition-all"
                          style={{ backgroundColor: '#ef4444', color: 'white' }}
                      title={t("jobPercentages.deactivatePayRate")}
                    >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Job Percentage Circle */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="var(--border-color)"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke={getRateColor(rate.rateType)}
                            strokeWidth="8"
                        fill="none"
                            strokeDasharray={`${(rateJobPercentage / 100) * 352} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Percent size={20} style={{ color: 'var(--color-secondary)' }} />
                          <span className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                            {rateJobPercentage || 0}%
                          </span>
                        </div>
                      </div>
                  </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                      {t("jobPercentages.multiplier")}:
                        </span>
                        <span className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                          x{rate.multiplier.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                      {t("jobPercentages.fullTimeHours")}:
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    {rate.fullTimeHours ? rate.fullTimeHours.toFixed(1) : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                      {t("jobPercentages.workHours")}:
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    {rate.workHours?.startTime && rate.workHours?.endTime
                      ? `${rate.workHours.startTime} - ${rate.workHours.endTime}`
                      : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                      {t("jobPercentages.workDaysPerWeek")}:
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {rate.workDaysPerWeek || "-"} {t("jobPercentages.days")}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                          {t("jobPercentages.dailyHours")}:
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {rateDailyHours.toFixed(1)} {t("jobPercentages.hours")}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {rate.description && (
                      <div className="mt-4 p-3 rounded-lg border-l-4" style={{ 
                        backgroundColor: 'var(--bg-color)',
                        borderLeftColor: getRateColor(rate.rateType)
                      }}>
                        <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                          {rate.description}
                  </p>
                </div>
                    )}

                    {/* Status Badge */}
                    <div className="mt-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                        rate.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rate.isActive ? (
                          <>
                            <CheckCircle size={14} />
                            {t("jobPercentages.active")}
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            {t("jobPercentages.inactive")}
                          </>
                        )}
                      </span>
                    </div>
                  </motion.div>
              );
            })}
          </div>
        )}
        </motion.div>
      </div>
    </div>
  );
};

export default JobPercentages;
