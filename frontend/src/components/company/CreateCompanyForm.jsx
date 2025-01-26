import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";

const CreateCompanyForm = () => {
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
      toast.success("Company created successfully");
      navigate("/pricing-plans");
    },
    onError: (error) => {
      console.log("Error details:", error.response?.data);
      toast.error(error.response.data.message || "Something went wrong");
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
        { label: "Company Name", value: name, setValue: setName, type: "text" },
        {
          label: "Company Email",
          value: email,
          setValue: setEmail,
          type: "email",
        },
        {
          label: "Company Phone",
          value: phone,
          setValue: setPhone,
          type: "tel",
        },
        {
          label: "Company Website",
          value: website,
          setValue: setWebsite,
          type: "text",
        },
        { label: "Company Logo", value: logo, setValue: setLogo, type: "text" },
        {
          label: "Company Tax ID",
          value: taxId,
          setValue: setTaxId,
          type: "text",
        },
        {
          label: "Company Street",
          value: address.street,
          setValue: (value) => handleAddressChange("street", value),
          type: "text",
        },
        {
          label: "Company City",
          value: address.city,
          setValue: (value) => handleAddressChange("city", value),
          type: "text",
        },
        {
          label: "Company State",
          value: address.state,
          setValue: (value) => handleAddressChange("state", value),
          type: "text",
        },
        {
          label: "Company Postal Code",
          value: address.postalCode,
          setValue: (value) => handleAddressChange("postalCode", value),
          type: "text",
        },
        {
          label: "Company Country",
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
            name={field.name || field.label.toLowerCase().replace(" ", "")}
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
          <option value="">Select Industry</option>
          <option value="Technology">Technology</option>
          <option value="Retail">Retail</option>
          <option value="Finance">Finance</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Education">Education</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Other">Other</option>
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
            "Create Company"
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateCompanyForm;
