import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  X,
  HeartPulse,
  User,
  Mail,
  Globe,
  AlertCircle,
  Loader,
} from "lucide-react";

const AddSickDay = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data?.data || [];
    },
  });

  const { data: policies = [], isLoading: isLoadingPolicies } = useQuery({
    queryKey: ["sickDaysPolicies"],
    queryFn: async () => {
      const res = await axiosInstance.get("/sickDays");
      return res.data?.data || [];
    },
  });

  const validationSchema = Yup.object({
    month: Yup.string()
      .matches(/^(0?[1-9]|1[0-2])$/, t("addSickDay.validation.month_invalid"))
      .required(t("addSickDay.validation.month_required")),
    year: Yup.string()
      .matches(/^\d{4}$/, t("addSickDay.validation.year_invalid"))
      .required(t("addSickDay.validation.year_required"))
      .test("year-future", t("addSickDay.validation.year_future"), (value) => {
        const currentYear = new Date().getFullYear();
        return parseInt(value) <= currentYear;
      }),
    policyId: Yup.string().required(t("addSickDay.validation.policy_required")),
  });

  const formik = useFormik({
    initialValues: { month: "", year: "", policyId: "" },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (!selectedEmployee) {
          toast.error(t("addSickDay.errors.employee_not_found"));
          return;
        }

        const policy = policies.find((p) => p._id === values.policyId);
        if (!policy) {
          toast.error(t("addSickDay.errors.no_policy"));
          return;
        }

        const accrualRateMatch = policy.accrual_rate.match(/(\d+\.?\d*)/);
        if (!accrualRateMatch) {
          toast.error(t("addSickDay.errors.invalid_accrual_rate"));
          return;
        }
        const days = parseFloat(accrualRateMatch[0]);

        const maxAccrualMatch = policy.max_accrual.match(/(\d+)/);
        const maxAccrual = maxAccrualMatch ? parseInt(maxAccrualMatch[0]) : Infinity;

        const newBalance = (selectedEmployee.sickBalance || 0) + days;
        if (newBalance > maxAccrual) {
          toast.error(t("addSickDay.errors.exceeds_max_accrual"));
          return;
        }

        const inputMonthYear = `${values.month.padStart(2, "0")}/${values.year}`;
        const sickDayExists = selectedEmployee.sickHistory.some((entry) => entry.month === inputMonthYear);
        if (sickDayExists) {
          toast.error(t("addSickDay.errors.month_already_exists"));
          return;
        }

        const payload = {
          employeeId: selectedEmployee._id,
          monthYear: inputMonthYear,
          days,
          country: policy.country,
        };

        const response = await axiosInstance.put(`/employees/${selectedEmployee._id}/add`, payload);
        if (response.data.success) {
          toast.success(t("addSickDay.messages.success"));
          formik.resetForm();
          setIsModalOpen(false);
          setSelectedEmployee(null);
        } else {
          toast.error(response.data.message || t("addSickDay.errors.failed"));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || t("errors.general_error"));
      } finally {
        setLoading(false);
      }
    },
  });

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    formik.resetForm();
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-pink-500 to-rose-600">
              <HeartPulse size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("addSickDay.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("addSickDay.addSickDaysToEmployees")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
            {t("addSickDay.employees_list")}
          </h2>
          {isLoadingEmployees ? (
            <div className="flex items-center justify-center h-32">
              <motion.div
                className="w-12 h-12 border-4 border-t-4 rounded-full"
                style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
              <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                {t("addSickDay.no_employees")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--border-color)' }}>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("addSickDay.form.name")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("addSickDay.form.email")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("addSickDay.form.country")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("addSickDay.form.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <motion.tr
                      key={employee._id}
                      className="border-b hover:bg-opacity-50"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--text-color)' }}>
                        {employee.name} {employee.lastName}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {employee.email}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {employee.address?.country}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => openModal(employee)}
                          className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          disabled={isLoadingPolicies}
                        >
                          {t("addSickDay.buttons.add_sick_day")}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Modal */}
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={closeModal}
          >
            <motion.div
              className="rounded-2xl shadow-2xl p-6 max-w-md w-full border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <HeartPulse size={24} style={{ color: 'var(--color-primary)' }} />
                  {selectedEmployee && `${selectedEmployee.name} ${selectedEmployee.lastName}`}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:scale-110 transition-all"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={formik.handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                    <Calendar size={18} />
                    {t("addSickDay.form.month")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="month"
                    value={formik.values.month}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formik.touched.month && formik.errors.month
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                    style={{
                      borderColor:
                        formik.touched.month && formik.errors.month ? "#ef4444" : "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="">{t("addSickDay.placeholders.select_month")}</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  {formik.touched.month && formik.errors.month && (
                    <p className="text-red-500 text-sm mt-2">{formik.errors.month}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                    <Calendar size={18} />
                    {t("addSickDay.form.year")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="year"
                    min="2000"
                    max={new Date().getFullYear()}
                    placeholder={t("addSickDay.placeholders.year")}
                    value={formik.values.year}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formik.touched.year && formik.errors.year
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                    style={{
                      borderColor:
                        formik.touched.year && formik.errors.year ? "#ef4444" : "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                  {formik.touched.year && formik.errors.year && (
                    <p className="text-red-500 text-sm mt-2">{formik.errors.year}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                    <Globe size={18} />
                    {t("addSickDay.form.policy")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="policyId"
                    value={formik.values.policyId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formik.touched.policyId && formik.errors.policyId
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                    style={{
                      borderColor:
                        formik.touched.policyId && formik.errors.policyId ? "#ef4444" : "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    disabled={isLoadingPolicies}
                  >
                    <option value="">{t("addSickDay.placeholders.select_policy")}</option>
                    {isLoadingPolicies ? (
                      <option disabled>{t("loading")}</option>
                    ) : (
                      policies.map((policy) => (
                        <option key={policy._id} value={policy._id}>
                          {policy.country} ({policy.accrual_rate})
                        </option>
                      ))
                    )}
                  </select>
                  {formik.touched.policyId && formik.errors.policyId && (
                    <p className="text-red-500 text-sm mt-2">{formik.errors.policyId}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || isLoadingPolicies}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {t("addSickDay.buttons.adding")}
                    </>
                  ) : (
                    <>
                      <Plus size={24} />
                      {t("addSickDay.buttons.add_sick_day")}
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AddSickDay;
