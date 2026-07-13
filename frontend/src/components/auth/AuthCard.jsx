import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader,
  Lock,
  Mail,
} from "lucide-react";
import axiosInstance from "../../lib/axios";
import AuthSurface from "./AuthSurface";
import AuthCardHeader from "./AuthCardHeader";

const AuthInput = ({
  id,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  trailing,
}) => (
  <div className="group">
    <label
      htmlFor={id}
      className="block text-sm font-medium mb-1.5"
      style={{ color: "var(--text-muted)" }}
    >
      {label}
    </label>
    <div className="relative">
      <span
        className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5"
        style={{ color: "var(--text-muted)" }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="block w-full py-3 ps-10 pe-10 text-sm border transition-all duration-300 ease-in-out focus:outline-none focus:ring-2"
        style={{
          backgroundColor: "var(--bg-color)",
          color: "var(--text-color)",
          borderColor: error && touched ? "#ef4444" : "var(--border-color)",
          borderRadius: "var(--radius)",
          boxShadow: "none",
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = "var(--color-primary)";
            e.target.style.boxShadow =
              "0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent)";
          }
        }}
        onBlur={(e) => {
          onBlur?.(e);
          if (!error) {
            e.target.style.borderColor = "var(--border-color)";
            e.target.style.boxShadow = "none";
          }
        }}
      />
      {trailing && (
        <span className="absolute inset-y-0 end-0 flex items-center pe-3">
          {trailing}
        </span>
      )}
    </div>
    {touched && error && (
      <p className="mt-1.5 text-xs text-red-500">{error}</p>
    )}
  </div>
);

const AuthCard = ({ defaultIsLogin = true }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginSchema = Yup.object({
    email: Yup.string()
      .email(t("auth.errors.Invalid email format"))
      .required(t("auth.errors.Email is required")),
    password: Yup.string().required(t("auth.errors.Password is required")),
  });

  const signupSchema = loginSchema.shape({
    fullName: Yup.string().required(t("auth.errors.Full name is required")),
  });

  const formik = useFormik({
    initialValues: { fullName: "", email: "", password: "" },
    validate: async (values) => {
      const schema = isLogin ? loginSchema : signupSchema;
      try {
        await schema.validate(values, { abortEarly: false });
        return {};
      } catch (err) {
        const errors = {};
        err.inner?.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        return errors;
      }
    },
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (isLogin) {
          const response = await axiosInstance.post(
            "/auth/login",
            { email: values.email, password: values.password },
            { withCredentials: true }
          );
          if (response.data.success) {
            toast.success(t("auth.login_success", "Login successful!"));
            queryClient.invalidateQueries(["authUser"]);
          } else {
            toast.error(response.data.message || t("auth.login_failed", "Login failed"));
          }
        } else {
          navigate("/create-company", {
            state: {
              email: values.email,
              adminName: values.fullName,
            },
          });
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            t("auth.generic_error", "An error occurred")
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const switchMode = (login) => {
    setIsLogin(login);
    setShowPassword(false);
    formik.resetForm();
  };

  return (
    <AuthSurface dir={isRTL ? "rtl" : "ltr"}>
      <div className="px-8 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-8">
        <AuthCardHeader
          title={isLogin ? t("auth.welcome_back") : t("auth.signup_title")}
          subtitle={isLogin ? t("auth.please_login") : t("auth.signup_subtitle")}
        />

        <form
          onSubmit={formik.handleSubmit}
          className="space-y-4 transition-all duration-300 ease-in-out"
        >
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isLogin
                ? "grid-rows-[0fr] opacity-0 -mt-4"
                : "grid-rows-[1fr] opacity-100 mt-0"
            }`}
          >
            <div className="overflow-hidden">
              <AuthInput
                id="fullName"
                label={t("auth.full_name")}
                icon={Building2}
                placeholder={t("auth.enter_full_name")}
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.fullName}
                touched={formik.touched.fullName}
              />
            </div>
          </div>

          <AuthInput
            id="email"
            label={t("auth.email")}
            icon={Mail}
            type="email"
            placeholder={t("auth.enter_email")}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email}
          />

          <AuthInput
            id="password"
            label={t("auth.password")}
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.enter_password")}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.password}
            touched={formik.touched.password}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-0.5 transition-colors duration-200 hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
                aria-label={
                  showPassword
                    ? t("auth.hide_password", "Hide password")
                    : t("auth.show_password", "Show password")
                }
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                )}
              </button>
            }
          />

          {isLogin && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm transition-opacity duration-200 hover:opacity-70"
                style={{ color: "var(--color-primary)" }}
              >
                {t("auth.forgot_password")}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all duration-300 ease-in-out hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              background:
                "linear-gradient(to right, var(--color-primary), var(--color-accent))",
              color: "var(--button-text)",
              borderRadius: "var(--radius)",
            }}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                {isLogin ? t("auth.logging_in") : t("auth.signing_up")}
              </>
            ) : (
              <>
                {isLogin ? t("auth.login") : t("auth.sign_up")}
                <Arrow className="h-4 w-4" strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        <p
          className="mt-7 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {isLogin ? (
            <>
              {t("auth.not_registered")}{" "}
              <button
                type="button"
                onClick={() => navigate("/create-company")}
                className="font-semibold transition-opacity duration-200 hover:opacity-70"
                style={{ color: "var(--color-primary)" }}
              >
                {t("auth.sign_up_here")}
              </button>
            </>
          ) : (
            <>
              {t("auth.already_have_account")}{" "}
              <button
                type="button"
                onClick={() => switchMode(true)}
                className="font-semibold transition-opacity duration-200 hover:opacity-70"
                style={{ color: "var(--color-primary)" }}
              >
                {t("auth.toggle_to_login")}
              </button>
            </>
          )}
        </p>
      </div>
    </AuthSurface>
  );
};

export default AuthCard;
