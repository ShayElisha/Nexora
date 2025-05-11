import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { Calendar, Plus } from "lucide-react";
import { motion } from "framer-motion";

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
      const res = await axiosInstance.get(
        `/sickDays?country=${employee.address.country}`
      );
      return res.data.data[0] || null;
    },
    enabled: !!employee?.address?.country,
  });

  const useMutationFn = useMutation({
    mutationFn: (payload) =>
      axiosInstance.put(`/employees/${employee._id}/use`, payload),
    onSuccess: () => {
      toast.success(t("useSickDay.success"));
      queryClient.invalidateQueries(["currentEmployee"]);
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
        .max(
          employee?.sickBalance || 0,
          t("useSickDay.validation.days_max", { max: employee?.sickBalance })
        )
        .required(t("useSickDay.validation.days_required")),
    }),
    onSubmit: (values) => {
      useMutationFn.mutate({ date: values.date, days: Number(values.days) });
    },
  });

  if (isLoadingEmp)
    return <p className="text-center mt-6 text-secondary">{t("loading")}</p>;

  return (
    <motion.div className="max-w-2xl  mx-auto p-8 bg animate-fadeIn rounded-2xl shadow-lg relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

      <motion.h1
        className="text-3xl font-extrabold mb-6 text-center text-primary"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {t("useSickDay.title")}
      </motion.h1>

      <motion.p
        className="mb-4 text-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t("useSickDay.currentBalance")}:{" "}
        <span className="font-semibold text-primary">
          {employee.sickBalance}
        </span>
      </motion.p>

      {policy && (
        <motion.p
          className="mb-6 text-sm text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t("useSickDay.policyInfo", {
            rate: policy.accrual_rate,
            max: policy.max_accrual,
          })}
        </motion.p>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-text mb-1">
            {t("useSickDay.form.date")}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-secondary" />
            <input
              type="date"
              name="date"
              min={minDate.toISOString().split("T")[0]}
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full pl-10 p-3 border border-border-color rounded-lg bg-bg text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${
                formik.touched.date && formik.errors.date
                  ? "border-red-500"
                  : ""
              }`}
            />
          </div>
          {formik.touched.date && formik.errors.date && (
            <p className="text-red-500 text-xs mt-1">{formik.errors.date}</p>
          )}
        </div>

        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-text mb-1">
            {t("useSickDay.form.days")}
          </label>
          <input
            type="number"
            step="0.5"
            name="days"
            value={formik.values.days}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full p-3 border border-border-color rounded-lg bg-bg text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${
              formik.touched.days && formik.errors.days ? "border-red-500" : ""
            }`}
            placeholder={t("useSickDay.placeholders.days")}
          />
          {formik.touched.days && formik.errors.days && (
            <p className="text-red-500 text-xs mt-1">{formik.errors.days}</p>
          )}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={useMutationFn.isLoading || !formik.isValid}
          className="w-full flex items-center justify-center bg-button-bg text-button-text py-3 rounded-lg shadow-lg hover:bg-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {useMutationFn.isLoading ? (
            <span className="animate-spin mr-2 h-5 w-5 border-2 border-button-text border-t-transparent rounded-full"></span>
          ) : (
            <Plus className="w-5 h-5 mr-2 text-button-text" />
          )}
          {t("useSickDay.buttons.submit")}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default UseSickDay;
