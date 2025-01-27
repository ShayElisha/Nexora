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
      toast.error(error.response.data.message || t("company.error_message"));
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
      className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 px-4 py-6"
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
          className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500"
        >
          <input
            type={field.type}
            name={field.label.toLowerCase().replace(" ", "")}
            placeholder={field.label}
            value={field.value}
            onChange={(e) => field.setValue(e.target.value)}
            className="w-full bg-transparent outline-none text-gray-700 placeholder-zinc-700"
          />
        </div>
      ))}

      {/* Industry Dropdown */}
      <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-zinc-700"
        >
          <option value="">{t("company.select_industry")}</option>
          <option value="Technology">
            {t("company.industries.technology")}
          </option>
          <option value="Retail">{t("company.industries.retail")}</option>
          <option value="Finance">{t("company.industries.finance")}</option>
          <option value="Healthcare">
            {t("company.industries.healthcare")}
          </option>
          <option value="Education">{t("company.industries.education")}</option>
          <option value="Real Estate">
            {t("company.industries.real_estate")}
          </option>
          <option value="Manufacturing">
            {t("company.industries.manufacturing")}
          </option>
          <option value="Other">{t("company.industries.other")}</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto bg-zinc-800 text-white px-6 py-2 rounded-md hover:bg-zinc-900 transition duration-300 ease-in-out"
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
