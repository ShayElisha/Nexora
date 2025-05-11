import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";

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
        const response = await axiosInstance.put(
          `/payRate/${editingPayRateId}`,
          payload
        );
        toast.success(t("jobPercentages.payRateUpdated"));
      } else {
        const response = await axiosInstance.post(`/payRate`, payload);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isEditing
            ? t("jobPercentages.updatePayRate")
            : t("jobPercentages.createPayRate")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.rateType")}
            </label>
            <select
              name="rateType"
              value={formData.rateType}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Regular">
                {t("jobPercentages.rateTypes.Regular")}
              </option>
              <option value="Overtime125">
                {t("jobPercentages.rateTypes.Overtime125")}
              </option>
              <option value="Overtime150">
                {t("jobPercentages.rateTypes.Overtime150")}
              </option>
              <option value="Night">
                {t("jobPercentages.rateTypes.Night")}
              </option>
              <option value="Holiday">
                {t("jobPercentages.rateTypes.Holiday")}
              </option>
              <option value="RestDay">
                {t("jobPercentages.rateTypes.RestDay")}
              </option>
              <option value="Custom">
                {t("jobPercentages.rateTypes.Custom")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.multiplier")}
            </label>
            <input
              type="number"
              name="multiplier"
              value={formData.multiplier}
              onChange={handleChange}
              step="0.01"
              min="1"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("jobPercentages.multiplierPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.fullTimeHours")}
            </label>
            <input
              type="number"
              name="fullTimeHours"
              value={formData.fullTimeHours}
              onChange={handleChange}
              step="0.1"
              min="0"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("jobPercentages.fullTimeHoursPlaceholder")}
            />
            {formData.rateType === "Regular" && !formData.fullTimeHours && (
              <p className="text-sm text-yellow-600 mt-1">
                {t("jobPercentages.fullTimeHoursRecommended")}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.hoursThreshold")}
            </label>
            <input
              type="number"
              name="hoursThreshold"
              value={formData.hoursThreshold}
              onChange={handleChange}
              step="0.1"
              min="0"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("jobPercentages.hoursThresholdPlaceholder")}
            />
            {["Overtime125", "Overtime150"].includes(formData.rateType) &&
              !formData.hoursThreshold && (
                <p className="text-sm text-yellow-600 mt-1">
                  {t("jobPercentages.hoursThresholdRecommended")}
                </p>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.startTime")}
            </label>
            <input
              type="text"
              name="workHours.startTime"
              value={formData.workHours.startTime}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("jobPercentages.startTimePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.endTime")}
            </label>
            <input
              type="text"
              name="workHours.endTime"
              value={formData.workHours.endTime}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("jobPercentages.endTimePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.workDaysPerWeek")}
            </label>
            <input
              type="number"
              name="workDaysPerWeek"
              value={formData.workDaysPerWeek}
              onChange={handleChange}
              min="1"
              max="7"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("jobPercentages.workDaysPerWeekPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("jobPercentages.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("jobPercentages.descriptionPlaceholder")}
              rows="4"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              {t("jobPercentages.isActive")}
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEditing
              ? t("jobPercentages.updatePayRate")
              : t("jobPercentages.createPayRate")}
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
              className="w-full bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400 mt-2"
            >
              {t("jobPercentages.cancel")}
            </button>
          )}
        </form>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">
          {t("jobPercentages.existingPayRates")}
        </h3>
        {loading ? (
          <div className="text-center text-gray-500">
            {t("jobPercentages.loading")}
          </div>
        ) : payRates.length === 0 ? (
          <div className="text-center text-gray-500">
            {t("jobPercentages.noPayRatesFound")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payRates.map((rate) => {
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
                <div
                  key={rate._id}
                  className={`p-4 border rounded-lg shadow-sm ${
                    rate.isActive ? "bg-green-50" : "bg-gray-100"
                  } relative`}
                >
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(rate)}
                      className="text-blue-600 hover:text-blue-800"
                      title={t("jobPercentages.editPayRate")}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(rate._id)}
                      className="text-red-600 hover:text-red-800"
                      title={t("jobPercentages.deactivatePayRate")}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800">
                    {t(`jobPercentages.rateTypes.${rate.rateType}`)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.multiplier")}:
                    </span>{" "}
                    {rate.multiplier.toFixed(2)}x
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.fullTimeHours")}:
                    </span>{" "}
                    {rate.fullTimeHours ? rate.fullTimeHours.toFixed(1) : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.hoursThreshold")}:
                    </span>{" "}
                    {rate.hoursThreshold ? rate.hoursThreshold.toFixed(1) : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.workHours")}:
                    </span>{" "}
                    {rate.workHours?.startTime && rate.workHours?.endTime
                      ? `${rate.workHours.startTime} - ${rate.workHours.endTime}`
                      : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.workDaysPerWeek")}:
                    </span>{" "}
                    {rate.workDaysPerWeek || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.jobPercentage")}:
                    </span>{" "}
                    {rateJobPercentage ? `${rateJobPercentage}%` : "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.description")}:
                    </span>{" "}
                    {rate.description || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {t("jobPercentages.status")}:
                    </span>{" "}
                    {rate.isActive
                      ? t("jobPercentages.active")
                      : t("jobPercentages.inactive")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPercentages;
