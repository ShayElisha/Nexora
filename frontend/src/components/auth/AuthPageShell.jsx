import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applyDesignTheme, getStoredTheme } from "../../lib/designThemes";
import LandingHeader from "../home/LandingHeader";
import AuthCanvas from "./AuthCanvas";

const AuthPageShell = ({ children, align = "start" }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  useEffect(() => {
    applyDesignTheme(getStoredTheme());
  }, []);

  return (
    <div
      className={`min-h-screen antialiased ${isRTL ? "font-hebrew" : "font-sans"}`}
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <LandingHeader
        onSignIn={() => navigate("/login")}
        onDemo={() => navigate("/contact")}
      />
      <AuthCanvas align={align} className="nx-page-shell nx-page-shell--auth pt-24 pb-16">
        {children}
      </AuthCanvas>
    </div>
  );
};

export default AuthPageShell;
