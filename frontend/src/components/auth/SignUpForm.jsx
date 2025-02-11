// SignUpForm.jsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AddDepartmentModal from "../../pages/AdminPanel/departments/Add_Department.jsx"; // רכיב מודאל ליצירת מחלקה

const SignUpForm = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation(); // שימוש במילון 'signUpForm'
  const navigate = useNavigate();

  // Fetch authenticated user data
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // Fetch departments
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
    // enabled: !!authUser,
  });

  // State for opening/closing the AddDepartmentModal
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);

  // Validation Schema
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
    department: Yup.string().notRequired(),
    role: Yup.string().notRequired(),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      gender: "",
      identity: "",
      department: "",
      role: "",
      address: {
        street: "",
        city: "",
        country: "",
        postalCode: "",
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const formData = new FormData();

      // Basic fields
      formData.append("name", values.name);
      formData.append("lastName", values.lastName);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("phone", values.phone);
      formData.append("gender", values.gender);
      formData.append("identity", values.identity || "");

      // Only if user is logged in (authUser), set department & role
      if (authUser) {
        formData.append("department", values.department || "");
        formData.append("role", values.role || "");
      }

      // Address fields
      formData.append("address[street]", values.address.street);
      formData.append("address[city]", values.address.city);
      formData.append("address[country]", values.address.country);
      formData.append("address[postalCode]", values.address.postalCode);

      // Profile Image
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      } else if (profileImageUrl) {
        formData.append("profileImageUrl", profileImageUrl);
      }

      try {
        const response = await axiosInstance.post("/auth/signup", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          toast.success(t("messages.signup_success"));
          navigate("/login");
        } else {
          toast.error(response.data.message || t("messages.signup_failed"));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || t("errors.general_error"));
      } finally {
        setLoading(false);
      }
    },
  });

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImageUrl("");
  };

  return (
    <>
      {/* טופס עם טקסט שחור */}
      <form onSubmit={formik.handleSubmit} className="space-y-6 text-black">
        {/* Row 1: First Name & Last Name */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <InputField
            label={t("signUpForm.form.first_name")}
            icon={<User />}
            name="name"
            placeholder={t("signUpForm.placeholders.first_name")}
            formik={formik}
          />
          <InputField
            label={t("signUpForm.form.last_name")}
            icon={<User />}
            name="lastName"
            placeholder={t("signUpForm.placeholders.last_name")}
            formik={formik}
          />
        </div>

        {/* Row 2: Email & Password */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <InputField
            label={t("signUpForm.form.email")}
            icon={<Mail />}
            name="email"
            placeholder={t("signUpForm.placeholders.email")}
            formik={formik}
          />
          <PasswordField
            label={t("signUpForm.form.password")}
            icon={<Lock />}
            name="password"
            placeholder={t("signUpForm.placeholders.password")}
            formik={formik}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>

        {/* Row 3: Identity & Gender */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <InputField
            label={t("signUpForm.form.identity")}
            icon={<User />}
            name="identity"
            placeholder={t("signUpForm.placeholders.identity")}
            formik={formik}
          />
          {/* Gender */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">
              {t("signUpForm.form.gender")}
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={formik.values.gender === "Male"}
                  onChange={formik.handleChange}
                  className="form-radio"
                />
                <span className="ml-2">{t("signUpForm.options.male")}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={formik.values.gender === "Female"}
                  onChange={formik.handleChange}
                  className="form-radio"
                />
                <span className="ml-2">{t("signUpForm.options.female")}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Other"
                  checked={formik.values.gender === "Other"}
                  onChange={formik.handleChange}
                  className="form-radio"
                />
                <span className="ml-2">{t("signUpForm.options.other")}</span>
              </label>
            </div>
            {formik.touched.gender && formik.errors.gender && (
              <p className="text-sm text-red-500 mt-1">
                {formik.errors.gender}
              </p>
            )}
          </div>
        </div>

        {/* Row 4: Phone */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            {t("signUpForm.form.phone")}
          </label>
          <PhoneInput
            country={"us"}
            enableSearch
            searchPlaceholder={t("signUpForm.placeholders.search_country")}
            containerClass="react-tel-input w-full"
            inputClass="!w-full !h-10 !pl-10 !border-gray-300 !rounded-md"
            buttonClass="!bg-gray-100 hover:!bg-gray-200 !border !border-gray-300"
            searchClass="!w-full !border !border-gray-300 !rounded-md px-2 py-1"
            placeholder={t("signUpForm.placeholders.enter_phone")}
            value={formik.values.phone}
            onChange={(phone) => formik.setFieldValue("phone", phone)}
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="text-sm text-red-500 mt-1">{formik.errors.phone}</p>
          )}
        </div>

        {/* Row 5: Address (Street & City) */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <InputField
            label={t("signUpForm.form.street")}
            icon={<MapPin />}
            name="address.street"
            placeholder={t("signUpForm.placeholders.street")}
            formik={formik}
          />
          <InputField
            label={t("signUpForm.form.city")}
            icon={<MapPin />}
            name="address.city"
            placeholder={t("signUpForm.placeholders.city")}
            formik={formik}
          />
        </div>

        {/* Row 6: מחלקה & תפקיד (department & role) - רק אם יש authUser */}
        {authUser && (
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {t("signUpForm.form.department") || "בחר מחלקה"}
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <select
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    className="w-full py-2 pl-3 pr-8 rounded-md border border-gray-300"
                  >
                    <option value="">
                      {t("signUpForm.placeholders.department_select") ||
                        "בחר מחלקה..."}
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
                </div>

                {/* כפתור "+" לפתיחת מודאל */}
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(true)}
                  className="inline-flex items-center p-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formik.touched.department && formik.errors.department && (
                <p className="text-sm text-red-500 mt-1">
                  {formik.errors.department}
                </p>
              )}
            </div>
            <InputField
              label={t("signUpForm.form.role") || "Role"}
              icon={<MapPin />}
              name="role"
              placeholder={
                t("signUpForm.placeholders.role") || "Enter your role"
              }
              formik={formik}
            />
          </div>
        )}

        {/* Row 7: Address (Country & Postal Code) */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <InputField
            label={t("signUpForm.form.country")}
            icon={<MapPin />}
            name="address.country"
            placeholder={t("signUpForm.placeholders.country")}
            formik={formik}
          />
          <InputField
            label={t("signUpForm.form.postal_code")}
            icon={<MapPin />}
            name="address.postalCode"
            placeholder={t("signUpForm.placeholders.postal_code")}
            formik={formik}
          />
        </div>

        {/* Profile Image */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            {t("signUpForm.form.profile_image")}
          </label>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              className="p-2 bg-blue-100 rounded-md hover:bg-gray-300"
              onClick={() => document.getElementById("fileInput").click()}
            >
              <Send className="text-gray-600" />
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
              className="w-full py-2 px-3 border border-gray-300 rounded-md"
            />
          </div>
          {(profileImageFile || profileImageUrl) && (
            <div className="relative inline-block mt-4">
              <img
                src={
                  profileImageFile
                    ? URL.createObjectURL(profileImageFile)
                    : profileImageUrl
                }
                alt={t("signUpForm.form.image_preview")}
                className="w-16 h-16 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setProfileImageFile(null);
                  setProfileImageUrl("");
                }}
                className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-gray-700 rounded-full p-1 shadow"
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
          className="w-full py-2 mt-6 bg-blue-600 text-white font-medium rounded-md shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        >
          {loading
            ? t("signUpForm.buttons.signing_up")
            : t("signUpForm.buttons.sign_up")}
        </button>
      </form>

      {/* מודאל להוספת מחלקה */}
      {isAddDeptModalOpen && (
        <AddDepartmentModal
          onClose={() => setIsAddDeptModalOpen(false)}
          onSuccess={() => {
            setIsAddDeptModalOpen(false);
            refetchDepartments();
          }}
        />
      )}
    </>
  );
};

// InputField Component
const InputField = ({ label, icon, name, placeholder, formik }) => (
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.getFieldProps(name).value}
        className="pl-10 w-full py-2 rounded-md border border-gray-300 shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    {formik.touched[name] && formik.errors[name] && (
      <p className="text-sm text-red-500 mt-1">{formik.errors[name]}</p>
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
}) => (
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        onChange={formik.handleChange}
        value={formik.values[name]}
        className="pl-10 pr-10 w-full py-2 rounded-md border border-gray-300 shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? <EyeOff /> : <Eye />}
      </button>
    </div>
    {formik.touched[name] && formik.errors[name] && (
      <p className="text-sm text-red-500 mt-1">{formik.errors[name]}</p>
    )}
  </div>
);

export default SignUpForm;
