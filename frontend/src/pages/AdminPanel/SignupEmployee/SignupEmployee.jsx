// src/components/procurement/SignupEmployee.jsx
import { useState } from "react";
import Sidebar from "../layouts/Sidebar";
import EmployeeSignUp from "../../auth/SignUpPage";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import areaCode from "./areaCode.json";
import { useTranslation } from "react-i18next";

const SignupEmployee = ({ authUser }) => {
  const { t } = useTranslation(); // שימוש במילון 'signupEmployee'

  const [sendOption, setSendOption] = useState("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+972");

  const registrationUrl = `http://localhost:5173/auth/signup`;

  const handleSend = async () => {
    try {
      if (!authUser) {
        throw new Error(t("signupEmployee.errors.must_be_logged_in"));
      }

      if (sendOption === "email") {
        if (!email)
          throw new Error(t("signupEmployee.errors.enter_valid_email"));

        const response = await axiosInstance.post("/companies/sendSignUp", {
          email,
        });

        console.log("Response:", response.data);
        toast.success(t("signupEmployee.messages.email_sent_successfully"));
      } else if (sendOption === "whatsapp") {
        if (!phoneNumber)
          throw new Error(t("signupEmployee.errors.enter_valid_phone"));

        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const whatsappUrl = `http://api.whatsapp.com/send?phone=${fullPhoneNumber}&text=${encodeURIComponent(
          `${t("signupEmployee.messages.register_here")}: ${registrationUrl}`
        )}`;
        window.open(whatsappUrl, "_blank");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || t("signupEmployee.errors.general_error"));
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <EmployeeSignUp />
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-300">
            {t("signupEmployee.instructions.scan_qr_code")}
          </h2>
          <QRCodeSVG value={registrationUrl} size={128} />
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-300">
            {t("signupEmployee.instructions.select_send_option")}
          </h3>
          <div className="flex items-center mt-4">
            <label className="mr-4 text-gray-300">
              <input
                type="radio"
                name="sendOption"
                value="email"
                checked={sendOption === "email"}
                onChange={() => setSendOption("email")}
                className="mr-2"
              />
              {t("signupEmployee.options.email")}
            </label>
            <label className="mr-4 text-gray-300">
              <input
                type="radio"
                name="sendOption"
                value="whatsapp"
                checked={sendOption === "whatsapp"}
                onChange={() => setSendOption("whatsapp")}
                className="mr-2"
              />
              {t("signupEmployee.options.whatsapp")}
            </label>
          </div>
          {sendOption === "email" && (
            <div className="mt-4">
              <label className="text-gray-300">
                {t("signupEmployee.form.email_address")}:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ml-2 p-2 border rounded bg-gray-700 text-white"
                  placeholder={t("signupEmployee.placeholders.enter_email")}
                />
              </label>
            </div>
          )}
          {sendOption === "whatsapp" && (
            <div className="mt-4">
              <label className="text-gray-300">
                {t("signupEmployee.form.phone_number")}:
                <div className="flex items-center">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="p-2 border rounded mr-2 bg-gray-700 text-white"
                  >
                    {areaCode.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="p-2 border rounded bg-gray-700 text-white"
                    placeholder={t("signupEmployee.placeholders.enter_phone")}
                  />
                </div>
              </label>
            </div>
          )}
          <button
            onClick={handleSend}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t("signupEmployee.buttons.send_registration_link")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupEmployee;
