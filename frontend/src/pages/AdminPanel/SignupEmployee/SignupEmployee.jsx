import { useState, useEffect } from "react";
import EmployeeSignUp from "../../auth/SignUpPage";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import areaCode from "./areaCode.json";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

const SignupEmployee = () => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;
  const { t } = useTranslation();

  const [sendOption, setSendOption] = useState("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+972");

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
    setParticles(Array.from({ length: 20 }, createParticle));
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
    <div className="min-h-screen bg-bg relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Particle Background */}
      <div className="absolute inset-0 -z-10">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-accent/30"
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 animate-pulse" />
      </div>

      <div className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
        {/* Employee Signup Card */}
        <div className="bg-bg/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border-color/30 animate-slideIn">
          <h2 className="text-2xl sm:text-3xl font-bold text-text p-6 border-b border-border-color/20 tracking-tight">
            {t("signupEmployee.instructions.employee_signup")}
          </h2>
          <div className="p-6">
            <EmployeeSignUp />
          </div>
        </div>

        {/* QR Code and Link Card */}
        <div className="bg-bg/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border-color/30 animate-slideIn delay-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-text p-6 border-b border-border-color/20 tracking-tight">
            {t("signupEmployee.instructions.scan_qr_code")}
            <span className="absolute -bottom-1 left-6 w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
          </h2>
          <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="p-3 bg-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
              <QRCodeSVG
                value={registrationUrl}
                size={128}
                className="border-4 border-primary rounded-lg"
              />
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-6 py-3 bg-button-bg text-button-text font-semibold rounded-full shadow-lg hover:bg-accent focus:ring-4 focus:ring-primary/50 transition-all duration-300 transform hover:scale-105"
            >
              {t("signupEmployee.buttons.copy_link")}
            </button>
          </div>
        </div>

        {/* Send Link Card */}
        <div className="bg-bg/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border-color/30 animate-slideIn delay-200">
          <h3 className="text-xl sm:text-2xl font-bold text-text p-6 border-b border-border-color/20 tracking-tight">
            {t("signupEmployee.instructions.select_send_option")}
            <span className="absolute -bottom-1 left-6 w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
          </h3>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <label className="flex items-center text-text cursor-pointer group">
                <input
                  type="radio"
                  name="sendOption"
                  value="email"
                  checked={sendOption === "email"}
                  onChange={() => setSendOption("email")}
                  className="mr-2 h-5 w-5 text-primary focus:ring-primary border-border-color/50 transition-colors duration-300"
                />
                <span className="text-sm text-secondary group-hover:text-text transition-colors duration-300">
                  {t("signupEmployee.options.email")}
                </span>
              </label>
              <label className="flex items-center text-text cursor-pointer group">
                <input
                  type="radio"
                  name="sendOption"
                  value="sms"
                  checked={sendOption === "sms"}
                  onChange={() => setSendOption("sms")}
                  className="mr-2 h-5 w-5 text-primary focus:ring-primary border-border-color/50 transition-colors duration-300"
                />
                <span className="text-sm text-secondary group-hover:text-text transition-colors duration-300">
                  {t("signupEmployee.options.sms")}
                </span>
              </label>
            </div>

            {/* Email Field */}
            {sendOption === "email" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                  {t("signupEmployee.form.email_address")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-border-color rounded-lg bg-bg/50 text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 shadow-md"
                  placeholder={t("signupEmployee.placeholders.enter_email")}
                />
              </div>
            )}

            {/* Phone Field */}
            {sendOption === "sms" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                  {t("signupEmployee.form.phone_number")}
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full sm:w-36 p-3 border border-border-color rounded-lg bg-bg/50 text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 shadow-md"
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
                    className="w-full p-3 border border-border-color rounded-lg bg-bg/50 text-text placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 shadow-md"
                    placeholder={t("signupEmployee.placeholders.enter_phone")}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSend}
              className="w-full sm:w-auto px-6 py-3 bg-button-bg text-button-text font-semibold rounded-full shadow-lg hover:bg-accent focus:ring-4 focus:ring-primary/50 disabled:bg-secondary/50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              disabled={!isLoggedIn}
            >
              {t("signupEmployee.buttons.send_registration_link")}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </div>
  );
};

export default SignupEmployee;
