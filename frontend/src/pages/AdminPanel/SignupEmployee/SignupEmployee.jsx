import { useState, useEffect } from "react";
import EmployeeSignUp from "../../auth/SignUpPage";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import areaCode from "./areaCode.json";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const SignupEmployee = () => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

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
    <div 
      className="min-h-screen relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
            opacity: 0.15
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ 
            background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
            opacity: 0.15
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Employee Signup Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-color)',
            border: '2px solid var(--border-color)'
          }}
        >
          {/* Decorative top border */}
          <div
            className="h-2"
            style={{
              background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`
            }}
          />
          <div className="p-8">
            <h2 
              className="text-2xl sm:text-3xl font-bold mb-6"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
            {t("signupEmployee.instructions.employee_signup")}
          </h2>
            <EmployeeSignUp />
          </div>
        </motion.div>

        {/* QR Code and Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-color)',
            border: '2px solid var(--border-color)'
          }}
        >
          <div
            className="h-2"
            style={{
              background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`
            }}
          />
          <div className="p-8">
            <h2 
              className="text-2xl sm:text-3xl font-bold mb-6"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
            {t("signupEmployee.instructions.scan_qr_code")}
          </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="p-6 rounded-2xl shadow-xl"
                style={{
                  backgroundColor: 'white',
                  border: '3px solid var(--color-primary)'
                }}
              >
              <QRCodeSVG
                value={registrationUrl}
                  size={160}
                  level="H"
                  className="rounded-lg"
              />
              </motion.div>
              <div className="flex flex-col gap-4">
            <button
              onClick={handleCopyLink}
                  className="px-8 py-3 font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                  style={{
                    background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                    color: 'var(--button-text)'
                  }}
                >
                  📋 {t("signupEmployee.buttons.copy_link")}
            </button>
                <div 
                  className="text-xs text-center px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-accent)',
                    color: 'white'
                  }}
                >
                  🔒 קישור מאובטח
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Send Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-color)',
            border: '2px solid var(--border-color)'
          }}
        >
          <div
            className="h-2"
            style={{
              background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`
            }}
          />
          <div className="p-8">
            <h3 
              className="text-xl sm:text-2xl font-bold mb-6"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
            {t("signupEmployee.instructions.select_send_option")}
          </h3>

            {/* Send Options - Modern Toggle Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setSendOption("email")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
                  sendOption === "email" ? 'shadow-xl' : 'shadow-md'
                }`}
                style={{
                  background: sendOption === "email" 
                    ? `linear-gradient(to right, var(--color-primary), var(--color-secondary))`
                    : 'var(--border-color)',
                  color: sendOption === "email" ? 'var(--button-text)' : 'var(--text-color)',
                  border: sendOption === "email" ? 'none' : '2px solid var(--border-color)'
                }}
              >
                📧 {t("signupEmployee.options.email")}
              </button>
              <button
                onClick={() => setSendOption("sms")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
                  sendOption === "sms" ? 'shadow-xl' : 'shadow-md'
                }`}
                style={{
                  background: sendOption === "sms" 
                    ? `linear-gradient(to right, var(--color-primary), var(--color-secondary))`
                    : 'var(--border-color)',
                  color: sendOption === "sms" ? 'var(--button-text)' : 'var(--text-color)',
                  border: sendOption === "sms" ? 'none' : '2px solid var(--border-color)'
                }}
              >
                📱 {t("signupEmployee.options.sms")}
              </button>
            </div>

            {/* Email Field */}
            {sendOption === "email" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <label 
                  className="block text-sm font-semibold mb-3"
                  style={{ color: 'var(--text-color)' }}
                >
                  📧 {t("signupEmployee.form.email_address")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                  placeholder={t("signupEmployee.placeholders.enter_email")}
                  style={{
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    border: '2px solid var(--border-color)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </motion.div>
            )}

            {/* Phone Field */}
            {sendOption === "sms" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <label 
                  className="block text-sm font-semibold mb-3"
                  style={{ color: 'var(--text-color)' }}
                >
                  📱 {t("signupEmployee.form.phone_number")}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full sm:w-40 p-4 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      border: '2px solid var(--border-color)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
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
                    className="flex-1 p-4 rounded-xl shadow-md transition-all duration-300 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                    placeholder={t("signupEmployee.placeholders.enter_phone")}
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      border: '2px solid var(--border-color)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!isLoggedIn}
              className="w-full py-4 font-bold rounded-xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isLoggedIn 
                  ? `linear-gradient(to right, var(--color-primary), var(--color-accent))`
                  : 'var(--border-color)',
                color: isLoggedIn ? 'var(--button-text)' : 'var(--text-color)'
              }}
            >
              {sendOption === "email" ? "📧" : "📱"} {t("signupEmployee.buttons.send_registration_link")}
            </motion.button>
            
            {!isLoggedIn && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-center mt-4"
                style={{ color: 'var(--color-accent)' }}
              >
                ⚠️ עליך להיות מחובר כדי לשלוח קישור
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupEmployee;
