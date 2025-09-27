import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Send,
  X,
  Plus,
  Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AddDepartmentModal from "../../pages/AdminPanel/departments/Add_Department.jsx";

// Utility functions for nested form handling
const getNestedError = (errors, name) =>
  name.split(".").reduce((obj, key) => obj && obj[key], errors);
const getNestedValue = (values, name) =>
  name.split(".").reduce((obj, key) => obj && obj[key], values) || "";

const SignUpForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const companyIdFromQuery = queryParams.get("companyId");

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);

  const {
    data: departments = [],
    refetch: refetchDepartments,
    isLoading: isLoadingDepts,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/departments");
      return res.data?.data || [];
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string().required(t("signUpForm.validation.first_name_required")),
    lastName: Yup.string().required(
      t("signUpForm.validation.last_name_required")
    ),
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
    phone: Yup.string().required(t("signUpForm.validation.phone_required")),
    gender: Yup.string()
      .oneOf(
        ["Male", "Female", "Other"],
        t("signUpForm.validation.gender_required")
      )
      .required(t("signUpForm.validation.gender_required")),
    identity: Yup.string().required(
      t("signUpForm.validation.identity_required")
    ),
    dateOfBirth: Yup.date()
      .required(t("signUpForm.validation.date_of_birth_required"))
      .max(new Date(), t("signUpForm.validation.date_of_birth_future"))
      .test("age", t("signUpForm.validation.date_of_birth_age"), (value) => {
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          return age - 1 >= 16; // Minimum age of 16
        }
        return age >= 16;
      }),
    address: Yup.object({
      street: Yup.string().required(t("signUpForm.validation.street_required")),
      city: Yup.string().required(t("signUpForm.validation.city_required")),
      country: Yup.string().required(
        t("signUpForm.validation.country_required")
      ),
      postalCode: Yup.string().required(
        t("signUpForm.validation.postal_code_required")
      ),
    }),
    bankDetails: Yup.object({
      accountNumber: Yup.string().required(
        t("signUpForm.validation.account_number_required")
      ),
      bankNumber: Yup.string().required(
        t("signUpForm.validation.bank_number_required")
      ),
      branchCode: Yup.string().required(
        t("signUpForm.validation.branch_code_required")
      ),
    }),
    department: Yup.string().notRequired(),
    role: Yup.string().notRequired(),
    paymentType: Yup.string()
      .oneOf(
        ["Hourly", "Global", "Commission-Based"],
        t("signUpForm.validation.payment_type_invalid")
      )
      .required(t("signUpForm.validation.payment_type_required")),
    hourlySalary: Yup.number()
      .when("paymentType", {
        is: "Hourly",
        then: (schema) =>
          schema
            .min(0, t("signUpForm.validation.hourly_salary_min"))
            .required(t("signUpForm.validation.hourly_salary_required")),
        otherwise: (schema) => schema.notRequired(),
      })
      .nullable(),
    globalSalary: Yup.number()
      .when("paymentType", {
        is: "Global",
        then: (schema) =>
          schema
            .min(0, t("signUpForm.validation.global_salary_min"))
            .required(t("signUpForm.validation.global_salary_required")),
        otherwise: (schema) => schema.notRequired(),
      })
      .nullable(),
    expectedHours: Yup.number()
      .when("paymentType", {
        is: "Global",
        then: (schema) =>
          schema
            .min(0, t("signUpForm.validation.expected_hours_min"))
            .required(t("signUpForm.validation.expected_hours_required")),
        otherwise: (schema) => schema.notRequired(),
      })
      .nullable(),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      gender: "",
      identity: "",
      dateOfBirth: "",
      department: "",
      role: "",
      address: { street: "", city: "", country: "", postalCode: "" },
      bankDetails: { accountNumber: "", bankNumber: "", branchCode: "" },
      paymentType: "Global",
      hourlySalary: "",
      globalSalary: "",
      expectedHours: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("lastName", values.lastName);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("phone", values.phone);
      formData.append("gender", values.gender);
      formData.append("identity", values.identity);
      formData.append("dateOfBirth", values.dateOfBirth);
      if (!authUser && companyIdFromQuery)
        formData.append("companyId", companyIdFromQuery);
      if (authUser) {
        formData.append("department", values.department || "");
        formData.append("role", values.role || "");
      }
      formData.append("address[street]", values.address.street);
      formData.append("address[city]", values.address.city);
      formData.append("address[country]", values.address.country);
      formData.append("address[postalCode]", values.address.postalCode);
      formData.append(
        "bankDetails[accountNumber]",
        values.bankDetails.accountNumber
      );
      formData.append("bankDetails[bankNumber]", values.bankDetails.bankNumber);
      formData.append("bankDetails[branchCode]", values.bankDetails.branchCode);
      formData.append("paymentType", values.paymentType);
      if (values.hourlySalary)
        formData.append("hourlySalary", values.hourlySalary);
      if (values.globalSalary)
        formData.append("globalSalary", values.globalSalary);
      if (values.expectedHours)
        formData.append("expectedHours", values.expectedHours);
      if (profileImageFile) formData.append("profileImage", profileImageFile);
      else if (profileImageUrl)
        formData.append("profileImageUrl", profileImageUrl);

      try {
        const response = await axiosInstance.post("/auth/signup", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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
        toast.error(
          error.response?.data?.message || t("errors.general_error"),
          { position: "top-center" }
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImageUrl("");
    toast.success(t("signUpForm.messages.image_removed"), {
      position: "top-center",
    });
  };

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-8 bg-bg/95 backdrop-blur-lg rounded-2xl shadow-xl p-8 sm:p-6 max-w-full mx-auto"
      >
        {/* Personal Information */}
        <SectionHeader title={t("signUpForm.sections.personal_info")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label={t("signUpForm.form.first_name")}
            icon={<User className="w-5 h-5 text-secondary" />}
            name="name"
            placeholder={t("signUpForm.placeholders.first_name")}
            formik={formik}
            ariaRequired="true"
          />
          <InputField
            label={t("signUpForm.form.last_name")}
            icon={<User className="w-5 h-5 text-secondary" />}
            name="lastName"
            placeholder={t("signUpForm.placeholders.last_name")}
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
          <InputField
            label={t("signUpForm.form.identity")}
            icon={<User className="w-5 h-5 text-secondary" />}
            name="identity"
            placeholder={t("signUpForm.placeholders.identity")}
            formik={formik}
            ariaRequired="true"
          />
          <InputField
            label={t("signUpForm.form.date_of_birth")}
            icon={<Calendar className="w-5 h-5 text-secondary" />}
            name="dateOfBirth"
            type="date"
            placeholder={t("signUpForm.placeholders.date_of_birth")}
            formik={formik}
            ariaRequired="true"
          />
          <div className="space-y-2 animate-slideIn">
            <label className="block text-sm font-medium text-text">
              {t("signUpForm.form.gender")} <span aria-hidden="true">*</span>
            </label>
            <div className="flex space-x-4">
              {["Male", "Female", "Other"].map((gender) => (
                <label
                  key={gender}
                  className="flex items-center space-x-2 group"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={formik.values.gender === gender}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-4 w-4 text-primary focus:ring-primary border-secondary/50 transition-colors duration-300"
                    aria-label={t(`signUpForm.options.${gender.toLowerCase()}`)}
                  />
                  <span className="text-secondary group-hover:text-text transition-colors duration-300">
                    {t(`signUpForm.options.${gender.toLowerCase()}`)}
                  </span>
                </label>
              ))}
            </div>
            {formik.touched.gender && formik.errors.gender && (
              <p className="text-sm text-red-500 animate-fadeIn">
                {formik.errors.gender}
              </p>
            )}
          </div>
          <div className="col-span-1 sm:col-span-2 animate-slideIn">
            <label className="block text-sm font-medium text-text">
              {t("signUpForm.form.phone")} <span aria-hidden="true">*</span>
            </label>
            <PhoneInput
              country={"auto"}
              enableSearch
              searchPlaceholder={t("signUpForm.placeholders.search_country")}
              containerClass="mt-2 w-full"
              inputClass="w-full h-12 pl-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300"
              buttonClass="bg-bg/50 hover:bg-bg border-r border-border-color rounded-l-lg"
              searchClass="w-full border border-border-color rounded-lg px-3 py-2 text-text bg-bg/80"
              placeholder={t("signUpForm.placeholders.enter_phone")}
              value={formik.values.phone}
              onChange={(phone) => formik.setFieldValue("phone", phone)}
              onBlur={() => formik.setFieldTouched("phone", true)}
              inputProps={{
                "aria-required": "true",
                "aria-invalid": formik.touched.phone && !!formik.errors.phone,
                "aria-describedby":
                  formik.touched.phone && formik.errors.phone
                    ? "phone-error"
                    : undefined,
              }}
            />
            {formik.touched.phone && formik.errors.phone && (
              <p
                id="phone-error"
                className="text-sm text-red-500 mt-1 animate-fadeIn"
              >
                {formik.errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <SectionHeader title={t("signUpForm.sections.address")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label={t("signUpForm.form.street")}
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            name="address.street"
            placeholder={t("signUpForm.placeholders.street")}
            formik={formik}
            ariaRequired="true"
          />
          <InputField
            label={t("signUpForm.form.city")}
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            name="address.city"
            placeholder={t("signUpForm.placeholders.city")}
            formik={formik}
            ariaRequired="true"
          />
          <InputField
            label={t("signUpForm.form.country")}
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            name="address.country"
            placeholder={t("signUpForm.placeholders.country")}
            formik={formik}
            ariaRequired="true"
          />
          <InputField
            label={t("signUpForm.form.postal_code")}
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            name="address.postalCode"
            placeholder={t("signUpForm.placeholders.postal_code")}
            formik={formik}
            ariaRequired="true"
          />
        </div>

        {/* Bank Details */}
        <SectionHeader title={t("signUpForm.sections.bank_details")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label={t("signUpForm.form.account_number")}
            icon={<User className="w-5 h-5 text-secondary" />}
            name="bankDetails.accountNumber"
            placeholder={t("signUpForm.placeholders.account_number")}
            formik={formik}
            ariaRequired="true"
          />
          <InputField
            label={t("signUpForm.form.bank_number")}
            icon={<User className="w-5 h-5 text-secondary" />}
            name="bankDetails.bankNumber"
            placeholder={t("signUpForm.placeholders.bank_number")}
            formik={formik}
            ariaRequired="true"
          />
          <InputField
            label={t("signUpForm.form.branch_code")}
            icon={<User className="w-5 h-5 text-secondary" />}
            name="bankDetails.branchCode"
            placeholder={t("signUpForm.placeholders.branch_code")}
            formik={formik}
            ariaRequired="true"
          />
        </div>

        {/* Employment Details */}
        {authUser && (
          <>
            <SectionHeader
              title={t("signUpForm.sections.employment_details")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="animate-slideIn">
                <label className="block text-sm font-medium text-text">
                  {t("signUpForm.form.department")}
                </label>
                <div className="flex items-center space-x-3 mt-2">
                  <select
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full h-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300"
                    aria-label={t("signUpForm.form.department")}
                  >
                    <option value="">
                      {t("signUpForm.placeholders.department_select")}
                    </option>
                    {isLoadingDepts ? (
                      <option disabled>{t("loading")}</option>
                    ) : (
                      departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddDeptModalOpen(true)}
                    className="p-2 bg-primary text-button-text rounded-lg hover:bg-accent focus:ring-2 focus:ring-primary transition-all duration-300 transform hover:scale-110"
                    aria-label={t("signUpForm.buttons.add_department")}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formik.touched.department && formik.errors.department && (
                  <p className="text-sm text-red-500 mt-1 animate-fadeIn">
                    {formik.errors.department}
                  </p>
                )}
              </div>
              <InputField
                label={t("signUpForm.form.role")}
                icon={<User className="w-5 h-5 text-secondary" />}
                name="role"
                placeholder={t("signUpForm.placeholders.role")}
                formik={formik}
              />
            </div>
          </>
        )}

        {/* Payment Details */}
        <SectionHeader title={t("signUpForm.sections.payment_details")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="animate-slideIn">
            <label className="block text-sm font-medium text-text">
              {t("signUpForm.form.payment_type")}{" "}
              <span aria-hidden="true">*</span>
            </label>
            <select
              name="paymentType"
              value={formik.values.paymentType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-12 mt-2 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300"
              aria-required="true"
              aria-label={t("signUpForm.form.payment_type")}
            >
              <option value="Global">{t("signUpForm.options.global")}</option>
              <option value="Hourly">{t("signUpForm.options.hourly")}</option>
              <option value="Commission-Based">
                {t("signUpForm.options.commission_based")}
              </option>
            </select>
            {formik.touched.paymentType && formik.errors.paymentType && (
              <p className="text-sm text-red-500 mt-1 animate-fadeIn">
                {formik.errors.paymentType}
              </p>
            )}
          </div>
          {formik.values.paymentType === "Hourly" && (
            <InputField
              label={t("signUpForm.form.hourly_salary")}
              icon={<User className="w-5 h-5 text-secondary" />}
              name="hourlySalary"
              type="number"
              placeholder={t("signUpForm.placeholders.hourly_salary")}
              formik={formik}
              ariaRequired="true"
              min="0"
              step="0.01"
            />
          )}
          {formik.values.paymentType === "Global" && (
            <>
              <InputField
                label={t("signUpForm.form.global_salary")}
                icon={<User className="w-5 h-5 text-secondary" />}
                name="globalSalary"
                type="number"
                placeholder={t("signUpForm.placeholders.global_salary")}
                formik={formik}
                ariaRequired="true"
                min="0"
                step="0.01"
              />
              <InputField
                label={t("signUpForm.form.expected_hours")}
                icon={<User className="w-5 h-5 text-secondary" />}
                name="expectedHours"
                type="number"
                placeholder={t("signUpForm.placeholders.expected_hours")}
                formik={formik}
                ariaRequired="true"
                min="0"
                step="0.1"
              />
            </>
          )}
        </div>

        {/* Profile Image */}
        <SectionHeader title={t("signUpForm.sections.profile_image")} />
        <div className="animate-slideIn">
          <label className="block text-sm font-medium text-text">
            {t("signUpForm.form.profile_image")} ({t("optional")})
          </label>
          <div className="flex items-center gap-4 mt-2">
            <button
              type="button"
              className="p-3 bg-primary text-button-text rounded-lg hover:bg-accent focus:ring-2 focus:ring-primary transition-all duration-300 transform hover:scale-110"
              onClick={() => document.getElementById("fileInput").click()}
              aria-label={t("signUpForm.buttons.upload_image")}
            >
              <Send className="w-5 h-5" />
            </button>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImageFile(e.target.files[0])}
              className="hidden"
            />
            <input
              type="text"
              placeholder={t("signUpForm.placeholders.upload_image_or_url")}
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              className="flex-1 h-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300"
              aria-label={t("signUpForm.form.profile_image_url")}
            />
          </div>
          {(profileImageFile || profileImageUrl) && (
            <div className="relative inline-block mt-4 animate-fadeIn">
              <img
                src={
                  profileImageFile
                    ? URL.createObjectURL(profileImageFile)
                    : profileImageUrl
                }
                alt={t("signUpForm.form.image_preview")}
                className="w-16 h-16 rounded-full object-cover border-2 border-button-text shadow-md transform hover:scale-110 transition-transform duration-300"
              />
              <button
                type="button"
                onClick={removeProfileImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 focus:ring-2 focus:ring-red-500 transition-all duration-300"
                aria-label={t("signUpForm.buttons.remove_image")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
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

      {/* Add Department Modal */}
      {isAddDeptModalOpen && (
        <AddDepartmentModal
          onClose={() => setIsAddDeptModalOpen(false)}
          onSuccess={() => {
            setIsAddDeptModalOpen(false);
            refetchDepartments();
            toast.success(t("signUpForm.messages.department_added"), {
              position: "top-center",
            });
          }}
        />
      )}
    </>
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
  min,
  step,
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
        value={getNestedValue(formik.values, name)}
        min={min}
        step={step}
        className={`w-full h-12 border border-border-color rounded-lg text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary bg-bg/50 transition-all duration-300 ${
          icon ? "pl-12" : "pl-4"
        } ${
          getNestedError(formik.touched, name) &&
          getNestedError(formik.errors, name)
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : ""
        }`}
        aria-required={ariaRequired}
        aria-invalid={
          getNestedError(formik.touched, name) &&
          !!getNestedError(formik.errors, name)
        }
        aria-describedby={
          getNestedError(formik.touched, name) &&
          getNestedError(formik.errors, name)
            ? `${name.replace(".", "-")}-error`
            : undefined
        }
      />
    </div>
    {getNestedError(formik.touched, name) &&
      getNestedError(formik.errors, name) && (
        <p
          id={`${name.replace(".", "-")}-error`}
          className="text-sm text-red-500 mt-1 animate-fadeIn"
        >
          {getNestedError(formik.errors, name)}
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

export default SignUpForm;
