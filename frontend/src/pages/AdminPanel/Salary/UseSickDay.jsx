import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Calendar, HeartPulse, Award, Loader, Info } from "lucide-react";

const UseSickDay = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: employee, isLoading: isLoadingEmp } = useQuery({
    queryKey: ["currentEmployee"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees/me");
      return res.data.data;
    },
  });

  const { data: policy } = useQuery({
    queryKey: ["sickPolicy", employee?.address?.country],
    queryFn: async () => {
      const res = await axiosInstance.get(`/sickDays?country=${employee.address.country}`);
      return res.data.data[0] || null;
    },
    enabled: !!employee?.address?.country,
  });

  const useMutationFn = useMutation({
    mutationFn: (payload) => axiosInstance.put(`/employees/${employee._id}/use`, payload),
    onSuccess: () => {
      toast.success(t("useSickDay.success"));
      queryClient.invalidateQueries(["currentEmployee"]);
      formik.resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("useSickDay.error"));
    },
  });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 45);

  const formik = useFormik({
    initialValues: { date: "", days: "" },
    enableReinitialize: true,
    validationSchema: Yup.object({
      date: Yup.date()
        .required(t("useSickDay.validation.date_required"))
        .min(minDate, t("useSickDay.validation.date_too_old", { days: 45 })),
      days: Yup.number()
        .min(0.5, t("useSickDay.validation.days_min"))
        .max(employee?.sickBalance || 0, t("useSickDay.validation.days_max", { max: employee?.sickBalance }))
        .required(t("useSickDay.validation.days_required")),
    }),
    onSubmit: (values) => {
      useMutationFn.mutate({ date: values.date, days: Number(values.days) });
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-rose-500 to-pink-600">
              <HeartPulse size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("useSickDay.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("useSickDay.requestSickLeave")}
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
            <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600">
              <Award size={32} color="white" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                {t("useSickDay.currentBalance")}
              </p>
              <p className="text-4xl font-bold text-rose-600">
                {employee.sickBalance}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {t("useSickDay.daysAvailable")}
              </p>
            </div>
          </div>

          {policy && (
            <motion.div
              className="p-4 rounded-xl mb-6 flex items-start gap-3"
              style={{ backgroundColor: 'var(--border-color)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Info size={20} style={{ color: 'var(--color-primary)' }} className="mt-0.5" />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-color)' }}>
                  {t("useSickDay.policyInfo")}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                  {t("useSickDay.accrualRate")}: {policy.accrual_rate}<br />
                  {t("useSickDay.maxAccrual")}: {policy.max_accrual}
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <Calendar size={18} />
                {t("useSickDay.form.date")}
              </label>
              <input
                type="date"
                name="date"
                min={minDate.toISOString().split("T")[0]}
                value={formik.values.date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  formik.touched.date && formik.errors.date
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                style={{
                  borderColor: formik.touched.date && formik.errors.date ? '#ef4444' : 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              />
              {formik.touched.date && formik.errors.date && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("useSickDay.form.days")}
              </label>
              <input
                type="number"
                step="0.5"
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
                placeholder={t("useSickDay.placeholders.days")}
              />
              {formik.touched.days && formik.errors.days && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.days}</p>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={useMutationFn.isLoading || !formik.isValid}
              className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {useMutationFn.isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t("useSickDay.submitting")}
                </>
              ) : (
                <>
                  <HeartPulse size={24} />
                  {t("useSickDay.buttons.submit")}
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UseSickDay;
