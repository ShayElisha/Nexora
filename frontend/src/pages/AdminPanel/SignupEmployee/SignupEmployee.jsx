import { useState } from "react";
import EmployeeSignUp from "../../auth/SignUpPage";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import areaCode from "./areaCode.json";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

const SignupEmployee = () => {
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;
  const { t } = useTranslation();

  const [sendOption, setSendOption] = useState("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+972");

  const registrationUrl = `http://localhost:5173/signup`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      toast.success(t("signupEmployee.messages.link_copied"));
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error(t("signupEmployee.errors.copy_link_failed"));
    }
  };

  const handleSend = async () => {
    try {
      if (!authUser) {
        throw new Error(t("signupEmployee.errors.must_be_logged_in"));
      }
      if (sendOption === "email") {
        if (!email)
          throw new Error(t("signupEmployee.errors.enter_valid_email"));
        const response = await axiosInstance.post("/company/sendSignUp", {
          email,
        });
        console.log("Response:", response.data);
        toast.success(t("signupEmployee.messages.email_sent_successfully"));
      } else if (sendOption === "sms") {
        if (!phoneNumber)
          throw new Error(t("signupEmployee.errors.enter_valid_phone"));
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const smsBody = `${t(
          "signupEmployee.messages.register_here"
        )}: ${registrationUrl}`;
        const smsUrl = `sms:${fullPhoneNumber}?body=${encodeURIComponent(
          smsBody
        )}`;
        window.open(smsUrl, "_blank");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || t("signupEmployee.errors.general_error"));
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-text animate-fade-in">
      <div className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto">
        {/* כרטיס להרשמה לעובדים */}
        <div className="bg-accent p-6 rounded-xl shadow-xl border border-border-color mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-text mb-4 tracking-tight drop-shadow-md">
            {t("signupEmployee.instructions.employee_signup")}
          </h2>
          <EmployeeSignUp />
        </div>

        {/* כרטיס עבור QR וקישור */}
        <div className="bg-accent p-6 rounded-xl shadow-xl border border-border-color mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-text mb-4 tracking-tight drop-shadow-md">
            {t("signupEmployee.instructions.scan_qr_code")}
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="p-2 bg-white rounded-lg shadow-md">
              <QRCodeSVG
                value={registrationUrl}
                size={128}
                className="border-4 border-primary rounded-lg"
              />
            </div>
            <div>
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2 bg-button-bg text-button-text rounded-full shadow-lg hover:bg-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {t("signupEmployee.buttons.copy_link")}
              </button>
            </div>
          </div>
        </div>

        {/* כרטיס לשליחת הקישור */}
        <div className="bg-accent p-6 rounded-xl shadow-xl border border-border-color">
          <h3 className="text-lg sm:text-xl font-semibold text-text mb-4 tracking-tight drop-shadow-md">
            {t("signupEmployee.instructions.select_send_option")}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <label className="flex items-center text-text cursor-pointer">
              <input
                type="radio"
                name="sendOption"
                value="email"
                checked={sendOption === "email"}
                onChange={() => setSendOption("email")}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-border-color shadow-sm"
              />
              <span className="text-sm">
                {t("signupEmployee.options.email")}
              </span>
            </label>
            <label className="flex items-center text-text cursor-pointer">
              <input
                type="radio"
                name="sendOption"
                value="sms"
                checked={sendOption === "sms"}
                onChange={() => setSendOption("sms")}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-border-color shadow-sm"
              />
              <span className="text-sm">{t("signupEmployee.options.sms")}</span>
            </label>
          </div>

          {/* שדה אימייל */}
          {sendOption === "email" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-text mb-2 drop-shadow-sm">
                {t("signupEmployee.form.email_address")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50"
                placeholder={t("signupEmployee.placeholders.enter_email")}
              />
            </div>
          )}

          {/* שדה טלפון */}
          {sendOption === "sms" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-text mb-2 drop-shadow-sm">
                {t("signupEmployee.form.phone_number")}
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full sm:w-32 p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
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
                  className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-opacity-50"
                  placeholder={t("signupEmployee.placeholders.enter_phone")}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSend}
            className="w-full sm:w-auto px-6 py-2 bg-button-bg text-button-text rounded-full shadow-lg hover:bg-secondary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            disabled={!isLoggedIn}
          >
            {t("signupEmployee.buttons.send_registration_link")}
          </button>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SignupEmployee;
