import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";

const CreateCompanyForm = () => {
  const { t } = useTranslation();

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

  const navigate = useNavigate();

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
      // Extract the error message from the backend response
      const errorMessage =
        error.response?.data?.error || t("company.error_message");
      // Display the specific error message in a toast
      toast.error(errorMessage);
    },
  });

  const handleCreateCompany = (e) => {
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

  const handleAddressChange = (field, value) => {
    setAddress((prevAddress) => ({
      ...prevAddress,
      [field]: value,
    }));
  };

  return (
    <form
      onSubmit={handleCreateCompany}
      className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 px-4 py-6 bg-bg animate-fadeIn"
    >
      {/* Input Fields */}
      {[
        {
          label: t("company.name"),
          value: name,
          setValue: setName,
          type: "text",
        },
        {
          label: t("company.email"),
          value: email,
          setValue: setEmail,
          type: "email",
        },
        {
          label: t("company.phone"),
          value: phone,
          setValue: setPhone,
          type: "tel",
        },
        {
          label: t("company.website"),
          value: website,
          setValue: setWebsite,
          type: "text",
        },
        {
          label: t("company.logo"),
          value: logo,
          setValue: setLogo,
          type: "text",
        },
        {
          label: t("company.tax_id"),
          value: taxId,
          setValue: setTaxId,
          type: "text",
        },
        {
          label: t("company.street"),
          value: address.street,
          setValue: (value) => handleAddressChange("street", value),
          type: "text",
        },
        {
          label: t("company.city"),
          value: address.city,
          setValue: (value) => handleAddressChange("city", value),
          type: "text",
        },
        {
          label: t("company.state"),
          value: address.state,
          setValue: (value) => handleAddressChange("state", value),
          type: "text",
        },
        {
          label: t("company.postal_code"),
          value: address.postalCode,
          setValue: (value) => handleAddressChange("postalCode", value),
          type: "text",
        },
        {
          label: t("company.country"),
          value: address.country,
          setValue: (value) => handleAddressChange("country", value),
          type: "text",
        },
      ].map((field, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-1 animate-fadeIn"
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          <label className="text-sm font-medium text-text">{field.label}</label>
          <div className="flex items-center gap-2 border border-border-color rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-primary transition-all duration-200">
            <input
              type={field.type}
              name={field.label.toLowerCase().replace(" ", "")}
              placeholder={field.label}
              value={field.value}
              onChange={(e) => field.setValue(e.target.value)}
              className="w-full bg-transparent outline-none text-text placeholder-secondary"
            />
          </div>
        </div>
      ))}

      {/* Industry Dropdown */}
      <div
        className="flex flex-col gap-1 animate-fadeIn"
        style={{ animationDelay: `${11 * 0.05}s` }}
      >
        <label className="text-sm font-medium text-text">
          {t("company.industry")}
        </label>
        <div className="flex items-center gap-2 border border-border-color rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-primary transition-all duration-200">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full bg-transparent outline-none text-text placeholder-secondary"
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
              "Energy",
              "Construction",
              "Agriculture",
              "Telecommunications",
              "Aerospace",
              "Nonprofit",
              "Consulting",
              "Government",
              "Fashion",
              "Food & Beverage",
              "Sports",
              "E-commerce",
              "Media",
              "Legal Services",
              "Software Development",
              "Hardware Development",
              "Biotechnology",
              "Pharmaceuticals",
              "Automotive",
              "Logistics",
              "Gaming",
              "Public Relations",
              "Event Management",
              "Advertising",
              "Tourism",
              "Mining",
              "Chemical Industry",
              "Art & Design",
              "Publishing",
              "Music & Performing Arts",
              "Environmental Services",
              "Security Services",
              "Research & Development",
              "Wholesale",
              "Human Resources",
              "Insurance",
              "Digital Marketing",
              "Data Analytics",
              "Waste Management",
              "Marine Industry",
              "Electronics",
              "Medical Devices",
              "Architecture",
              "Fitness & Wellness",
              "Agritech",
              "Fintech",
              "Edtech",
              "Healthtech",
              "Proptech",
              "SaaS",
              "Cybersecurity",
              "Nanotechnology",
              "Blockchain",
              "Artificial Intelligence",
              "Other",
            ].map((option) => (
              <option key={option} value={option}>
                {t(
                  `company.industries.${option.toLowerCase().replace(" ", "_")}`
                )}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div
        className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center mt-4 animate-fadeIn"
        style={{ animationDelay: `${12 * 0.05}s` }}
      >
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto bg-button-bg text-button-text px-6 py-2 rounded-md hover:bg-secondary focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:bg-gray-400 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader className="size-5 animate-spin" />
          ) : (
            t("company.create_button")
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateCompanyForm;
