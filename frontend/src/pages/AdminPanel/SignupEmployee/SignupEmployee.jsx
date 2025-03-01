// src/components/procurement/SignupEmployee.jsx
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

  // כתובת ההרשמה (ניתן לשנות לפי הצורך)
  const registrationUrl = `http://localhost:5173/signup`;

  // פונקציה להעתקת הקישור ללוח הגזירים
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
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
    <div className="flex bg-bg min-h-screen text-text">
      <div className="flex-1 p-8">
        {/* כרטיס להרשמה לעובדים */}
        <div className="bg-bg p-6 rounded-lg shadow-md border border-border-color">
          <EmployeeSignUp />
        </div>

        {/* כרטיס עבור QR וקישור */}
        <div className="mt-8 bg-bg p-6 rounded-lg shadow-md border border-border-color">
          <h2 className="text-xl font-semibold text-text mb-4">
            {t("signupEmployee.instructions.scan_qr_code")}
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <QRCodeSVG value={registrationUrl} size={128} />
            <div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-button-bg text-button-text rounded hover:bg-primary transition"
              >
                {t("signupEmployee.buttons.copy_link")}
              </button>
            </div>
          </div>
        </div>

        {/* כרטיס לשליחת הקישור */}
        <div className="mt-8 bg-bg p-6 rounded-lg shadow-md border border-border-color">
          <h3 className="text-lg font-medium text-text">
            {t("signupEmployee.instructions.select_send_option")}
          </h3>
          <div className="flex items-center mt-4">
            <label className="mr-4 text-text cursor-pointer">
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
            <label className="mr-4 text-text cursor-pointer">
              <input
                type="radio"
                name="sendOption"
                value="sms"
                checked={sendOption === "sms"}
                onChange={() => setSendOption("sms")}
                className="mr-2"
              />
              {t("signupEmployee.options.sms")}
            </label>
          </div>

          {/* שדה אימייל */}
          {sendOption === "email" && (
            <div className="mt-4">
              <label className="text-text">
                {t("signupEmployee.form.email_address")}:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ml-2 p-2 border border-border-color rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("signupEmployee.placeholders.enter_email")}
                />
              </label>
            </div>
          )}

          {/* שדה טלפון */}
          {sendOption === "sms" && (
            <div className="mt-4">
              <label className="text-text">
                {t("signupEmployee.form.phone_number")}:
                <div className="flex items-center mt-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="p-2 border border-border-color rounded mr-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="p-2 border border-border-color rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("signupEmployee.placeholders.enter_phone")}
                  />
                </div>
              </label>
            </div>
          )}

          <button
            onClick={handleSend}
            className="mt-6 px-4 py-2 bg-button-bg text-button-text rounded hover:bg-primary transition disabled:opacity-50"
            disabled={!isLoggedIn}
          >
            {t("signupEmployee.buttons.send_registration_link")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupEmployee;
