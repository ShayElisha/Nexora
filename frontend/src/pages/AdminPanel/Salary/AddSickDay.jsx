import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { Calendar, Plus, X } from "lucide-react";

const AddSickDay = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data?.data || [];
    },
  });

  // Fetch sick days policies
  const { data: policies = [], isLoading: isLoadingPolicies } = useQuery({
    queryKey: ["sickDaysPolicies"],
    queryFn: async () => {
      const res = await axiosInstance.get("/sickDays");
      console.log("policies", res.data?.data);
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
    initialValues: {
      month: "",
      year: "",
      policyId: "",
    },
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

        // Parse accrual_rate (e.g., "1.5 לחודש")
        const accrualRateMatch = policy.accrual_rate.match(/(\d+\.?\d*)/);
        if (!accrualRateMatch) {
          toast.error(t("addSickDay.errors.invalid_accrual_rate"));
          return;
        }
        const days = parseFloat(accrualRateMatch[0]);

        // Parse max_accrual (e.g., "90 ימים")
        const maxAccrualMatch = policy.max_accrual.match(/(\d+)/);
        const maxAccrual = maxAccrualMatch
          ? parseInt(maxAccrualMatch[0])
          : Infinity;

        // Check if adding days exceeds max_accrual
        const newBalance = (selectedEmployee.sickBalance || 0) + days;
        if (newBalance > maxAccrual) {
          toast.error(t("addSickDay.errors.exceeds_max_accrual"));
          return;
        }

        // Check if a sick day already exists for this month/year
        const inputMonthYear = `${values.month.padStart(2, "0")}/${
          values.year
        }`;
        const sickDayExists = selectedEmployee.sickHistory.some(
          (entry) => entry.month === inputMonthYear
        );
        if (sickDayExists) {
          toast.error(t("addSickDay.errors.month_already_exists"));
          return;
        }

        // Prepare data for submission
        const payload = {
          employeeId: selectedEmployee._id,
          monthYear: inputMonthYear,
          days,
          country: policy.country,
        };

        const response = await axiosInstance.put(
          `/employees/${selectedEmployee._id}/add`,
          payload
        );
        if (response.data.success) {
          toast.success(t("addSickDay.messages.success"));
          formik.resetForm();
          setIsModalOpen(false);
          setSelectedEmployee(null);
        } else {
          toast.error(response.data.message || t("addSickDay.errors.failed"));
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || t("errors.general_error"),
          { position: "top-center" }
        );
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {t("addSickDay.title")}
      </h1>

      {/* Employees List */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {t("addSickDay.employees_list")}
        </h2>
        {isLoadingEmployees ? (
          <p className="text-gray-500">{t("loading")}</p>
        ) : employees.length === 0 ? (
          <p className="text-gray-500">{t("addSickDay.no_employees")}</p>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">{t("addSickDay.form.name")}</th>
                <th className="p-2 border">{t("addSickDay.form.email")}</th>
                <th className="p-2 border">{t("addSickDay.form.country")}</th>
                <th className="p-2 border">{t("addSickDay.form.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    {employee.name} {employee.lastName}
                  </td>
                  <td className="p-2 border">{employee.email}</td>
                  <td className="p-2 border">{employee.address.country}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => openModal(employee)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-all duration-300"
                      disabled={isLoadingPolicies}
                    >
                      {t("addSickDay.buttons.add_sick_day")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Adding Sick Day */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {t("addSickDay.modal_title", {
                  name: selectedEmployee
                    ? `${selectedEmployee.name} ${selectedEmployee.lastName}`
                    : "",
                })}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Month Selection */}
              <div className="animate-slideIn">
                <label className="block text-sm font-medium text-text">
                  {t("addSickDay.form.month")} <span aria-hidden="true">*</span>
                </label>
                <div className="relative mt-2">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <select
                    name="month"
                    value={formik.values.month}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full h-12 pl-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300 ${
                      formik.touched.month && formik.errors.month
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : ""
                    }`}
                    aria-required="true"
                  >
                    <option value="">
                      {t("addSickDay.placeholders.select_month")}
                    </option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                {formik.touched.month && formik.errors.month && (
                  <p className="text-sm text-red-500 mt-1 animate-fadeIn">
                    {formik.errors.month}
                  </p>
                )}
              </div>

              {/* Year Selection */}
              <div className="animate-slideIn">
                <label className="block text-sm font-medium text-text">
                  {t("addSickDay.form.year")} <span aria-hidden="true">*</span>
                </label>
                <div className="relative mt-2">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    name="year"
                    min="2000"
                    max={new Date().getFullYear()}
                    placeholder={t("addSickDay.placeholders.year")}
                    value={formik.values.year}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full h-12 pl-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300 ${
                      formik.touched.year && formik.errors.year
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : ""
                    }`}
                    aria-required="true"
                  />
                </div>
                {formik.touched.year && formik.errors.year && (
                  <p className="text-sm text-red-500 mt-1 animate-fadeIn">
                    {formik.errors.year}
                  </p>
                )}
              </div>

              {/* Policy Selection */}
              <div className="animate-slideIn">
                <label className="block text-sm font-medium text-text">
                  {t("addSickDay.form.policy")}{" "}
                  <span aria-hidden="true">*</span>
                </label>
                <div className="relative mt-2">
                  <select
                    name="policyId"
                    value={formik.values.policyId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full h-12 pl-4 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300 ${
                      formik.touched.policyId && formik.errors.policyId
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : ""
                    }`}
                    aria-required="true"
                    disabled={isLoadingPolicies}
                  >
                    <option value="">
                      {t("addSickDay.placeholders.select_policy")}
                    </option>
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
                </div>
                {formik.touched.policyId && formik.errors.policyId && (
                  <p className="text-sm text-red-500 mt-1 animate-fadeIn">
                    {formik.errors.policyId}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isLoadingPolicies}
                className="w-full py-3 mt-4 bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-600 focus:ring-4 focus:ring-blue-500/50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></span>
                    {t("addSickDay.buttons.adding")}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {t("addSickDay.buttons.add_sick_day")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSickDay;
