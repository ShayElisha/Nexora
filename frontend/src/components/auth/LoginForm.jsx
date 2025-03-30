import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";

const LoginForm = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await axiosInstance.post("/auth/login", values, {
          withCredentials: true,
        });
        if (response.data.success) {
          toast.success("Login successful!");
          queryClient.invalidateQueries(["authUser"]);
        } else {
          toast.error(response.data.message || "Login failed");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6 animate-fadeIn">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text">
          {t("auth.email")}
        </label>
        <div className="relative mt-1">
          <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary" />
          <input
            id="email"
            name="email"
            type="email"
            placeholder={t("auth.enter_email")}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            aria-invalid={formik.errors.email ? "true" : "false"}
            className={`pl-10 block w-full py-2 rounded-md shadow-sm bg-bg border border-border-color text-text placeholder-secondary focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              formik.errors.email && formik.touched.email
                ? "border-red-500"
                : ""
            }`}
          />
        </div>
        {formik.touched.email && formik.errors.email && (
          <p className="mt-1 text-sm text-red-500">
            {t(`auth.errors.${formik.errors.email}`)}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text"
        >
          {t("auth.password")}
        </label>
        <div className="relative mt-1">
          <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.enter_password")}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            aria-invalid={formik.errors.password ? "true" : "false"}
            className={`pl-10 pr-10 block w-full py-2 rounded-md shadow-sm bg-bg border border-border-color text-text placeholder-secondary focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              formik.errors.password && formik.touched.password
                ? "border-red-500"
                : ""
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary hover:text-accent transition-colors duration-200"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {formik.touched.password && formik.errors.password && (
          <p className="mt-1 text-sm text-red-500">
            {t(`auth.errors.${formik.errors.password}`)}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 bg-button-bg text-button-text font-semibold rounded-md shadow-md hover:bg-secondary focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-gray-400 transition-all duration-300"
        >
          {loading ? (
            <Loader className="size-5 animate-spin" />
          ) : (
            t("auth.login")
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
