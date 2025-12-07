import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    <form onSubmit={formik.handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div className="group">
        <label 
          htmlFor="email" 
          className="block text-sm font-semibold mb-2"
          style={{ color: 'var(--text-color)' }}
        >
          {t("auth.email")}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail 
              className="h-5 w-5 transition-colors duration-300" 
              style={{ color: 'var(--color-secondary)' }}
            />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            placeholder={t("auth.enter_email")}
            onChange={formik.handleChange}
            value={formik.values.email}
            aria-invalid={formik.errors.email ? "true" : "false"}
            style={{
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              borderColor: formik.errors.email && formik.touched.email ? '#ef4444' : 'var(--border-color)',
            }}
            className={`block w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              formik.errors.email && formik.touched.email
                ? "border-red-500 focus:ring-red-500"
                : ""
            }`}
            onFocus={(e) => !formik.errors.email && (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => {
              formik.handleBlur(e);
              if (!formik.errors.email) e.target.style.borderColor = 'var(--border-color)';
            }}
          />
        </div>
        {formik.touched.email && formik.errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            {formik.errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="group">
        <label 
          htmlFor="password" 
          className="block text-sm font-semibold mb-2"
          style={{ color: 'var(--text-color)' }}
        >
          {t("auth.password")}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock 
              className="h-5 w-5 transition-colors duration-300" 
              style={{ color: 'var(--color-secondary)' }}
            />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.enter_password")}
            onChange={formik.handleChange}
            value={formik.values.password}
            aria-invalid={formik.errors.password ? "true" : "false"}
            style={{
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              borderColor: formik.errors.password && formik.touched.password ? '#ef4444' : 'var(--border-color)',
            }}
            className={`block w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              formik.errors.password && formik.touched.password
                ? "border-red-500 focus:ring-red-500"
                : ""
            }`}
            onFocus={(e) => !formik.errors.password && (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => {
              formik.handleBlur(e);
              if (!formik.errors.password) e.target.style.borderColor = 'var(--border-color)';
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-300"
            style={{ color: 'var(--color-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
          >
            {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
          </button>
        </div>
        {formik.touched.password && formik.errors.password && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            {formik.errors.password}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-sm font-semibold transition-colors duration-300"
          style={{ color: 'var(--color-primary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
        >
          {t("auth.forgot_password")}
        </button>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full relative overflow-hidden group font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`,
            color: 'var(--button-text)'
          }}
        >
          <span 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(to right, var(--color-accent), var(--color-primary), var(--color-secondary))`
            }}
          ></span>
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader className="size-5 animate-spin" />
                <span>{t("auth.logging_in")}</span>
              </>
            ) : (
              <>
                <span>{t("auth.login")}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </>
            )}
          </span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
