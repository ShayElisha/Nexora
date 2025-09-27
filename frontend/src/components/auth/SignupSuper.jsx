import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useTranslation } from "react-i18next";

const SignupSuper = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required(t("signUpForm.validation.name_required")),
    email: Yup.string()
      .email(t("signUpForm.validation.invalid_email_format"))
      .required(t("signUpForm.validation.email_required")),
    password: Yup.string()
      .min(8, t("signUpForm.validation.password_min", { count: 8 }))
      .matches(/[A-Z]/, t("signUpForm.validation.password_uppercase"))
      .matches(/[0-9]/, t("signUpForm.validation.password_number"))
      .matches(
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        t("signUpForm.validation.password_special_char")
      )
      .required(t("signUpForm.validation.password_required")),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      role: "SuperAdmin",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await axiosInstance.post("/superAdmin/signup", {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        });
        console.log("Server response:", response.data); // לוג לתגובה
        if (response.data.success) {
          toast.success(t("messages.signup_success"), {
            position: "top-center",
          });
          navigate("/login");
        } else {
          toast.error(response.data.message || t("messages.signup_failed"), {
            position: "top-center",
          });
        }
      } catch (error) {
        console.error("Error during signup:", error.response?.data || error); // לוג לשגיאה
        toast.error(
          error.response?.data?.message || t("errors.general_error"),
          { position: "top-center" }
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="space-y-8 bg-bg/95 backdrop-blur-lg rounded-2xl shadow-xl p-8 sm:p-6 max-w-md mx-auto"
    >
      {/* Header */}
      <SectionHeader title={t("signUpForm.sections.personal_info")} />

      {/* Name, Email, and Password Fields */}
      <div className="space-y-6">
        <InputField
          label={t("signUpForm.form.name")}
          icon={<User className="w-5 h-5 text-secondary" />}
          name="name"
          type="text"
          placeholder={t("signUpForm.placeholders.name")}
          formik={formik}
          ariaRequired="true"
        />
        <InputField
          label={t("signUpForm.form.email")}
          icon={<Mail className="w-5 h-5 text-secondary" />}
          name="email"
          type="email"
          placeholder={t("signUpForm.placeholders.email")}
          formik={formik}
          ariaRequired="true"
        />
        <PasswordField
          label={t("signUpForm.form.password")}
          icon={<Lock className="w-5 h-5 text-secondary" />}
          name="password"
          placeholder={t("signUpForm.placeholders.password")}
          formik={formik}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          ariaRequired="true"
          t={t}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-8 bg-button-bg text-button-text font-semibold rounded-lg shadow-lg hover:bg-accent focus:ring-4 focus:ring-primary/50 disabled:bg-secondary/50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105"
      >
        {loading ? (
          <>
            <span className="inline-block w-6 h-6 border-2 border-button-text border-t-transparent rounded-full animate-spin mr-3"></span>
            {t("signUpForm.buttons.signing")}
          </>
        ) : (
          t("signUpForm.buttons.sign_up")
        )}
      </button>
    </form>
  );
};

// InputField Component
const InputField = ({
  label,
  icon,
  name,
  placeholder,
  formik,
  type = "text",
  ariaRequired,
}) => (
  <div className="animate-slideIn">
    <label className="block text-sm font-medium text-text">
      {label}
      {ariaRequired && <span aria-hidden="true">*</span>}
    </label>
    <div className="relative mt-2">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
        className={`w-full h-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300 ${
          icon ? "pl-12" : "pl-4"
        } ${
          formik.touched[name] && formik.errors[name]
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : ""
        }`}
        aria-required={ariaRequired}
        aria-invalid={formik.touched[name] && !!formik.errors[name]}
        aria-describedby={
          formik.touched[name] && formik.errors[name]
            ? `${name}-error`
            : undefined
        }
      />
    </div>
    {formik.touched[name] && formik.errors[name] && (
      <p
        id={`${name}-error`}
        className="text-sm text-red-500 mt-1 animate-fadeIn"
      >
        {formik.errors[name]}
      </p>
    )}
  </div>
);

// PasswordField Component
const PasswordField = ({
  label,
  icon,
  name,
  placeholder,
  formik,
  showPassword,
  setShowPassword,
  ariaRequired,
  t,
}) => (
  <div className="animate-slideIn">
    <label className="block text-sm font-medium text-text">
      {label}
      {ariaRequired && <span aria-hidden="true">*</span>}
    </label>
    <div className="relative mt-2">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
        {icon}
      </div>
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
        className={`w-full h-12 pl-12 pr-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300 ${
          formik.touched[name] && formik.errors[name]
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : ""
        }`}
        aria-required={ariaRequired}
        aria-invalid={formik.touched[name] && !!formik.errors[name]}
        aria-describedby={
          formik.touched[name] && formik.errors[name]
            ? `${name}-error`
            : undefined
        }
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-text focus:outline-none transition-colors duration-300"
        aria-label={
          showPassword
            ? t("signUpForm.aria.hide_password")
            : t("signUpForm.aria.show_password")
        }
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
    {formik.touched[name] && formik.errors[name] && (
      <p
        id={`${name}-error`}
        className="text-sm text-red-500 mt-1 animate-fadeIn"
      >
        {formik.errors[name]}
      </p>
    )}
  </div>
);

// SectionHeader Component
const SectionHeader = ({ title }) => (
  <h3 className="text-xl font-semibold text-text mt-6 mb-4 relative animate-fadeIn">
    {title}
    <span className="absolute -bottom-1 left-0 w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
  </h3>
);

export default SignupSuper;
