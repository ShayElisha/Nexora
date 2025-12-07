import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { Calendar, CalendarCheck, Award, Loader } from "lucide-react";
import { motion } from "framer-motion";

const UseVacationDay = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: employee, isLoading: isLoadingEmp } = useQuery({
    queryKey: ["currentEmployee"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees/me");
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      axiosInstance.put(`/employees/${employee._id}/vacation/use`, payload),
    onSuccess: () => {
      toast.success(t("useVacationDay.success"));
      queryClient.invalidateQueries(["currentEmployee"]);
      formik.resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("useVacationDay.error"));
    },
  });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 365);

  const formik = useFormik({
    initialValues: { startDate: "", endDate: "", days: "" },
    enableReinitialize: true,
    validationSchema: Yup.object({
      startDate: Yup.date()
        .required(t("useVacationDay.validation.startDate_required"))
        .min(minDate, t("useVacationDay.validation.startDate_too_old", { days: 365 })),
      endDate: Yup.date()
        .required(t("useVacationDay.validation.endDate_required"))
        .when("startDate", (startDate, schema) =>
          startDate ? schema.min(startDate, t("useVacationDay.validation.end_after_start")) : schema
        ),
      days: Yup.number()
        .min(1, t("useVacationDay.validation.days_min"))
        .max(employee?.vacationBalance || 0, t("useVacationDay.validation.days_max", { max: employee?.vacationBalance }))
        .required(t("useVacationDay.validation.days_required")),
    }),
    onSubmit: (values) => {
      mutation.mutate({
        startDate: values.startDate,
        endDate: values.endDate,
        days: Number(values.days),
      });
    },
  });

  if (isLoadingEmp) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          className="w-16 h-16 border-4 border-t-4 rounded-full"
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <CalendarCheck size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("useVacationDay.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("useVacationDay.requestVacation")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl shadow-lg p-6 lg:p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4 p-6 rounded-xl mb-6" style={{ backgroundColor: 'var(--border-color)' }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
              <Award size={32} color="white" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                {t("useVacationDay.currentBalance")}
              </p>
              <p className="text-4xl font-bold text-green-600">
                {employee.vacationBalance}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("useVacationDay.daysAvailable")}
              </p>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <Calendar size={18} />
                {t("useVacationDay.form.startDate")}
              </label>
              <input
                type="date"
                name="startDate"
                min={minDate.toISOString().split("T")[0]}
                value={formik.values.startDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formik.touched.startDate && formik.errors.startDate
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                style={{
                  borderColor: formik.touched.startDate && formik.errors.startDate ? '#ef4444' : 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              />
              {formik.touched.startDate && formik.errors.startDate && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <Calendar size={18} />
                {t("useVacationDay.form.endDate")}
              </label>
              <input
                type="date"
                name="endDate"
                min={formik.values.startDate || minDate.toISOString().split("T")[0]}
                value={formik.values.endDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formik.touched.endDate && formik.errors.endDate
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                style={{
                  borderColor: formik.touched.endDate && formik.errors.endDate ? '#ef4444' : 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              />
              {formik.touched.endDate && formik.errors.endDate && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.endDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                {t("useVacationDay.form.days")}
              </label>
              <input
                type="number"
                step="1"
                name="days"
                value={formik.values.days}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formik.touched.days && formik.errors.days
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                style={{
                  borderColor: formik.touched.days && formik.errors.days ? '#ef4444' : 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
                placeholder={t("useVacationDay.placeholders.days")}
              />
              {formik.touched.days && formik.errors.days && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.days}</p>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={mutation.isLoading || !formik.isValid}
              className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {mutation.isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t("useVacationDay.submitting")}
                </>
              ) : (
                <>
                  <CalendarCheck size={24} />
                  {t("useVacationDay.buttons.submit")}
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UseVacationDay;
