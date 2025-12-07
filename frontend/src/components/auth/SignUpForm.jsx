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
import { motion } from "framer-motion";

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
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDescription, setNewDeptDescription] = useState("");

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

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      toast.error("נא להזין שם מחלקה");
      return;
    }
    try {
      await axiosInstance.post("/departments", {
        name: newDeptName,
        description: newDeptDescription,
        teamMembers: []
      });
      toast.success("המחלקה נוספה בהצלחה!");
      setNewDeptName("");
      setNewDeptDescription("");
      setIsAddDeptModalOpen(false);
      refetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || "שגיאה בהוספת מחלקה");
    }
  };

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-8 max-w-full mx-auto"
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

          <div className="space-y-3">
            <label 
              className="block text-sm font-semibold"
              style={{ color: 'var(--text-color)' }}
            >
              {t("signUpForm.form.gender")} <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <div className="flex gap-4">
              {["Male", "Female", "Other"].map((gender) => (
                <label
                  key={gender}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={formik.values.gender === gender}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-5 h-5 transition-all duration-300"
                    style={{
                      accentColor: 'var(--color-primary)'
                    }}
                    aria-label={t(`signUpForm.options.${gender.toLowerCase()}`)}
                  />
                  <span 
                    className="text-sm font-medium transition-all duration-300"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {t(`signUpForm.options.${gender.toLowerCase()}`)}
                  </span>
                </label>
              ))}
            </div>
            {formik.touched.gender && formik.errors.gender && (
              <p className="text-sm text-red-500">
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
              <div>
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-color)' }}
                >
                  {t("signUpForm.form.department")}
                </label>
                <div className="flex items-center gap-3">
                  <select
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="flex-1 h-12 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 px-4"
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      border: '2px solid var(--border-color)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => {
                      formik.handleBlur(e);
                      e.target.style.borderColor = 'var(--border-color)';
                    }}
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
                    className="p-3 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--button-text)'
                    }}
                    aria-label={t("signUpForm.buttons.add_department")}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formik.touched.department && formik.errors.department && (
                  <p className="text-sm text-red-500 mt-2">
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
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--text-color)' }}
            >
              {t("signUpForm.form.payment_type")}{" "}
              <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <select
              name="paymentType"
              value={formik.values.paymentType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-12 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 px-4"
              style={{
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
                border: '2px solid var(--border-color)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => {
                formik.handleBlur(e);
                e.target.style.borderColor = 'var(--border-color)';
              }}
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
              <p className="text-sm text-red-500 mt-2">
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
        <div>
          <label 
            className="block text-sm font-semibold mb-3"
            style={{ color: 'var(--text-color)' }}
          >
            {t("signUpForm.form.profile_image")} <span style={{ color: 'var(--color-secondary)', opacity: 0.7 }}>({t("optional")})</span>
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-4 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--button-text)'
              }}
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
              className="flex-1 h-12 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 px-4"
              style={{
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
                border: '2px solid var(--border-color)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              aria-label={t("signUpForm.form.profile_image_url")}
            />
          </div>
          {(profileImageFile || profileImageUrl) && (
            <div className="relative inline-block mt-6">
              <div
                className="relative w-24 h-24 rounded-full overflow-hidden shadow-xl"
                style={{
                  border: '4px solid var(--color-primary)'
                }}
              >
              <img
                src={
                  profileImageFile
                    ? URL.createObjectURL(profileImageFile)
                    : profileImageUrl
                }
                alt={t("signUpForm.form.image_preview")}
                  className="w-full h-full object-cover"
              />
              </div>
              <button
                type="button"
                onClick={removeProfileImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-300 shadow-lg transform hover:scale-110"
                aria-label={t("signUpForm.buttons.remove_image")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-8 font-bold rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            background: loading 
              ? 'var(--border-color)'
              : `linear-gradient(to right, var(--color-primary), var(--color-accent))`,
            color: 'var(--button-text)'
          }}
        >
          {loading ? (
            <>
              <span className="inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mr-3"
                style={{ borderColor: 'var(--button-text)' }}
              ></span>
              {t("signUpForm.buttons.signing")}
            </>
          ) : (
            <>
              <span>{t("signUpForm.buttons.sign_up")}</span>
              <span className="mr-2">✓</span>
            </>
          )}
        </button>
      </form>

      {/* Add Department Modal */}
      {isAddDeptModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setIsAddDeptModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-color)',
              border: '2px solid var(--border-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative top border */}
            <div
              className="h-2"
              style={{
                background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`
              }}
            />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 
                  className="text-2xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  ➕ הוספת מחלקה
                </h3>
                <button
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="p-2 rounded-full transition-all duration-300 hover:scale-110"
                  style={{
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--color-accent)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--border-color)';
                    e.target.style.color = 'var(--text-color)';
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-color)' }}
                  >
                    שם המחלקה <span style={{ color: 'var(--color-accent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="לדוגמה: פיתוח, שיווק, מכירות..."
                    className="w-full p-4 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      border: '2px solid var(--border-color)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-color)' }}
                  >
                    תיאור <span style={{ color: 'var(--color-secondary)', opacity: 0.7 }}>(אופציונלי)</span>
                  </label>
                  <textarea
                    value={newDeptDescription}
                    onChange={(e) => setNewDeptDescription(e.target.value)}
                    placeholder="תאר את המחלקה..."
                    rows={3}
                    className="w-full p-4 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      border: '2px solid var(--border-color)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddDeptModalOpen(false)}
                    className="flex-1 py-3 px-6 font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                    style={{
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-color)'
                    }}
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    className="flex-1 py-3 px-6 font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                      color: 'var(--button-text)'
                    }}
                  >
                    ✓ הוסף מחלקה
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
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
  <div className="group">
    <label 
      className="block text-sm font-semibold mb-2"
      style={{ color: 'var(--text-color)' }}
    >
      {label}
      {ariaRequired && <span style={{ color: 'var(--color-accent)' }}>*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
          style={{ color: 'var(--color-secondary)' }}
        >
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
        className={`w-full h-12 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          icon ? "pl-12 pr-4" : "px-4"
        }`}
        style={{
          backgroundColor: 'var(--bg-color)',
          color: 'var(--text-color)',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: getNestedError(formik.touched, name) && getNestedError(formik.errors, name)
            ? '#ef4444'
            : 'var(--border-color)'
        }}
        onFocus={(e) => {
          if (!getNestedError(formik.errors, name)) {
            e.target.style.borderColor = 'var(--color-primary)';
          }
        }}
        onBlur={(e) => {
          formik.handleBlur(e);
          if (!getNestedError(formik.errors, name)) {
            e.target.style.borderColor = 'var(--border-color)';
          }
        }}
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
          className="text-sm text-red-500 mt-2"
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
  <div className="group">
    <label 
      className="block text-sm font-semibold mb-2"
      style={{ color: 'var(--text-color)' }}
    >
      {label}
      {ariaRequired && <span style={{ color: 'var(--color-accent)' }}>*</span>}
    </label>
    <div className="relative">
      <div 
        className="absolute left-4 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--color-secondary)' }}
      >
        {icon}
      </div>
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
        className="w-full h-12 pl-12 pr-12 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: 'var(--bg-color)',
          color: 'var(--text-color)',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: formik.touched[name] && formik.errors[name]
            ? '#ef4444'
            : 'var(--border-color)'
        }}
        onFocus={(e) => {
          if (!formik.errors[name]) {
            e.target.style.borderColor = 'var(--color-primary)';
          }
        }}
        onBlur={(e) => {
          formik.handleBlur(e);
          if (!formik.errors[name]) {
            e.target.style.borderColor = 'var(--border-color)';
          }
        }}
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
        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 focus:outline-none"
        style={{ color: 'var(--color-secondary)' }}
        onMouseEnter={(e) => e.target.style.color = 'var(--color-accent)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--color-secondary)'}
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
        className="text-sm text-red-500 mt-2"
      >
        {formik.errors[name]}
      </p>
    )}
  </div>
);

// SectionHeader Component
const SectionHeader = ({ title }) => (
  <div className="relative pt-4 pb-2">
    <h3 
      className="text-2xl font-bold"
      style={{
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
    {title}
  </h3>
    <div 
      className="absolute -bottom-1 left-0 w-20 h-1 rounded-full"
      style={{
        background: `linear-gradient(to right, var(--color-primary), var(--color-accent))`
      }}
    />
  </div>
);

export default SignUpForm;
