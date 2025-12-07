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
      console.log("Creating company with data:", data);
      const res = await axiosInstance.post("/company/create", data, {
        withCredentials: true,
      });
      console.log("Company creation response:", res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Company created successfully:", data);
      toast.success(t("company.success_message"));
      // Navigate to pricing plans after short delay to ensure cookie is set
      setTimeout(() => {
        navigate("/pricing-plans");
      }, 500);
    },
    onError: (error) => {
      console.error("Error creating company:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message ||
        t("company.error_message");
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
    <div className="space-y-8">
      {/* Step Indicators */}
      <div className="relative flex justify-between mb-10">
        {steps.map((s, index) => (
          <div key={index} className="flex flex-col items-center z-10">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 transform shadow-lg"
              style={{
                background: index + 1 <= step 
                  ? `linear-gradient(135deg, var(--color-primary), var(--color-secondary))` 
                  : 'var(--border-color)',
                color: index + 1 <= step ? 'var(--button-text)' : 'var(--text-color)',
                transform: index + 1 <= step ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {index + 1}
            </div>
            <span 
              className="mt-3 text-sm font-medium"
              style={{ color: 'var(--text-color)' }}
            >
              {s.title}
            </span>
          </div>
        ))}
        <div 
          className="absolute top-6 left-0 right-0 h-1 z-0 rounded-full"
          style={{ backgroundColor: 'var(--border-color)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-in-out"
            style={{ 
              width: `${((step - 1) / (steps.length - 1)) * 100}%`,
              background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`
            }}
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
              <div className="flex flex-col gap-1">
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-color)' }}
                >
                  {t("company.industry")}
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    border: '2px solid var(--border-color)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
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
        <div className="flex justify-between mt-10 gap-4">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="w-full sm:w-auto px-8 py-3 font-semibold rounded-xl shadow-lg focus:outline-none transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundColor: 'var(--border-color)',
                color: 'var(--text-color)',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
            >
              ← {t("company.previous")}
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto ml-auto px-8 py-3 font-semibold rounded-xl shadow-lg focus:outline-none transition-all duration-300 transform hover:scale-105"
              style={{
                background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                color: 'var(--button-text)'
              }}
            >
              {t("company.next")} →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full sm:w-auto ml-auto px-8 py-3 font-semibold rounded-xl shadow-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(to right, var(--color-primary), var(--color-accent))`,
                color: 'var(--button-text)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader className="size-5 animate-spin" />
                  <span>{t("company.creating")}</span>
                </>
              ) : (
                <>
                  <span>{t("company.create_button")}</span>
                  <span>✓</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
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
  <div className="flex flex-col gap-1 group">
    <label 
      className="block text-sm font-semibold mb-2"
      style={{ color: 'var(--text-color)' }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full p-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        border: '2px solid var(--border-color)',
      }}
      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
    />
  </div>
);

export default CreateCompanyForm;
