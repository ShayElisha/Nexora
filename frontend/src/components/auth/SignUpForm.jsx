import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { User, Mail, Lock, Eye, EyeOff, MapPin, Send, X } from "lucide-react";

const SignUpForm = () => {
  const queryClient = useQueryClient();

  // Fetch authenticated user data
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });

  const authUser = authData?.user;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Password must contain an uppercase letter")
      .matches(/[0-9]/, "Password must contain a number")
      .matches(
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        "Password must contain a special character"
      )
      .required("Password is required"),
    phone: Yup.string().required("Phone number is required"),
    gender: Yup.string()
      .oneOf(["Male", "Female", "Other"], "Gender is required")
      .required("Gender is required"), // Move here
    address: Yup.object({
      street: Yup.string().required("Street is required"),
      city: Yup.string().required("City is required"),
      country: Yup.string().required("Country is required"),
      postalCode: Yup.string().required("Postal code is required"),
    }),
  });

  // Formik Logic
  const formik = useFormik({
    initialValues: {
      name: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      gender: "", // Ensure this matches the schema
      identity: "",
      role: "",
      profileImage: "",
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

      // Append form data
      formData.append("name", values.name);
      formData.append("lastName", values.lastName);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("phone", values.phone);
      formData.append("gender", values.gender); // Append with the correct name
      formData.append("identity", values.identity || "");
      formData.append("role", values.role || "");

      // Append address fields
      formData.append("address[street]", values.address.street);
      formData.append("address[city]", values.address.city);
      formData.append("address[country]", values.address.country);
      formData.append("address[postalCode]", values.address.postalCode);

      // Append profile image or URL
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
          toast.success("Signup successful! You can now log in.");
          navigate("/login");
        } else {
          toast.error(response.data.message || "Signup failed");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    },
  });

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImageUrl("");
  };
  useEffect(() => {
    if (!authUser) {
      formik.setFieldValue("role", "Admin");
    }
  }, [authUser]);
  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      {/* Row 1: First Name & Last Name */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <InputField
          label="First Name"
          icon={<User />}
          name="name"
          placeholder="Enter your first name"
          formik={formik}
        />
        <InputField
          label="Last Name"
          icon={<User />}
          name="lastName"
          placeholder="Enter your last name"
          formik={formik}
        />
      </div>

      {/* Row 2: Email & Password */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <InputField
          label="Email"
          icon={<Mail />}
          name="email"
          placeholder="Enter your email"
          formik={formik}
        />
        <PasswordField
          label="Password"
          icon={<Lock />}
          name="password"
          placeholder="Enter your password"
          formik={formik}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <InputField
          label="Identity"
          icon={<User />} // אם יש לך אייקון אחר שמתאים, תוכל להחליף את זה
          name="identity"
          placeholder="Enter your identity"
          formik={formik}
        />
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Gender</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender" // Ensure this matches the `initialValues` and backend
                value="Male"
                checked={formik.values.gender === "Male"}
                onChange={formik.handleChange}
                className="form-radio"
              />
              <span className="ml-2">Male</span>
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
              <span className="ml-2">Female</span>
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
              <span className="ml-2">Other</span>
            </label>
          </div>
          {formik.touched.gender && formik.errors.gender && (
            <p className="text-sm text-red-500 mt-1">{formik.errors.gender}</p>
          )}
        </div>
      </div>

      {/* Row 3: Phone */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <PhoneInput
          country={"us"}
          enableSearch
          searchPlaceholder="Search..."
          containerClass="react-tel-input w-full"
          inputClass="!w-full !h-10 !pl-10 !border-gray-300 !rounded-md focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500 focus:!bg-blue-50 text-gray-800"
          buttonClass="!bg-gray-100 hover:!bg-gray-200 !border !border-gray-300"
          searchClass="!w-full !border !border-gray-300 !rounded-md focus:!ring-1 focus:!ring-blue-500 focus:!border-blue-500 focus:!bg-blue-50 px-2 py-1"
          placeholder="Enter phone number"
          value={formik.values.phone}
          onChange={(phone) => formik.setFieldValue("phone", phone)}
        />
        {formik.touched.phone && formik.errors.phone && (
          <p className="text-sm text-red-500 mt-1">{formik.errors.phone}</p>
        )}
      </div>

      {/* Row 4: Address (Street & City) */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <InputField
          label="Street"
          icon={<MapPin />}
          name="address.street"
          placeholder="Enter your street"
          formik={formik}
        />
        <InputField
          label="City"
          icon={<MapPin />}
          name="address.city"
          placeholder="Enter your city"
          formik={formik}
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <MapPin />
            </div>
            <input
              type="text"
              name="role"
              placeholder="Enter your role"
              value={authUser ? formik.values.role : "Admin"} // אם יש משתמש מחובר, הערך מגיע מ-Formik
              readOnly={!authUser} // אם אין משתמש מחובר, השדה הופך ל-ReadOnly
              onChange={authUser ? formik.handleChange : undefined} // מאפשר שינוי רק אם יש משתמש מחובר
              className={`pl-10 w-full py-2 rounded-md border shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                authUser
                  ? "bg-white border-gray-300" // רקע רגיל למשתמש מחובר
                  : "bg-gray-100 border-gray-400 cursor-not-allowed" // רקע אפור ומצב לא נגיש
              }`}
            />
          </div>
          {formik.touched.role && formik.errors.role && (
            <p className="text-sm text-red-500 mt-1">{formik.errors.role}</p>
          )}
        </div>
      </div>

      {/* Row 5: Address (Country & Postal Code) */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <InputField
          label="Country"
          icon={<MapPin />}
          name="address.country"
          placeholder="Enter your country"
          formik={formik}
        />
        <InputField
          label="Postal Code"
          icon={<MapPin />}
          name="address.postalCode"
          placeholder="Enter your postal code"
          formik={formik}
        />
      </div>

      {/* Profile Image at the end */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Image
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
            placeholder="Upload image file Or enter image URL"
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
            onBlur={formik.handleBlur}
            className="w-full py-2 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-blue-50"
          />
        </div>

        {/* Image Preview with X to remove */}
        {(profileImageFile || profileImageUrl) && (
          <div className="relative inline-block mt-4">
            <img
              src={
                profileImageFile
                  ? URL.createObjectURL(profileImageFile)
                  : profileImageUrl
              }
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={removeProfileImage}
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
        {loading ? "Signing Up..." : "Sign Up"}
      </button>
    </form>
  );
};

// InputField Component
const InputField = ({ label, icon, name, placeholder, formik }) => (
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.getFieldProps(name).value}
        className="pl-10 w-full py-2 rounded-md border border-gray-300 shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-blue-50"
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
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        onChange={formik.handleChange}
        value={formik.values[name]}
        className="pl-10 pr-10 w-full py-2 rounded-md border border-gray-300 shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-blue-50"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
