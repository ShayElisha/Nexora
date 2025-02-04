// src/components/procurement/SignupEmployee.jsx
import { useState } from "react";
import Sidebar from "../layouts/Sidebar";
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
  const { t } = useTranslation(); // שימוש במילון 'signupEmployee'

  const [sendOption, setSendOption] = useState("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+972");

  // כתובת ההרשמה (נשארת ללא שינוי טקסטואלי)
  const registrationUrl = `http://localhost:5173/signup`;

  // פונקציה להעתקת הלינק ללוח הגזירים
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

        // בניית מספר טלפון מלא כולל קידומת
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;

        // בניית URL של SMS עם גוף ההודעה
        const smsBody = `${t(
          "signupEmployee.messages.register_here"
        )}: ${registrationUrl}`;
        // הקפד להשתמש ב־encodeURIComponent עבור הטקסט
        const smsUrl = `sms:${fullPhoneNumber}?body=${encodeURIComponent(
          smsBody
        )}`;

        // פתיחת הקישור - יפעיל את אפליקציית ההודעות במכשיר
        window.open(smsUrl, "_blank");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || t("signupEmployee.errors.general_error"));
    }
  };

  return (
    <div className="flex bg-gray-900 min-h-screen text-white">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* כרטיס עבור טופס הרשמה */}
        <div className="bg-gray-800 p-6 rounded shadow-md">
          <EmployeeSignUp />
        </div>

        {/* כרטיס עבור QR וקישורים */}
        <div className="mt-8 bg-gray-800 p-6 rounded shadow-md">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">
            {t("signupEmployee.instructions.scan_qr_code")}
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* QR Code */}
            <QRCodeSVG value={registrationUrl} size={128} />
            {/* העתקת קישור */}
            <div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* כרטיס עבור שליחת הקישור */}
        <div className="mt-8 bg-gray-800 p-6 rounded shadow-md">
          <h3 className="text-lg font-medium text-gray-200">
            {t("signupEmployee.instructions.select_send_option")}
          </h3>
          <div className="flex items-center mt-4">
            <label className="mr-4 text-gray-300 cursor-pointer">
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
            <label className="mr-4 text-gray-300 cursor-pointer">
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

          {/* שדה אימייל (רק כאשר sendOption = email) */}
          {sendOption === "email" && (
            <div className="mt-4">
              <label className="text-gray-300">
                {t("signupEmployee.form.email_address")}:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ml-2 p-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder={t("signupEmployee.placeholders.enter_email")}
                />
              </label>
            </div>
          )}

          {/* שדה טלפון (רק כאשר sendOption = sms) */}
          {sendOption === "sms" && (
            <div className="mt-4">
              <label className="text-gray-300">
                {t("signupEmployee.form.phone_number")}:
                <div className="flex items-center mt-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="p-2 border border-gray-600 rounded mr-2 bg-gray-700 text-white focus:outline-none focus:ring focus:ring-blue-500"
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
                    className="p-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring focus:ring-blue-500"
                    placeholder={t("signupEmployee.placeholders.enter_phone")}
                  />
                </div>
              </label>
            </div>
          )}

          <button
            onClick={handleSend}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
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
