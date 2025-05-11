import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";

const CreateCompanyForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Form state
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [industry, setIndustry] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  // Particle animation state
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const createParticle = () => ({
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 5 + 2,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.5 + 0.3,
    });
    setParticles(Array.from({ length: 30 }, createParticle));
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: (p.x + p.speedX + window.innerWidth) % window.innerWidth,
          y: (p.y + p.speedY + window.innerHeight) % window.innerHeight,
        }))
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Mutation for creating company
  const { mutate: createCompanyMutation, isLoading } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/company/create", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("company.success_message"));
      navigate("/pricing-plans");
    },
    onError: (error) => {
      console.log("Error details:", error.response?.data);
      const errorMessage =
        error.response?.data?.error || t("company.error_message");
      toast.error(errorMessage);
    },
  });

  const handleAddressChange = (field, value) => {
    setAddress((prevAddress) => ({
      ...prevAddress,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCompanyMutation({
      name,
      email,
      phone,
      website,
      logo,
      address,
      industry,
      taxId,
    });
  };

  const steps = [
    { title: t("company.steps.basic_info") },
    { title: t("company.steps.address") },
    { title: t("company.steps.additional_details") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Particle Background */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-blue-200/20 animate-pulse"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              transition: "all 0.05s linear",
            }}
          />
        ))}
      </div>

      {/* Form Container */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 space-y-8 transform transition-all duration-500 hover:shadow-3xl">
        {/* Step Indicators */}
        <div className="relative flex justify-between mb-10">
          {steps.map((s, index) => (
            <div key={index} className="flex flex-col items-center z-10">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 transform ${
                  index + 1 <= step
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 scale-110"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span className="mt-3 text-sm font-medium text-gray-700">
                {s.title}
              </span>
            </div>
          ))}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 z-0">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div
              key="step1"
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn"
            >
              {[
                {
                  label: t("company.name"),
                  value: name,
                  setValue: setName,
                  type: "text",
                  placeholder: t("company.placeholders.name"),
                },
                {
                  label: t("company.email"),
                  value: email,
                  setValue: setEmail,
                  type: "email",
                  placeholder: t("company.placeholders.email"),
                },
                {
                  label: t("company.phone"),
                  value: phone,
                  setValue: setPhone,
                  type: "tel",
                  placeholder: t("company.placeholders.phone"),
                },
                {
                  label: t("company.website"),
                  value: website,
                  setValue: setWebsite,
                  type: "text",
                  placeholder: t("company.placeholders.website"),
                },
                {
                  label: t("company.logo"),
                  value: logo,
                  setValue: setLogo,
                  type: "text",
                  placeholder: t("company.placeholders.logo"),
                },
              ].map((field, idx) => (
                <InputField
                  key={idx}
                  label={field.label}
                  value={field.value}
                  setValue={field.setValue}
                  type={field.type}
                  placeholder={field.placeholder}
                  animationDelay={idx * 0.1}
                />
              ))}
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div
              key="step2"
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn"
            >
              {[
                {
                  label: t("company.street"),
                  value: address.street,
                  setValue: (val) => handleAddressChange("street", val),
                  type: "text",
                  placeholder: t("company.placeholders.street"),
                },
                {
                  label: t("company.city"),
                  value: address.city,
                  setValue: (val) => handleAddressChange("city", val),
                  type: "text",
                  placeholder: t("company.placeholders.city"),
                },
                {
                  label: t("company.state"),
                  value: address.state,
                  setValue: (val) => handleAddressChange("state", val),
                  type: "text",
                  placeholder: t("company.placeholders.state"),
                },
                {
                  label: t("company.postal_code"),
                  value: address.postalCode,
                  setValue: (val) => handleAddressChange("postalCode", val),
                  type: "text",
                  placeholder: t("company.placeholders.postal_code"),
                },
                {
                  label: t("company.country"),
                  value: address.country,
                  setValue: (val) => handleAddressChange("country", val),
                  type: "text",
                  placeholder: t("company.placeholders.country"),
                },
              ].map((field, idx) => (
                <InputField
                  key={idx}
                  label={field.label}
                  value={field.value}
                  setValue={field.setValue}
                  type={field.type}
                  placeholder={field.placeholder}
                  animationDelay={idx * 0.1}
                />
              ))}
            </div>
          )}

          {/* Step 3: Additional Details */}
          {step === 3 && (
            <div key="step3" className="grid grid-cols-1 gap-6 animate-fadeIn">
              <div
                className="flex flex-col gap-1"
                style={{ animationDelay: "0.1s" }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("company.industry")}
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <option value="">{t("company.select_industry")}</option>
                  {[
                    "Technology",
                    "Retail",
                    "Finance",
                    "Healthcare",
                    "Education",
                    "Real Estate",
                    "Manufacturing",
                    "Hospitality",
                    "Transportation",
                    "Entertainment",
                  ].map((option) => (
                    <option key={option} value={option}>
                      {t(
                        `company.industries.${option
                          .toLowerCase()
                          .replace(" ", "_")}`
                      )}
                    </option>
                  ))}
                </select>
              </div>
              <InputField
                label={t("company.tax_id")}
                value={taxId}
                setValue={setTaxId}
                type="text"
                placeholder={t("company.placeholders.tax_id")}
                animationDelay={0.2}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full shadow-lg hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-300 transform hover:scale-105"
              >
                {t("company.previous")}
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto ml-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:scale-105"
              >
                {t("company.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto ml-auto px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-full shadow-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader className="size-5 animate-spin" />
                ) : (
                  t("company.create_button")
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
      `}</style>
    </div>
  );
};

// InputField Component
const InputField = ({
  label,
  value,
  setValue,
  type,
  placeholder,
  animationDelay,
}) => (
  <div
    className="flex flex-col gap-1 animate-fadeIn"
    style={{ animationDelay: `${animationDelay}s` }}
  >
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
    />
  </div>
);

export default CreateCompanyForm;
