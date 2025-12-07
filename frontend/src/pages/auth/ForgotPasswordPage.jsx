import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail } from "react-icons/fi";
import { Loader } from "lucide-react";

const ForgotPasswordPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email format")
        .required("Email is required"),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const response = await axiosInstance.post("/auth/forgot-password", {
          email: values.email,
        });
        toast.success(
          response.data?.message || t("auth.instructions_sent")
        );
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to send reset link"
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
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

          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-3xl sm:text-4xl font-bold"
                style={{
                  background:
                    "linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("auth.request_password_reset")}
              </motion.h1>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--color-secondary)" }}
              >
                {t("auth.reset_password_description")}
              </p>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-color)" }}
                >
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail
                      className="h-5 w-5"
                      style={{ color: "var(--color-secondary)" }}
                    />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("auth.enter_email")}
                    onChange={formik.handleChange}
                    value={formik.values.email}
                    onBlur={formik.handleBlur}
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      borderColor:
                        formik.errors.email && formik.touched.email
                          ? "#ef4444"
                          : "var(--border-color)",
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
                      <span>{t("auth.sending")}</span>
                    </>
                  ) : (
                    <span>{t("auth.send_reset_link")}</span>
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
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
