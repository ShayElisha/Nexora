import { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLock } from "react-icons/fi";
import { Loader } from "lucide-react";

const Card = ({ children }) => (
  <div className="relative w-full max-w-md z-10">
    <div
      className="backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-color)",
        border: "1px solid var(--border-color)",
      }}
    >
      <div
        className="h-2"
        style={{
          background:
            "linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))",
        }}
      ></div>
      <div className="p-8 sm:p-10">{children}</div>
    </div>
  </div>
);

const ResetPasswordPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [submitting, setSubmitting] = useState(false);

  const tokenInvalid = !token || !email;

  const validationSchema = useMemo(
    () =>
      Yup.object({
        password: Yup.string()
          .min(8, "Password must be at least 8 characters")
          .required("Password is required"),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("password"), null], t("auth.passwords_must_match"))
          .required("Confirm password is required"),
      }),
    [t]
  );

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema,
    onSubmit: async (values) => {
      if (tokenInvalid) {
        toast.error("Invalid reset link");
        return;
      }
      setSubmitting(true);
      try {
        const response = await axiosInstance.post("/auth/reset-password", {
          token,
          email,
          password: values.password,
        });
        toast.success(
          response.data?.message || t("auth.password_updated")
        );
        navigate("/login");
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to reset password"
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
            opacity: 0.15,
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
            opacity: 0.15,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {tokenInvalid ? (
        <Card>
          <div className="text-center">
            <h1
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--text-color)" }}
            >
              {t("auth.reset_password")}
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-secondary)" }}>
              {t("auth.reset_password_description")}
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-all duration-300"
              style={{
                background:
                  "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
                color: "var(--button-text)",
              }}
            >
              {t("auth.request_password_reset")}
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center mb-6">
            <h1
              className="text-3xl font-bold"
              style={{
                background:
                  "linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("auth.reset_password")}
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--color-secondary)" }}>
              {t("auth.reset_password_description")}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              formik.handleSubmit(e);
            }}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-color)" }}
              >
                {t("auth.new_password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock
                    className="h-5 w-5"
                    style={{ color: "var(--color-secondary)" }}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("auth.new_password")}
                  onChange={formik.handleChange}
                  value={formik.values.password}
                  onBlur={formik.handleBlur}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    borderColor:
                      formik.errors.password && formik.touched.password
                        ? "#ef4444"
                        : "var(--border-color)",
                  }}
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  {formik.errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-color)" }}
              >
                {t("auth.confirm_new_password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock
                    className="h-5 w-5"
                    style={{ color: "var(--color-secondary)" }}
                  />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t("auth.confirm_new_password")}
                  onChange={formik.handleChange}
                  value={formik.values.confirmPassword}
                  onBlur={formik.handleBlur}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    borderColor:
                      formik.errors.confirmPassword && formik.touched.confirmPassword
                        ? "#ef4444"
                        : "var(--border-color)",
                  }}
                />
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  {formik.errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full relative overflow-hidden group font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))",
                color: "var(--button-text)",
              }}
            >
              <span className="relative flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <Loader className="size-5 animate-spin" />
                    <span>{t("auth.resetting")}</span>
                  </>
                ) : (
                  <span>{t("auth.reset_password")}</span>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-semibold transition-all duration-300 hover:underline underline-offset-4"
              style={{ color: "var(--color-primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            >
              {t("auth.back_to_login")}
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResetPasswordPage;
