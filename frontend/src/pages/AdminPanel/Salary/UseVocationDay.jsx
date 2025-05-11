import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { Calendar, Plus } from "lucide-react";
import { motion } from "framer-motion";

const UseVacationDay = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch current employee
  const { data: employee, isLoading: isLoadingEmp } = useQuery({
    queryKey: ["currentEmployee"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees/me");
      return res.data.data;
    },
  });

  // Mutation to use vacation
  const mutation = useMutation({
    mutationFn: (payload) =>
      axiosInstance.put(`/employees/${employee._id}/vacation/use`, payload),
    onSuccess: () => {
      toast.success(t("useVacationDay.success"));
      queryClient.invalidateQueries(["currentEmployee"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("useVacationDay.error"));
    },
  });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 365); // allow up to a year back

  const formik = useFormik({
    initialValues: { startDate: "", endDate: "", days: "" },
    enableReinitialize: true,
    validationSchema: Yup.object({
      startDate: Yup.date()
        .required(t("useVacationDay.validation.startDate_required"))
        .min(
          minDate,
          t("useVacationDay.validation.startDate_too_old", { days: 365 })
        ),
      endDate: Yup.date()
        .required(t("useVacationDay.validation.endDate_required"))
        .when("startDate", (startDate, schema) =>
          startDate
            ? schema.min(
                startDate,
                t("useVacationDay.validation.end_after_start")
              )
            : schema
        ),
      days: Yup.number()
        .min(1, t("useVacationDay.validation.days_min"))
        .max(
          employee?.vacationBalance || 0,
          t("useVacationDay.validation.days_max", {
            max: employee?.vacationBalance,
          })
        )
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

  if (isLoadingEmp) return <p className="text-center mt-6">{t("loading")}</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto p-8 bg animate-fadeIn rounded-2xl shadow-lg relative overflow-hidden"
    >
      <h1 className="text-3xl font-extrabold mb-6 text-center text-primary">
        {t("useVacationDay.title")}
      </h1>
      <p className="mb-4 text-text">
        {t("useVacationDay.currentBalance")}:{" "}
        <span className="font-semibold text-primary">
          {employee.vacationBalance}
        </span>
      </p>
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-text mb-1">
            {t("useVacationDay.form.startDate")}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-secondary" />
            <input
              type="date"
              name="startDate"
              min={minDate.toISOString().split("T")[0]}
              value={formik.values.startDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full pl-10 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition duration-200 ${
                formik.touched.startDate && formik.errors.startDate
                  ? "border-red-500"
                  : ""
              }`}
            />
          </div>
          {formik.touched.startDate && formik.errors.startDate && (
            <p className="text-red-500 text-xs mt-1">
              {formik.errors.startDate}
            </p>
          )}
        </div>
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-text mb-1">
            {t("useVacationDay.form.endDate")}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-secondary" />
            <input
              type="date"
              name="endDate"
              min={
                formik.values.startDate || minDate.toISOString().split("T")[0]
              }
              value={formik.values.endDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full pl-10 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition duration-200 ${
                formik.touched.endDate && formik.errors.endDate
                  ? "border-red-500"
                  : ""
              }`}
            />
          </div>
          {formik.touched.endDate && formik.errors.endDate && (
            <p className="text-red-500 text-xs mt-1">{formik.errors.endDate}</p>
          )}
        </div>
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-text mb-1">
            {t("useVacationDay.form.days")}
          </label>
          <input
            type="number"
            step="1"
            name="days"
            value={formik.values.days}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition duration-200 ${
              formik.touched.days && formik.errors.days ? "border-red-500" : ""
            }`}
            placeholder={t("useVacationDay.placeholders.days")}
          />
          {formik.touched.days && formik.errors.days && (
            <p className="text-red-500 text-xs mt-1">{formik.errors.days}</p>
          )}
        </div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={mutation.isLoading || !formik.isValid}
          className="w-full flex items-center justify-center bg-button-bg text-button-text py-3 rounded-lg shadow-lg hover:bg-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isLoading ? (
            <span className="animate-spin mr-2 h-5 w-5 border-2 border-button-text border-t-transparent rounded-full"></span>
          ) : (
            <Plus className="w-5 h-5 mr-2 text-button-text" />
          )}
          {t("useVacationDay.buttons.submit")}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default UseVacationDay;
